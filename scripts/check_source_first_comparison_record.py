#!/usr/bin/env python3
"""Validate source-first Codex baseline and comparison review records."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


REQUIRED_COMPARISON_FIELDS = {
    "baseline_after_source_selection",
    "codex_baseline_used",
    "source_first_comparison_check",
    "narration_script_compared",
    "video_more_understandable_than_baseline",
    "reader_comprehension_check",
    "source_content_preserved",
    "source_identity_first_check",
    "public_copy_source_understanding_check",
    "over_abstraction_check",
    "validation_lens_drift_check",
    "revision_needed",
}

REQUIRED_DESCRIPTION_FIELDS = {
    "comparison_summary",
    "baseline_stronger_points",
    "video_stronger_points",
    "revisions_made",
}

PASS_FIELDS = {
    "baseline_after_source_selection",
    "codex_baseline_used",
    "source_first_comparison_check",
    "narration_script_compared",
    "video_more_understandable_than_baseline",
    "reader_comprehension_check",
    "source_content_preserved",
    "source_identity_first_check",
    "public_copy_source_understanding_check",
    "over_abstraction_check",
    "validation_lens_drift_check",
}

TOO_SHORT_COMPACT_CHARS = 180


def canonical_lines(text: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    for match in re.finditer(r"(?im)^\s*(?:-\s*)?([a-z0-9_]+)\s*:\s*(.+?)\s*$", text):
        fields[match.group(1).lower()] = match.group(2).strip()
    return fields


def compact_len(text: str) -> int:
    return len(re.sub(r"\s+", "", text))


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Validate that an article video has a Codex source-first baseline "
            "and an explicit comparison proving the script is at least as clear."
        )
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    review_dir = artifact_dir / "review"
    baseline_path = review_dir / "source-first-baseline.md"
    comparison_path = review_dir / "source-first-comparison.md"
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {}

    result: dict[str, Any] = {
        "artifact_dir": str(artifact_dir),
        "baseline_path": str(baseline_path),
        "comparison_path": str(comparison_path),
        "status": "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": parsed,
    }

    if not baseline_path.exists():
        errors.append(
            {
                "code": "missing_source_first_baseline",
                "message": "review/source-first-baseline.md is required before planning/render.",
            }
        )
    else:
        baseline_text = baseline_path.read_text(encoding="utf-8", errors="replace")
        parsed["baseline_compact_chars"] = compact_len(baseline_text)
        if compact_len(baseline_text) < TOO_SHORT_COMPACT_CHARS:
            errors.append(
                {
                    "code": "source_first_baseline_too_short",
                    "message": (
                        "Codex baseline is too short to compare against. Ask Codex to explain "
                        "what the selected source/article actually says before writing or recording "
                        "the narration script."
                    ),
                }
            )
        if not re.search(r"(?i)codex|gpt-5\.5|source[-_ ]?first|來源優先|原始來源", baseline_text):
            warnings.append(
                {
                    "code": "baseline_origin_not_explicit",
                    "message": "Record that this baseline was produced by Codex from the original source.",
                }
            )

    if not comparison_path.exists():
        errors.append(
            {
                "code": "missing_source_first_comparison",
                "message": "review/source-first-comparison.md is required before upload.",
            }
        )
    else:
        comparison_text = comparison_path.read_text(encoding="utf-8", errors="replace")
        fields = canonical_lines(comparison_text)
        parsed["comparison_fields"] = fields
        parsed["comparison_compact_chars"] = compact_len(comparison_text)

        for field in sorted(REQUIRED_COMPARISON_FIELDS):
            value = fields.get(field, "")
            if not value:
                errors.append(
                    {
                        "code": f"missing_{field}",
                        "message": f"Add canonical line `{field}: ...` to review/source-first-comparison.md.",
                    }
                )
                continue

            if field in PASS_FIELDS and value.upper() != "PASS":
                errors.append(
                    {
                        "code": f"{field}_not_pass",
                        "value": value,
                        "message": f"{field} must be PASS before upload.",
                    }
                )

        for field in sorted(REQUIRED_DESCRIPTION_FIELDS):
            value = fields.get(field, "")
            if not value or compact_len(value) < 12:
                errors.append(
                    {
                        "code": f"{field}_too_thin",
                        "message": (
                            f"Add a substantive `{field}: ...` line to explain the actual "
                            "comparison between the Codex baseline and the narration script."
                        ),
                    }
                )

        revision_needed = fields.get("revision_needed", "")
        if revision_needed and revision_needed.upper() not in {"NO", "FALSE", "NONE", "PASS"}:
            errors.append(
                {
                    "code": "revision_needed_before_upload",
                    "value": revision_needed,
                    "message": "Revise title/opening/script, rerun comparison, then upload only after revision_needed: NO.",
                }
            )

        if compact_len(comparison_text) < TOO_SHORT_COMPACT_CHARS:
            errors.append(
                {
                    "code": "source_first_comparison_too_short",
                    "message": (
                        "Comparison is too thin; compare the narration script against the Codex "
                        "baseline and explain why the final video is clearer for readers/viewers."
                    ),
                }
            )

        if not re.search(r"講稿|旁白|narration|script|錄音|TTS", comparison_text, re.IGNORECASE):
            errors.append(
                {
                    "code": "narration_script_evidence_missing",
                    "message": (
                        "review/source-first-comparison.md must explicitly compare the narration "
                        "script that will be recorded, not only the title, outline, or slide plan."
                    ),
                }
            )

        if re.search(r"框架|gate|Gate|檢查清單|上線驗收|導入|角色|用途|production judgment", comparison_text):
            if not re.search(r"先.*來源|先.*改了什麼|source.*first|來源.*本身|what changed", comparison_text, re.IGNORECASE):
                warnings.append(
                    {
                        "code": "comparison_mentions_abstraction_without_source_first_note",
                        "message": (
                            "If the comparison mentions framework/gate/checklist language, explicitly state "
                            "that the source itself is explained first."
                        ),
                    }
                )

    result["status"] = "FAIL" if errors else "PASS"
    payload = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(payload, encoding="utf-8")
    else:
        print(payload)

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
