#!/usr/bin/env python3
"""Check post-publish review card completeness for article-video artifacts."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


REQUIRED_CARD_KEYS = [
    "One-line verdict:",
    "Next video change:",
    "Confidence:",
    "Data readiness:",
    "Next check time",
]

CANONICAL_NEXT_CHECK_KEY = "Next check time (Asia/Taipei):"
CANONICAL_STATUS_VALUES = {"PASS", "WARN", "FAIL"}
LEGACY_ONSET_TARGET_RE = re.compile(
    r"0\.(?:7[5-9]|8\d|9\d)\s*-\s*1\.0\d?\s*s?",
    re.IGNORECASE,
)
NUMERIC_RANGE_RE = re.compile(r"\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?")

EN_MEASURABLE_TOKENS = (
    "at least",
    "at most",
    "no more than",
    "no less than",
    "within",
    "between",
    "under ",
    "over ",
    "max ",
    "min ",
    "target",
    "comfort",
    "hard-pass",
)
ZH_MEASURABLE_TOKENS = (
    "至少",
    "不超過",
    "上限",
    "下限",
    "以內",
    "以上",
    "以下",
    "最多",
    "最少",
    "範圍",
    "目標",
)


def _load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _detect_publish_status(artifact_dir: Path) -> tuple[bool, str]:
    upload_result = artifact_dir / "youtube" / "upload-result.json"
    if upload_result.exists():
        data = _load_json(upload_result)
        status = str(data.get("status", "")).strip()
        visibility = str(data.get("visibility", "")).strip().lower()
        upload_type = str(data.get("upload_type", "")).strip().lower()
        if visibility == "public":
            return True, status or "public_visibility"
        if "public" in status.lower() or "published" in status.lower():
            return True, status
        if "already_public" in upload_type:
            return True, status or upload_type
        return False, status or "unknown_upload_status"

    status_md = artifact_dir / "status.md"
    if status_md.exists():
        text = status_md.read_text(encoding="utf-8", errors="replace")
        # Common status format: "Upload: published_public_verified"
        match = re.search(r"(?im)^Upload:\s*(.+)$", text)
        if match:
            upload_status = match.group(1).strip()
            lowered = upload_status.lower()
            if "public" in lowered or "published" in lowered:
                return True, upload_status
            return False, upload_status

    return False, "missing_upload_status"


def _is_testable_next_change(change_text: str) -> bool:
    text = change_text.strip()
    if not text:
        return False

    lowered = text.lower()
    if any(token in text for token in ("<=", ">=", "≤", "≥")):
        return True
    if NUMERIC_RANGE_RE.search(text):
        return True
    if not re.search(r"\d", text):
        return False
    if any(token in lowered for token in EN_MEASURABLE_TOKENS):
        return True
    if any(token in text for token in ZH_MEASURABLE_TOKENS):
        return True
    return False


def _check_card(card_path: Path) -> tuple[bool, list[str], list[str], str]:
    if not card_path.exists():
        return False, REQUIRED_CARD_KEYS.copy(), [], "missing_file"

    text = card_path.read_text(encoding="utf-8", errors="replace")
    missing = [key for key in REQUIRED_CARD_KEYS if key not in text]
    warnings: list[str] = []

    readiness = ""
    status_value = ""
    has_exact_next_check_key = False
    has_generic_next_check_key = False
    has_readiness_evidence = False
    has_legacy_onset_target = False
    next_video_change_text = ""

    for line in text.splitlines():
        stripped = line.strip()
        lowered = stripped.lower()
        if lowered.startswith("- data readiness:"):
            readiness = stripped.split(":", 1)[1].strip().lower()
        if lowered.startswith("- readiness evidence:"):
            has_readiness_evidence = True
        if lowered.startswith("- status:"):
            status_value = stripped.split(":", 1)[1].strip().upper()
        if lowered.startswith("- next video change:"):
            next_video_change_text = stripped.split(":", 1)[1].strip()
        if stripped.startswith(f"- {CANONICAL_NEXT_CHECK_KEY}"):
            has_exact_next_check_key = True
        elif lowered.startswith("- next check time:"):
            has_generic_next_check_key = True
        if "onset" in lowered and LEGACY_ONSET_TARGET_RE.search(lowered):
            has_legacy_onset_target = True

    if readiness and readiness not in {"ready", "insufficient_data"}:
        missing.append("Data readiness must be ready|insufficient_data")
    elif readiness == "insufficient_data" and not has_readiness_evidence:
        warnings.append("missing_readiness_evidence_for_insufficient_data")

    if not status_value:
        warnings.append("missing_status_label")
    elif status_value not in CANONICAL_STATUS_VALUES:
        warnings.append("invalid_status_value")

    if not has_exact_next_check_key and has_generic_next_check_key:
        warnings.append("noncanonical_next_check_label")
    if has_legacy_onset_target:
        warnings.append("legacy_onset_target_range_in_post_publish_card")
    if next_video_change_text and not _is_testable_next_change(next_video_change_text):
        warnings.append("next_video_change_not_testable")

    return len(missing) == 0, missing, warnings, "ok"


def _final_status(result: dict[str, Any]) -> str:
    status = str(result.get("status", "SKIP"))
    warnings = result.get("warnings") or []
    if status == "PASS" and warnings:
        return "PASS_WITH_WARNINGS"
    return status


def _overall_status(results: list[dict[str, Any]]) -> str:
    statuses = {_final_status(r) for r in results}
    if "FAIL" in statuses:
        return "FAIL"
    if "PASS_WITH_WARNINGS" in statuses:
        return "PASS_WITH_WARNINGS"
    return "PASS"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate review/post-publish-review-card.md for a video artifact."
    )
    parser.add_argument(
        "artifact_dirs",
        nargs="+",
        help="One or more reports/article-video-publisher/YYYY-MM-DD/<slug> artifact directories",
    )
    parser.add_argument(
        "--json-out",
        dest="json_out",
        help="Optional output path for machine-readable result JSON",
    )
    args = parser.parse_args()

    results: list[dict[str, Any]] = []
    for raw in args.artifact_dirs:
        artifact_dir = Path(raw).resolve()
        card_path = artifact_dir / "review" / "post-publish-review-card.md"
        published, upload_status = _detect_publish_status(artifact_dir)

        result: dict[str, Any] = {
            "artifact_dir": str(artifact_dir),
            "published": published,
            "upload_status": upload_status,
            "card_path": str(card_path),
            "card_exists": card_path.exists(),
            "status": "SKIP",
            "missing": [],
            "warnings": [],
            "reason": "",
        }

        if not published:
            result["status"] = "SKIP"
            result["reason"] = "not_public_upload_status"
        else:
            passed, missing, warnings, reason = _check_card(card_path)
            result["missing"] = missing
            result["warnings"] = warnings
            result["reason"] = reason
            result["status"] = "PASS" if passed else "FAIL"

        results.append(result)

    if len(results) == 1:
        payload: dict[str, Any] = results[0]
    else:
        failed = [r for r in results if r["status"] == "FAIL"]
        payload = {
            "processed": len(results),
            "failures": len(failed),
            "status": _overall_status(results),
            "results": results,
        }

    if args.json_out:
        out_path = Path(args.json_out).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0 if all(r["status"] in {"PASS", "SKIP"} for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
