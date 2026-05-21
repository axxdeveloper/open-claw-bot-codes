#!/usr/bin/env python3
"""Validate review/shorts-vs-longform-fit.md canonical decision record."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


ALLOWED_DECISIONS = {"shorts", "long-form"}
REQUIRED_KEYS = (
    "format_decision",
    "format_decision_reason",
    "next_validation_step",
    "source_priority",
)
SHORTS_REQUIRED_CONTAINS = {
    "source_link_clickability_status": "shorts_non_clickable_by_design",
    "shorts_views_count_mode": "starts_or_replays_no_min_watch_time",
    "compare_like_for_like": "shorts_vs_shorts",
}
MEASURABLE_VALIDATION_HINTS = (
    "engaged views",
    "stayed to watch",
    "avg % viewed",
    "how many chose to view",
    "ctr",
    "retention",
    "watch time",
    "average view duration",
    "impressions",
    "analytics",
    "sample",
    "latest 5",
    "checker",
    "audit",
    "pass",
    "warn",
    "warning",
    "7 days",
    "14 days",
    "7天",
    "14天",
    "留存",
    "點閱",
    "觀看",
    "抽樣",
    "樣本",
)


def _normalize_decision(raw: str) -> str:
    value = raw.strip().lower()
    value = value.replace("_", "-").replace(" ", "-")
    if value in {"short", "shorts"}:
        return "shorts"
    if value in {"long-form", "longform"}:
        return "long-form"
    return value


def _parse_key_values(text: str) -> tuple[dict[str, str], list[int], list[int]]:
    kv: dict[str, str] = {}
    equals_lines: list[int] = []
    malformed_lines: list[int] = []

    for lineno, raw in enumerate(text.splitlines(), start=1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue

        normalized = line[2:].strip() if line.startswith("- ") else line

        equals_match = re.match(r"^([A-Za-z0-9_]+)\s*=\s*(.+)$", normalized)
        if equals_match:
            equals_lines.append(lineno)
            key = equals_match.group(1).strip().lower()
            value = equals_match.group(2).strip()
            if key not in kv:
                kv[key] = value
            continue

        colon_match = re.match(r"^([A-Za-z0-9_]+)\s*:\s*(.+)$", normalized)
        if colon_match:
            key = colon_match.group(1).strip().lower()
            value = colon_match.group(2).strip()
            if key not in kv:
                kv[key] = value
            continue

        malformed_lines.append(lineno)

    return kv, equals_lines, malformed_lines


def _has_measurable_validation_hint(text: str) -> bool:
    lower = text.strip().lower()
    if not lower:
        return False
    return any(hint in lower for hint in MEASURABLE_VALIDATION_HINTS)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate review/shorts-vs-longform-fit.md canonical fields."
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    record_path = artifact_dir / "review" / "shorts-vs-longform-fit.md"
    source_json_path = artifact_dir / "source.json"

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {}

    result: dict[str, Any] = {
        "artifact_dir": str(artifact_dir),
        "record_path": str(record_path),
        "source_json_path": str(source_json_path),
        "status": "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": parsed,
    }

    if not record_path.exists():
        errors.append(
            {
                "code": "missing_shorts_longform_record",
                "message": "review/shorts-vs-longform-fit.md is required.",
            }
        )
    else:
        text = record_path.read_text(encoding="utf-8", errors="replace")
        kv, equals_lines, malformed_lines = _parse_key_values(text)
        parsed.update(kv)

        if equals_lines:
            errors.append(
                {
                    "code": "key_value_separator_equals",
                    "lines": equals_lines,
                    "message": "Use canonical 'key: value' format, not 'key=value'.",
                }
            )

        if malformed_lines:
            warnings.append(
                {
                    "code": "non_key_lines_present",
                    "lines": malformed_lines,
                    "message": "Some non-empty lines are not parseable key/value pairs.",
                }
            )

        for key in REQUIRED_KEYS:
            value = kv.get(key, "").strip()
            if not value:
                errors.append(
                    {
                        "code": f"missing_{key}",
                        "message": f"Missing required key: {key}",
                    }
                )
        next_validation_step = kv.get("next_validation_step", "").strip()
        if next_validation_step and not _has_measurable_validation_hint(next_validation_step):
            warnings.append(
                {
                    "code": "non_measurable_next_validation_step",
                    "value": next_validation_step,
                    "message": (
                        "next_validation_step should include a measurable trigger "
                        "(for example checker/audit PASS/WARN trend, sample window, "
                        "or concrete Shorts metrics)."
                    ),
                }
            )

        source_priority = kv.get("source_priority", "").strip()
        if source_priority:
            priority_prefix = source_priority.split()[0].upper()
            if priority_prefix not in {"P0", "P1", "P2", "P3", "P4"}:
                errors.append(
                    {
                        "code": "invalid_source_priority",
                        "value": source_priority,
                        "message": "source_priority must start with P0, P1, P2, P3, or P4.",
                    }
                )

        decision_raw = kv.get("format_decision", "").strip()
        decision = _normalize_decision(decision_raw)
        if decision_raw:
            parsed["format_decision_normalized"] = decision
        if decision_raw and decision not in ALLOWED_DECISIONS:
            errors.append(
                {
                    "code": "invalid_format_decision",
                    "value": decision_raw,
                    "message": "format_decision must be shorts or long-form.",
                }
            )

        single_point_note = kv.get("shorts_single_learning_point_note", "").strip()

        if decision == "shorts":
            for key, expected_substring in SHORTS_REQUIRED_CONTAINS.items():
                value = kv.get(key, "").strip().lower()
                if not value:
                    errors.append(
                        {
                            "code": f"missing_{key}",
                            "message": f"{key} is required when format_decision=shorts.",
                        }
                    )
                    continue
                if expected_substring not in value:
                    errors.append(
                        {
                            "code": f"invalid_{key}",
                            "value": kv.get(key, ""),
                            "message": f"{key} must include '{expected_substring}' when format_decision=shorts.",
                        }
                    )
            if not single_point_note:
                warnings.append(
                    {
                        "code": "missing_shorts_single_learning_point_note",
                        "message": (
                            "Add shorts_single_learning_point_note to state the single learning point "
                            "the Shorts version keeps."
                        ),
                    }
                )
            elif len(single_point_note) < 20:
                warnings.append(
                    {
                        "code": "short_shorts_single_learning_point_note",
                        "value": single_point_note,
                        "message": "shorts_single_learning_point_note is too brief; add a concrete one-line note.",
                    }
                )
        elif decision == "long-form":
            if not single_point_note:
                warnings.append(
                    {
                        "code": "missing_shorts_single_learning_point_note",
                        "message": (
                            "Add shorts_single_learning_point_note to document the single-learning-point "
                            "Shorts alternative (or why no viable single-point Short exists)."
                        ),
                    }
                )
            elif len(single_point_note) < 20:
                warnings.append(
                    {
                        "code": "short_shorts_single_learning_point_note",
                        "value": single_point_note,
                        "message": "shorts_single_learning_point_note is too brief; add a concrete one-line note.",
                    }
                )

    if source_json_path.exists():
        try:
            source_data = json.loads(source_json_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(
                {
                    "code": "invalid_source_json",
                    "message": f"source.json parse error: {exc}",
                }
            )
            source_data = {}
        source_decision_raw = str(source_data.get("format_decision", "")).strip()
        source_decision = _normalize_decision(source_decision_raw)
        parsed["source_json_format_decision_raw"] = source_decision_raw
        parsed["source_json_format_decision_normalized"] = source_decision

        if not source_decision_raw:
            errors.append(
                {
                    "code": "missing_source_json_format_decision",
                    "message": "source.json must include format_decision.",
                }
            )
        elif source_decision not in ALLOWED_DECISIONS:
            errors.append(
                {
                    "code": "invalid_source_json_format_decision",
                    "value": source_decision_raw,
                    "message": "source.json format_decision must normalize to shorts or long-form.",
                }
            )

        record_decision = parsed.get("format_decision_normalized")
        if isinstance(record_decision, str) and record_decision in ALLOWED_DECISIONS:
            if source_decision in ALLOWED_DECISIONS and source_decision != record_decision:
                errors.append(
                    {
                        "code": "format_decision_mismatch",
                        "record": record_decision,
                        "source_json": source_decision,
                        "message": "review/shorts-vs-longform-fit.md and source.json format_decision must match.",
                    }
                )
    else:
        warnings.append(
            {
                "code": "missing_source_json",
                "message": "source.json not found; format_decision consistency could not be verified.",
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
