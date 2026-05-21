#!/usr/bin/env python3
"""Validate zero-knowledge explanation review notes for article videos."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


REQUIRED_GLOBAL_FIELDS = {
    "audience_assumption",
    "jargon_before_definition_check",
    "mechanism_walkthrough_check",
    "beginner_playback_check",
}

PASS_FIELDS = {
    "jargon_before_definition_check",
    "mechanism_walkthrough_check",
    "beginner_playback_check",
}

CONCEPT_FIELDS = {
    "term",
    "what_it_is",
    "why_it_matters",
    "how_it_works",
    "example_or_scenario",
    "tradeoff_or_failure",
    "where_explained",
}

TOO_THIN_VALUES = {
    "",
    "n/a",
    "na",
    "none",
    "pass",
    "ok",
    "todo",
    "tbd",
    "同上",
    "無",
}


def canonical_lines(text: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    for match in re.finditer(r"(?im)^\s*(?:-\s*)?([a-z0-9_]+)\s*:\s*(.+?)\s*$", text):
        fields[match.group(1).lower()] = match.group(2).strip()
    return fields


def is_too_thin(value: str, *, min_chars: int = 8) -> bool:
    normalized = value.strip().lower()
    compact = re.sub(r"\s+", "", value.strip())
    return normalized in TOO_THIN_VALUES or len(compact) < min_chars


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate review/explainer-comprehension.md for beginner-friendly explanation coverage."
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    review_path = artifact_dir / "review" / "explainer-comprehension.md"
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {}

    result: dict[str, Any] = {
        "artifact_dir": str(artifact_dir),
        "review_path": str(review_path),
        "status": "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": parsed,
    }

    if not review_path.exists():
        errors.append(
            {
                "code": "missing_explainer_comprehension_record",
                "message": "review/explainer-comprehension.md is required.",
            }
        )
    else:
        text = review_path.read_text(encoding="utf-8", errors="replace")
        fields = canonical_lines(text)
        parsed["field_count"] = len(fields)

        for field in sorted(REQUIRED_GLOBAL_FIELDS):
            value = fields.get(field, "")
            if not value:
                errors.append(
                    {
                        "code": f"missing_{field}",
                        "message": f"Add canonical line `{field}: ...`.",
                    }
                )
            elif field in PASS_FIELDS and value.upper() != "PASS":
                errors.append(
                    {
                        "code": f"{field}_not_pass",
                        "value": value,
                        "message": f"{field} must be PASS before upload.",
                    }
                )

        audience = fields.get("audience_assumption", "")
        parsed["audience_assumption"] = audience
        if audience and not re.search(r"first[-_ ]?time|beginner|zero|新手|第一次|不懂|從頭", audience, re.IGNORECASE):
            warnings.append(
                {
                    "code": "audience_assumption_not_beginner_explicit",
                    "value": audience,
                    "message": "State explicitly that the viewer may be first-time/beginner/zero-knowledge.",
                }
            )

        declared_count = None
        if "key_concept_count" not in fields:
            errors.append(
                {
                    "code": "missing_key_concept_count",
                    "message": "Add canonical line `key_concept_count: <2-8>`.",
                }
            )
        else:
            try:
                declared_count = int(fields["key_concept_count"])
                parsed["key_concept_count"] = declared_count
                if declared_count < 2:
                    errors.append(
                        {
                            "code": "too_few_key_concepts",
                            "value": declared_count,
                            "message": "Track at least two key concepts so the video does not assume prior knowledge.",
                        }
                    )
                elif declared_count > 8:
                    warnings.append(
                        {
                            "code": "many_key_concepts",
                            "value": declared_count,
                            "message": "More than 8 key concepts is likely too dense; consider splitting or simplifying.",
                        }
                    )
            except ValueError:
                errors.append(
                    {
                        "code": "invalid_key_concept_count",
                        "value": fields["key_concept_count"],
                        "message": "key_concept_count must be an integer.",
                    }
                )

        concept_indexes = sorted(
            {
                int(match.group(1))
                for key in fields
                if (match := re.match(r"concept_(\d+)_(?:term|what_it_is|why_it_matters|how_it_works|example_or_scenario|tradeoff_or_failure|where_explained)$", key))
            }
        )
        parsed["concept_indexes"] = concept_indexes

        if declared_count is not None and concept_indexes and max(concept_indexes) < declared_count:
            errors.append(
                {
                    "code": "key_concept_count_mismatch",
                    "declared": declared_count,
                    "found_max_index": max(concept_indexes),
                    "message": "key_concept_count is larger than the numbered concept records present.",
                }
            )

        expected_indexes = range(1, (declared_count or max(concept_indexes, default=0)) + 1)
        for index in expected_indexes:
            for suffix in sorted(CONCEPT_FIELDS):
                key = f"concept_{index}_{suffix}"
                value = fields.get(key, "")
                if not value:
                    errors.append(
                        {
                            "code": "missing_concept_field",
                            "field": key,
                            "message": f"Add `{key}: ...` so this concept is explained from zero knowledge.",
                        }
                    )
                elif suffix != "term" and is_too_thin(value):
                    errors.append(
                        {
                            "code": "thin_concept_explanation",
                            "field": key,
                            "value": value,
                            "message": f"{key} is too thin; explain it in a sentence a first-time viewer can understand.",
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
