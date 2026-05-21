#!/usr/bin/env python3
"""Check for stale Chrome/Playwright state after browser automation."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import urllib.error
import urllib.request
from typing import Any


DEFAULT_PROFILE_ROOT = "/Users/openclaw-user/.openclaw/browser/openclaw/user-data"


def fetch_json(url: str, timeout: float) -> tuple[dict[str, Any] | list[Any] | None, str | None]:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8")), None
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        return None, str(exc)


def read_processes() -> list[dict[str, Any]]:
    output = subprocess.check_output(
        ["ps", "-axo", "pid=,ppid=,pcpu=,etime=,stat=,command="],
        text=True,
    )
    processes: list[dict[str, Any]] = []
    for line in output.splitlines():
        parts = line.strip().split(None, 5)
        if len(parts) < 6:
            continue
        pid, ppid, pcpu, etime, stat, command = parts
        try:
            cpu = float(pcpu)
        except ValueError:
            cpu = 0.0
        processes.append(
            {
                "pid": int(pid),
                "ppid": int(ppid),
                "cpu": cpu,
                "etime": etime,
                "stat": stat,
                "command": command,
            }
        )
    return processes


def is_browser_related(command: str, profile_root: str) -> bool:
    lowered = command.lower()
    if profile_root and profile_root in command:
        return True
    return any(
        marker in lowered
        for marker in (
            "remote-debugging-port=18800",
            "ms-playwright",
            "playwright_chromium",
            "playwright-firefox",
            "playwright-webkit",
            "chromium.app/contents/macos/chromium",
            "google chrome for testing",
        )
    )


def compact_process(process: dict[str, Any]) -> dict[str, Any]:
    command = process["command"]
    if len(command) > 260:
        command = command[:257] + "..."
    return {
        "pid": process["pid"],
        "ppid": process["ppid"],
        "cpu": process["cpu"],
        "etime": process["etime"],
        "stat": process["stat"],
        "command": command,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check CDP tabs and Chrome/Playwright processes after browser automation."
    )
    parser.add_argument("--port", type=int, default=18800, help="Chrome remote debugging port")
    parser.add_argument("--profile-root", default=DEFAULT_PROFILE_ROOT)
    parser.add_argument("--timeout", type=float, default=2.0)
    parser.add_argument("--cpu-threshold", type=float, default=75.0)
    parser.add_argument("--max-tabs", type=int, default=8)
    parser.add_argument("--strict", action="store_true", help="Exit 1 when warnings are found")
    args = parser.parse_args()

    version, version_error = fetch_json(f"http://127.0.0.1:{args.port}/json/version", args.timeout)
    tabs, tabs_error = fetch_json(f"http://127.0.0.1:{args.port}/json/list", args.timeout)

    processes = [p for p in read_processes() if is_browser_related(p["command"], args.profile_root)]
    high_cpu = [p for p in processes if p["cpu"] >= args.cpu_threshold]
    unusual_state = [p for p in processes if "U" in p["stat"] and p["cpu"] >= 10.0]

    warnings: list[str] = []
    if version_error and processes:
        warnings.append(f"CDP port {args.port} did not answer while browser-related processes exist")
    if isinstance(tabs, list) and len(tabs) > args.max_tabs:
        warnings.append(f"CDP has {len(tabs)} open targets, above max {args.max_tabs}")
    if high_cpu:
        warnings.append(f"{len(high_cpu)} browser-related process(es) exceed CPU threshold")
    if unusual_state:
        warnings.append(f"{len(unusual_state)} browser-related process(es) have unusual state")

    result = {
        "status": "warn" if warnings else "ok",
        "warnings": warnings,
        "cdp": {
            "port": args.port,
            "version_ok": version is not None,
            "version_error": version_error,
            "browser": version.get("Browser") if isinstance(version, dict) else None,
            "targets": len(tabs) if isinstance(tabs, list) else None,
            "targets_error": tabs_error,
        },
        "processes": {
            "browser_related_count": len(processes),
            "high_cpu": [compact_process(p) for p in high_cpu[:10]],
            "unusual_state": [compact_process(p) for p in unusual_state[:10]],
        },
    }
    print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
    return 1 if args.strict and warnings else 0


if __name__ == "__main__":
    sys.exit(main())
