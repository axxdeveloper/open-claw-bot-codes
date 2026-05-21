#!/usr/bin/env python3
"""Warn when post-publish next-change misses pre-analytics WARN dimensions."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


WARN_DIMENSION_PATTERNS = {
    "first30": re.compile(r"(?im)^-\s*First-30-second clarity:\s*WARN\b"),
    "comprehension": re.compile(r"(?im)^-\s*Comprehension load:\s*WARN\b"),
    "mobile": re.compile(r"(?im)^-\s*Mobile readability:\s*WARN\b"),
}

DIMENSION_KEYWORDS = {
    "first30": (
        "first 30",
        "first-30",
        "opening",
        "intro",
        "前 30",
        "前30",
        "開場",
        "onset",
        "首句",
        "30 秒",
        "30秒",
    ),
    "comprehension": (
        "comprehension",
        "理解",
        "術語",
        "新名詞",
        "密度",
        "density",
        "例子",
        "拆解",
        "先講",
    ),
    "mobile": (
        "mobile",
        "手機",
        "thumbnail",
        "封面",
        "title",
        "字級",
        "可讀",
        "<=45",
        "<=90",
        "<=52",
    ),
}


def _load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _is_published(artifact_dir: Path) -> bool:
    upload_result = artifact_dir / "youtube" / "upload-result.json"
    if upload_result.exists():
        data = _load_json(upload_result)
        status = str(data.get("status", "")).lower()
        visibility = str(data.get("visibility", "")).lower()
        upload_type = str(data.get("upload_type", "")).lower()
        if visibility == "public":
            return True
        if "public" in status or "published" in status:
            return True
        if "already_public" in upload_type:
            return True
    status_md = artifact_dir / "status.md"
    if status_md.exists():
        text = status_md.read_text(encoding="utf-8", errors="replace")
        match = re.search(r"(?im)^Upload:\s*(.+)$", text)
        if match and ("public" in match.group(1).lower() or "published" in match.group(1).lower()):
            return True
    return False


def _warn_dimensions(scorecard_text: str) -> list[str]:
    dims: list[str] = []
    for dim, pattern in WARN_DIMENSION_PATTERNS.items():
        if pattern.search(scorecard_text):
            dims.append(dim)
    return dims


def _extract_next_change(card_text: str) -> str:
    for line in card_text.splitlines():
        lower = line.strip().lower()
        if lower.startswith("- next video change:"):
            return line.split(":", 1)[1].strip()
    return ""


def _matches_dimension(next_change: str, dimension: str) -> bool:
    text = next_change.lower()
    for token in DIMENSION_KEYWORDS.get(dimension, ()):
        if token.lower() in text:
            return True
    return False


def _check_artifact(artifact_dir: Path) -> dict[str, Any]:
    result: dict[str, Any] = {
        "artifact_dir": str(artifact_dir),
        "status": "SKIP",
        "warnings": [],
        "warn_dimensions": [],
    }
    if not _is_published(artifact_dir):
        result["reason"] = "not_public_upload_status"
        return result

    scorecard_path = artifact_dir / "review" / "pre-analytics-quality-scorecard.md"
    card_path = artifact_dir / "review" / "post-publish-review-card.md"
    if not scorecard_path.exists() or not card_path.exists():
        result["reason"] = "missing_scorecard_or_post_publish_card"
        return result

    scorecard_text = scorecard_path.read_text(encoding="utf-8", errors="replace")
    card_text = card_path.read_text(encoding="utf-8", errors="replace")
    next_change = _extract_next_change(card_text)
    dims = _warn_dimensions(scorecard_text)

    warnings: list[str] = []
    if dims and not next_change:
        warnings.append("missing_next_video_change_for_warned_dimensions")
    else:
        for dim in dims:
            if not _matches_dimension(next_change, dim):
                warnings.append(f"preanalytics_{dim}_warn_not_reflected_in_next_video_change")

    result["warn_dimensions"] = dims
    result["next_video_change"] = next_change
    result["warnings"] = warnings
    result["status"] = "PASS"
    return result


def _overall_status(results: list[dict[str, Any]]) -> str:
    warn_exists = any(r.get("warnings") for r in results if r.get("status") == "PASS")
    if warn_exists:
        return "PASS_WITH_WARNINGS"
    return "PASS"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check whether post-publish next-change covers pre-analytics WARN dimensions."
    )
    parser.add_argument("artifact_dirs", nargs="+")
    parser.add_argument("--json-out", dest="json_out")
    args = parser.parse_args()

    results = [_check_artifact(Path(raw).resolve()) for raw in args.artifact_dirs]
    if len(results) == 1:
        payload: dict[str, Any] = results[0]
    else:
        payload = {
            "processed": len(results),
            "status": _overall_status(results),
            "results": results,
        }

    if args.json_out:
        out = Path(args.json_out).resolve()
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
