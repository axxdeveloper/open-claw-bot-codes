#!/usr/bin/env python3
"""Find the public Blogger article that matches a source-intro artifact."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


WORKSPACE = Path(__file__).resolve().parents[3]
DEFAULT_BLOGGER_ROOT = WORKSPACE / "reports" / "blogger-publishing"


def norm_url(value: str | None) -> str:
    if not value:
        return ""
    return value.strip().rstrip("/")


def load_json(path: Path) -> dict[str, Any] | None:
    try:
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def iter_values(data: Any) -> list[str]:
    values: list[str] = []
    if isinstance(data, dict):
        for value in data.values():
            values.extend(iter_values(value))
    elif isinstance(data, list):
        for value in data:
            values.extend(iter_values(value))
    elif isinstance(data, str):
        values.append(data)
    return values


def public_url_from(data: dict[str, Any]) -> str:
    candidates = [
        data.get("public_url"),
        data.get("public_verification", {}).get("public_url")
        if isinstance(data.get("public_verification"), dict)
        else None,
    ]
    for candidate in candidates:
        if isinstance(candidate, str) and candidate.startswith("https://todayshipdoc.blogspot.com/"):
            return candidate
    return ""


def looks_public(data: dict[str, Any]) -> bool:
    status = str(data.get("status", "")).lower()
    if "published" in status or "public" in status:
        return True

    if data.get("http_status") == 200:
        return True

    verification = data.get("public_verification")
    if isinstance(verification, dict) and verification.get("http_status") == 200:
        return True

    # Legacy publish-result shape used `verification.public_page_http_status`.
    legacy_verification = data.get("verification")
    if isinstance(legacy_verification, dict) and legacy_verification.get("public_page_http_status") == 200:
        return True

    return False


def result_payload(path: Path, data: dict[str, Any], reason: str) -> dict[str, Any]:
    return {
        "found": True,
        "public_url": public_url_from(data),
        "result_path": str(path),
        "match_reason": reason,
    }


def find_by_artifact_basename(root: Path, basename: str) -> dict[str, Any] | None:
    if not basename:
        return None

    candidates = sorted(
        root.glob(f"*/{basename}/publish-result.json"),
        key=lambda p: p.stat().st_mtime if p.exists() else 0,
        reverse=True,
    )
    for path in candidates:
        data = load_json(path)
        if data and public_url_from(data) and looks_public(data):
            return result_payload(path, data, "artifact_basename")
    return None


def find_by_urls(root: Path, urls: set[str]) -> dict[str, Any] | None:
    if not urls:
        return None

    candidates = sorted(
        root.glob("*/*/publish-result.json"),
        key=lambda p: p.stat().st_mtime if p.exists() else 0,
        reverse=True,
    )
    for path in candidates:
        data = load_json(path)
        if not data or not public_url_from(data) or not looks_public(data):
            continue
        values = {norm_url(value) for value in iter_values(data)}
        if urls & values:
            return result_payload(path, data, "url_match")
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifact-dir", default="")
    parser.add_argument("--source-url", action="append", default=[])
    parser.add_argument("--video-url", action="append", default=[])
    parser.add_argument("--blogger-root", default=str(DEFAULT_BLOGGER_ROOT))
    args = parser.parse_args()

    root = Path(args.blogger_root)
    artifact_basename = Path(args.artifact_dir).name if args.artifact_dir else ""
    urls = {norm_url(url) for url in [*args.source_url, *args.video_url] if norm_url(url)}

    result = find_by_artifact_basename(root, artifact_basename)
    if result is None:
        result = find_by_urls(root, urls)

    if result is None:
        result = {
            "found": False,
            "public_url": None,
            "result_path": None,
            "match_reason": None,
        }

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
