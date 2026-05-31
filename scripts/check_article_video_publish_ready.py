#!/usr/bin/env python3
"""Final deterministic upload readiness gate for article videos."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


REQUIRED_PASS_JSON = (
    "description-source-lint.json",
    "source-first-comparison-check.json",
    "validation-lens-drift-check.json",
    "explainer-comprehension-check.json",
    "narration-style-check.json",
    "concept-depth-check.json",
    "visual-cadence-check.json",
    "thumbnail-visual-direction-check.json",
    "title-description-packaging-check.json",
    "title-description-followup-check.json",
    "narration-speed-check.json",
    "audio-smoothing-lint.json",
    "audio-check-gate.json",
    "media-stream-alignment-check.json",
    "audio-pacing-followup-check.json",
    "music-license-check.json",
    "preanalytics-opening-check.json",
    "first60-density-check.json",
    "thumbnail-followup-check.json",
    "shorts-longform-check.json",
)

REQUIRED_TEXT_FILES = (
    "review.md",
    "improvement-notes.md",
    "pre-analytics-quality-scorecard.md",
    "thumbnail-visual-direction.md",
    "ai-usage-improvement.md",
    "source-first-baseline.md",
    "source-first-comparison.md",
    "explainer-comprehension.md",
    "shorts-vs-longform-fit.md",
    "tts-voice-check.md",
    "audio-check.txt",
)

SCORECARD_KEYS = (
    "Audio comfort",
    "Source trust and traceability",
    "First-30-second clarity",
    "Beginner comprehension",
    "Comprehension load",
)

BLOCKING_SCORECARD_KEYS = {
    "Audio comfort",
    "Source trust and traceability",
    "First-30-second clarity",
    "Beginner comprehension",
}

RESOLVED_DUPLICATE_BLOCKER_STATUSES = {
    "resolved",
    "cleared",
    "closed",
    "dismissed",
    "duplicate_hidden",
    "duplicate_unlisted",
    "duplicate_private",
    "duplicate_deleted",
}


def load_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def issue_codes(data: dict[str, Any], bucket: str) -> set[str]:
    codes: set[str] = set()
    items = data.get(bucket, [])
    if not isinstance(items, list):
        return codes
    for item in items:
        if isinstance(item, dict) and isinstance(item.get("code"), str):
            codes.add(item["code"])
        elif isinstance(item, str) and item:
            codes.add(item)
    return codes


def parse_scorecard(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    text = path.read_text(encoding="utf-8", errors="replace")
    scores: dict[str, str] = {}
    for key in SCORECARD_KEYS:
        match = re.search(
            rf"(?im)^\s*-\s*{re.escape(key)}:\s*(PASS|WARN|FAIL)\b",
            text,
        )
        if match:
            scores[key] = match.group(1).upper()
    return scores


def find_workspace_root(path: Path) -> Path:
    for parent in (path, *path.parents):
        if (parent / "AGENTS.md").exists() and (parent / "reports").is_dir():
            return parent
    return Path.cwd().resolve()


def unresolved_duplicate_blockers(workspace_root: Path) -> list[dict[str, Any]]:
    reports_root = workspace_root / "reports" / "article-video-publisher"
    if not reports_root.exists():
        return []

    blockers: list[dict[str, Any]] = []
    for path in sorted(reports_root.glob("**/youtube/duplicate-public-upload-blocker.json")):
        data = load_json(path)
        if data is None:
            blockers.append(
                {
                    "file": str(path.relative_to(workspace_root)),
                    "status": None,
                    "message": "Duplicate blocker file is invalid JSON and must be inspected before any new upload.",
                }
            )
            continue

        status = str(data.get("status") or "").strip().lower()
        if status in RESOLVED_DUPLICATE_BLOCKER_STATUSES:
            continue

        if (
            data.get("blocker") == "duplicate_public_upload"
            or data.get("duplicate_video_id")
            or data.get("duplicate_youtube_url")
        ):
            blockers.append(
                {
                    "file": str(path.relative_to(workspace_root)),
                    "status": data.get("status"),
                    "canonical_youtube_url": data.get("canonical_youtube_url"),
                    "duplicate_youtube_url": data.get("duplicate_youtube_url"),
                    "message": (
                        "Unresolved public duplicate upload blocker exists. "
                        "Resolve or explicitly mark it resolved before opening YouTube Studio for another upload."
                    ),
                }
            )
    return blockers


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate final upload readiness for an article-video artifact."
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    workspace_root = find_workspace_root(artifact_dir)
    review_dir = artifact_dir / "review"
    source_path = artifact_dir / "source.json"
    source = load_json(source_path) or {}
    topic_domain = str(source.get("topic_domain") or "").strip().lower()
    topic_subdomain = str(source.get("topic_subdomain") or source.get("subdomain") or "").strip().lower()

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {
        "topic_domain": topic_domain,
        "topic_subdomain": topic_subdomain,
        "required_pass_json": list(REQUIRED_PASS_JSON),
        "required_text_files": list(REQUIRED_TEXT_FILES),
    }

    if not source_path.exists():
        errors.append(
            {
                "code": "missing_source_json",
                "message": "source.json is required before upload.",
            }
        )
    elif topic_domain != "technical":
        errors.append(
            {
                "code": "unsupported_topic_domain",
                "topic_domain": topic_domain,
                "message": "Article-video upload currently accepts only source.json.topic_domain='technical'. Put finer labels such as backend_database or technical_ai_backend in topic_subdomain.",
            }
        )

    existing_upload_result = artifact_dir / "youtube" / "upload-result.json"
    if existing_upload_result.exists():
        existing_upload = load_json(existing_upload_result) or {}
        errors.append(
            {
                "code": "existing_upload_result_present",
                "file": "youtube/upload-result.json",
                "youtube_url": existing_upload.get("youtube_url")
                or existing_upload.get("watch_url")
                or existing_upload.get("canonical_youtube_url"),
                "message": (
                    "This artifact already has upload-result.json. Do not open Studio "
                    "or upload again; use same-video verification/bookkeeping recovery only."
                ),
            }
        )

    duplicate_blockers = unresolved_duplicate_blockers(workspace_root)
    parsed["unresolved_duplicate_public_upload_blockers"] = duplicate_blockers
    if duplicate_blockers:
        errors.append(
            {
                "code": "unresolved_duplicate_public_upload_blocker",
                "blockers": duplicate_blockers,
                "message": (
                    "At least one public duplicate upload is unresolved. New YouTube "
                    "uploads are blocked until the duplicate is hidden/unlisted/private/deleted "
                    "with approval, or the blocker is explicitly marked resolved."
                ),
            }
        )

    gate_statuses: dict[str, str | None] = {}
    gate_warning_codes: dict[str, list[str]] = {}
    for filename in REQUIRED_PASS_JSON:
        path = review_dir / filename
        data = load_json(path)
        if data is None:
            errors.append(
                {
                    "code": "missing_or_invalid_required_gate",
                    "file": f"review/{filename}",
                    "message": f"review/{filename} must exist and be valid JSON.",
                }
            )
            gate_statuses[filename] = None
            continue

        status = str(data.get("status") or "").upper()
        gate_statuses[filename] = status
        gate_warning_codes[filename] = sorted(issue_codes(data, "warnings"))
        if status != "PASS":
            errors.append(
                {
                    "code": "required_gate_not_pass",
                    "file": f"review/{filename}",
                    "status": status or None,
                    "message": f"review/{filename} must show PASS before upload.",
                }
            )

    missing_text_files = []
    for filename in REQUIRED_TEXT_FILES:
        path = review_dir / filename
        if not path.exists() or not path.read_text(encoding="utf-8", errors="replace").strip():
            missing_text_files.append(f"review/{filename}")
    if missing_text_files:
        errors.append(
            {
                "code": "missing_required_review_text_files",
                "files": missing_text_files,
                "message": "Required review text files must exist and be non-empty before upload.",
            }
        )

    scorecard_scores = parse_scorecard(review_dir / "pre-analytics-quality-scorecard.md")
    parsed["scorecard_scores"] = scorecard_scores
    for key in SCORECARD_KEYS:
        score = scorecard_scores.get(key)
        if score is None:
            errors.append(
                {
                    "code": "missing_scorecard_key",
                    "key": key,
                    "message": f"pre-analytics scorecard is missing `{key}: PASS|WARN|FAIL`.",
                }
            )
        elif score == "FAIL" or (key in BLOCKING_SCORECARD_KEYS and score == "WARN"):
            errors.append(
                {
                    "code": "blocking_scorecard_value",
                    "key": key,
                    "value": score,
                    "message": (
                        f"{key} is {score}. Repair the current artifact before upload; "
                        "do not leave this as only a next-run improvement."
                    ),
                }
            )
        elif score == "WARN":
            warnings.append(
                {
                    "code": "scorecard_warn",
                    "key": key,
                    "value": score,
                    "message": (
                        f"{key} is WARN. Upload may proceed only when downstream gates "
                        "such as concept-depth are PASS and improvement-notes record a concrete fix."
                    ),
                }
            )

    concept_depth = load_json(review_dir / "concept-depth-check.json") or {}
    if topic_domain == "technical" and concept_depth.get("status") != "PASS":
        errors.append(
            {
                "code": "technical_concept_depth_not_pass",
                "status": concept_depth.get("status"),
                "message": (
                    "Technical videos require concept-depth PASS so broad first-time "
                    "viewers are not left with compressed terminology."
                ),
            }
        )

    if "first30_comprehension_gap" in gate_warning_codes.get("preanalytics-opening-check.json", []):
        warnings.append(
            {
                "code": "preanalytics_first30_comprehension_gap_present",
                "message": (
                    "preanalytics-opening-check still reports first30_comprehension_gap. "
                    "For concept-heavy videos this should be blocked by concept-depth."
                ),
            }
        )

    parsed["gate_statuses"] = gate_statuses
    parsed["gate_warning_codes"] = gate_warning_codes

    result = {
        "artifact_dir": str(artifact_dir),
        "status": "FAIL" if errors else "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": parsed,
    }

    output = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(output, encoding="utf-8")
    else:
        print(output, end="")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
