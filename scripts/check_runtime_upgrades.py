#!/usr/bin/env python3
"""Check Codex/OpenClaw runtime versions and security posture.

This watcher intentionally does not install upgrades. Global CLI/package
upgrades can interrupt OpenClaw runtime state, so the script produces a
version/security report that can be reviewed before applying changes.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from typing import Any


WORKSPACE = Path(__file__).resolve().parents[1]
STATE_FILE = WORKSPACE / "memory/runtime-upgrade-watch.json"
REPORT_DIR = WORKSPACE / "reports/runtime-upgrades"
TAIPEI = dt.timezone(dt.timedelta(hours=8))

GLOBAL_PACKAGE_ROOTS = [
    Path("/Users/openclaw-user/.npm-global/lib/node_modules"),
    Path("/usr/local/lib/node_modules"),
]

WATCHED_PACKAGES = [
    {
        "id": "codex",
        "npm_name": "@openai/codex",
        "binary": "codex",
        "version_args": ["--version"],
        "binary_version_pattern": r"(\d+(?:\.\d+){1,3})",
    },
    {
        "id": "openclaw",
        "npm_name": "openclaw",
        "binary": "openclaw",
        "version_args": ["--version"],
        "binary_version_pattern": r"(\d{4}\.\d+\.\d+|\d+(?:\.\d+){1,3})",
    },
]


def run(cmd: list[str], *, cwd: Path | None = None, timeout: int = 25) -> dict[str, Any]:
    try:
        completed = subprocess.run(
            cmd,
            cwd=str(cwd) if cwd else None,
            timeout=timeout,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        return {
            "ok": completed.returncode == 0,
            "returncode": completed.returncode,
            "stdout": completed.stdout.strip(),
            "stderr": completed.stderr.strip(),
        }
    except subprocess.TimeoutExpired as exc:
        return {
            "ok": False,
            "returncode": None,
            "stdout": (exc.stdout or "").strip() if isinstance(exc.stdout, str) else "",
            "stderr": f"TimeoutExpired after {timeout}s",
        }
    except FileNotFoundError as exc:
        return {"ok": False, "returncode": None, "stdout": "", "stderr": str(exc)}


def parse_jsonish_version(output: str) -> str | None:
    output = output.strip()
    if not output:
        return None
    try:
        value = json.loads(output)
        if isinstance(value, str):
            return value
    except json.JSONDecodeError:
        pass
    match = re.search(r"(\d{4}\.\d+\.\d+|\d+(?:\.\d+){1,3})", output)
    return match.group(1) if match else output.splitlines()[-1].strip()


def semver_tuple(version: str | None) -> tuple[int, ...] | None:
    if not version:
        return None
    match = re.search(r"(\d+(?:\.\d+){1,3})", version)
    if not match:
        return None
    return tuple(int(part) for part in match.group(1).split("."))


def version_gt(left: str | None, right: str | None) -> bool:
    left_tuple = semver_tuple(left)
    right_tuple = semver_tuple(right)
    if left_tuple is None or right_tuple is None:
        return False
    length = max(len(left_tuple), len(right_tuple))
    return left_tuple + (0,) * (length - len(left_tuple)) > right_tuple + (0,) * (length - len(right_tuple))


def npm_latest(package: str, timeout: int) -> dict[str, Any]:
    result = run(["npm", "view", package, "version", "--json"], timeout=timeout)
    result["version"] = parse_jsonish_version(result["stdout"])
    return result


def npm_global_root(timeout: int) -> Path | None:
    result = run(["npm", "root", "-g"], timeout=timeout)
    if not result["ok"] or not result["stdout"]:
        return None
    return Path(result["stdout"].splitlines()[-1].strip())


def package_json_path(root: Path, package: str) -> Path:
    return root / package / "package.json"


def read_package_json(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def installed_packages(package: str, timeout: int) -> list[dict[str, Any]]:
    roots = list(GLOBAL_PACKAGE_ROOTS)
    root = npm_global_root(timeout)
    if root:
        roots.insert(0, root)

    seen: set[Path] = set()
    installed: list[dict[str, Any]] = []
    for root_path in roots:
        path = package_json_path(root_path, package)
        if path in seen or not path.exists():
            continue
        seen.add(path)
        pkg = read_package_json(path)
        if not pkg:
            installed.append({"path": str(path), "error": "package_json_unreadable"})
            continue
        installed.append(
            {
                "path": str(path),
                "name": pkg.get("name"),
                "version": pkg.get("version"),
                "bin": pkg.get("bin"),
            }
        )
    return installed


def binary_version(spec: dict[str, Any], timeout: int) -> dict[str, Any]:
    binary = spec["binary"]
    path = shutil.which(binary)
    if not path:
        return {"path": None, "version": None, "ok": False, "error": "not_in_path"}
    result = run([binary, *spec["version_args"]], timeout=timeout)
    pattern = spec.get("binary_version_pattern")
    version = None
    if pattern:
        combined = "\n".join([result.get("stdout", ""), result.get("stderr", "")])
        match = re.search(pattern, combined)
        version = match.group(1) if match else None
    return {
        "path": path,
        "version": version or parse_jsonish_version(result.get("stdout", "")),
        "ok": result["ok"],
        "stdout": result.get("stdout", ""),
        "stderr": result.get("stderr", ""),
    }


def audit_exact_packages(packages: list[tuple[str, str]], timeout: int) -> dict[str, Any]:
    if not packages:
        return {"status": "skipped", "reason": "no_exact_packages"}
    with tempfile.TemporaryDirectory(prefix="runtime-upgrade-audit-") as tmp:
        tmp_path = Path(tmp)
        package_json = {
            "name": "openclaw-runtime-upgrade-audit",
            "private": True,
            "version": "0.0.0",
            "dependencies": {name: version for name, version in packages},
        }
        (tmp_path / "package.json").write_text(json.dumps(package_json, indent=2), encoding="utf-8")

        install = run(
            [
                "npm",
                "install",
                "--package-lock-only",
                "--ignore-scripts",
                "--audit=false",
                "--fund=false",
            ],
            cwd=tmp_path,
            timeout=timeout,
        )
        if not install["ok"]:
            return {
                "status": "error",
                "stage": "package-lock",
                "returncode": install["returncode"],
                "stderr": install["stderr"][-2000:],
            }

        audit = run(["npm", "audit", "--json"], cwd=tmp_path, timeout=timeout)
        try:
            payload = json.loads(audit["stdout"] or "{}")
        except json.JSONDecodeError:
            return {
                "status": "error",
                "stage": "audit-json",
                "returncode": audit["returncode"],
                "stderr": audit["stderr"][-2000:],
                "stdout": audit["stdout"][-2000:],
            }

        vulnerabilities = payload.get("metadata", {}).get("vulnerabilities", {})
        advisories = payload.get("vulnerabilities", {})
        severity_counts = {
            key: int(vulnerabilities.get(key, 0) or 0)
            for key in ["info", "low", "moderate", "high", "critical", "total"]
        }
        return {
            "status": "ok",
            "returncode": audit["returncode"],
            "severity_counts": severity_counts,
            "vulnerable_packages": sorted(advisories.keys())[:30],
        }


def load_state() -> dict[str, Any]:
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def write_state(payload: dict[str, Any]) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")


def build_report(payload: dict[str, Any]) -> str:
    lines = [
        f"Runtime upgrade watch - {payload['checked_at_taipei']}",
        "",
        "Version status:",
    ]
    for item in payload["packages"]:
        lines.append(
            f"- {item['npm_name']}: latest {item.get('latest_version') or 'unknown'}, "
            f"active {item.get('active_current_version') or 'unknown'}, "
            f"binary {item['binary'].get('version') or 'not found'}, "
            f"installed {', '.join(p.get('version') or 'unknown' for p in item.get('installed', [])) or 'not found'}"
        )
        if item.get("upgrade_available"):
            lines.append("  - upgrade_available=true")
        if item.get("warnings"):
            for warning in item["warnings"]:
                lines.append(f"  - warning={warning}")

    lines.append("")
    audit = payload.get("security_audit", {})
    if audit.get("status") == "ok":
        counts = audit.get("severity_counts", {})
        lines.append(
            "Security audit:"
            f" total={counts.get('total', 0)}, critical={counts.get('critical', 0)}, "
            f"high={counts.get('high', 0)}, moderate={counts.get('moderate', 0)}"
        )
        if audit.get("vulnerable_packages"):
            lines.append(f"- vulnerable_packages={', '.join(audit['vulnerable_packages'])}")
    else:
        lines.append(f"Security audit: {audit.get('status', 'skipped')} ({audit.get('reason') or audit.get('stage') or 'n/a'})")

    lines.extend(
        [
            "",
            "Upgrade gate:",
            "- Do not blindly install or switch defaults from this report alone.",
            "- Before applying an OpenClaw/Codex upgrade, review release notes/security advisories, run npm audit on the candidate lockfile, backup relevant config/state, then smoke-test Codex CLI auth, OpenClaw gateway/tools, cron model strings, app-server routing, and article-video workflow behavior.",
            "- High or critical vulnerability findings should trigger a patch plan before feature upgrades.",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Check Codex/OpenClaw runtime upgrades and security posture.")
    parser.add_argument("--npm-timeout", type=int, default=35)
    parser.add_argument("--audit-timeout", type=int, default=90)
    parser.add_argument("--skip-security-audit", action="store_true")
    parser.add_argument("--force-report", action="store_true")
    parser.add_argument("--min-interval-hours", type=float, default=20.0)
    parser.add_argument("--ignore-interval", action="store_true")
    parser.add_argument("--no-write", action="store_true")
    args = parser.parse_args()

    checked_at = dt.datetime.now(TAIPEI)
    previous = load_state()
    if (
        previous
        and not args.force_report
        and not args.ignore_interval
        and args.min_interval_hours > 0
        and previous.get("checked_at_utc")
    ):
        try:
            last_check = dt.datetime.fromisoformat(str(previous["checked_at_utc"]))
            if last_check.tzinfo is None:
                last_check = last_check.replace(tzinfo=dt.timezone.utc)
            age_hours = (checked_at.astimezone(dt.timezone.utc) - last_check.astimezone(dt.timezone.utc)).total_seconds() / 3600
            if age_hours < args.min_interval_hours:
                print("NO_REPLY")
                return 0
        except Exception:
            pass
    package_reports: list[dict[str, Any]] = []
    exact_current_packages: list[tuple[str, str]] = []
    changed = not bool(previous)
    has_upgrade = False
    has_warning = False

    for spec in WATCHED_PACKAGES:
        latest = npm_latest(spec["npm_name"], args.npm_timeout)
        installed = installed_packages(spec["npm_name"], args.npm_timeout)
        binary = binary_version(spec, args.npm_timeout)
        primary_installed = installed[0].get("version") if installed else None
        active_current_version = binary.get("version") or primary_installed
        if primary_installed:
            exact_current_packages.append((spec["npm_name"], primary_installed))

        warnings: list[str] = []
        installed_versions = {item.get("version") for item in installed if item.get("version")}
        if len(installed_versions) > 1:
            warnings.append("multiple_global_versions_detected")
        if binary.get("version") and primary_installed and binary["version"] != primary_installed:
            warnings.append("binary_version_differs_from_primary_package")
        if not binary.get("path"):
            warnings.append("binary_not_in_path")
        upgrade_available = version_gt(latest.get("version"), active_current_version)
        has_upgrade = has_upgrade or upgrade_available
        has_warning = has_warning or bool(warnings)

        previous_item = (previous.get("packages_by_id") or {}).get(spec["id"], {})
        if latest.get("version") != previous_item.get("latest_version"):
            changed = True
        if active_current_version != previous_item.get("active_current_version"):
            changed = True
        if primary_installed != previous_item.get("primary_installed_version"):
            changed = True
        if sorted(warnings) != sorted(previous_item.get("warnings", [])):
            changed = True

        package_reports.append(
            {
                "id": spec["id"],
                "npm_name": spec["npm_name"],
                "latest_version": latest.get("version"),
                "latest_lookup_ok": latest["ok"],
                "latest_lookup_stderr": latest.get("stderr", ""),
                "binary": binary,
                "installed": installed,
                "primary_installed_version": primary_installed,
                "active_current_version": active_current_version,
                "upgrade_available": upgrade_available,
                "warnings": warnings,
            }
        )

    if args.skip_security_audit:
        security_audit = {"status": "skipped", "reason": "skip_security_audit"}
    else:
        security_audit = audit_exact_packages(exact_current_packages, args.audit_timeout)
        counts = security_audit.get("severity_counts", {}) if security_audit.get("status") == "ok" else {}
        security_issue = bool(int(counts.get("high", 0) or 0) or int(counts.get("critical", 0) or 0))
        if security_issue:
            changed = True
            has_warning = True
    if security_audit.get("status") != previous.get("security_audit", {}).get("status"):
        changed = True
    if security_audit.get("severity_counts") != previous.get("security_audit", {}).get("severity_counts"):
        changed = True

    payload = {
        "checked_at_utc": checked_at.astimezone(dt.timezone.utc).isoformat(),
        "checked_at_taipei": checked_at.strftime("%Y-%m-%d %H:%M:%S %z"),
        "packages": package_reports,
        "packages_by_id": {
            item["id"]: {
                "latest_version": item.get("latest_version"),
                "active_current_version": item.get("active_current_version"),
                "primary_installed_version": item.get("primary_installed_version"),
                "binary_version": item.get("binary", {}).get("version"),
                "warnings": item.get("warnings", []),
            }
            for item in package_reports
        },
        "security_audit": security_audit,
        "has_upgrade": has_upgrade,
        "has_warning": has_warning,
    }

    if not args.no_write:
        write_state(payload)

    should_report = args.force_report or changed or has_upgrade
    if should_report:
        report = build_report(payload)
        if not args.no_write:
            REPORT_DIR.mkdir(parents=True, exist_ok=True)
            report_path = REPORT_DIR / f"{checked_at.date().isoformat()}.md"
            existing = report_path.read_text(encoding="utf-8") if report_path.exists() else ""
            separator = "\n\n---\n\n" if existing.strip() else ""
            report_path.write_text(existing + separator + report + "\n", encoding="utf-8")
        print(report)
    else:
        print("NO_REPLY")

    return 0


if __name__ == "__main__":
    sys.exit(main())
