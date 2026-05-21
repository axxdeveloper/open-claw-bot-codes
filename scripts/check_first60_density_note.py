#!/usr/bin/env python3
"""Validate opening-density notes in review/improvement-notes.md."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


ALLOWED_DENSITY = {"low", "medium", "high"}
ALLOWED_PROBE = {"PASS", "WARN", "FAIL"}
VISUAL_FIX_HINTS = (
    "字級",
    "字體",
    "對比",
    "可讀",
    "手機",
    "mobile",
    "縮圖",
    "拆頁",
    "分頁",
    "留白",
    "版面",
    "排版",
    "圖例",
    "legend",
    "visual",
    "layout",
    "font",
    "contrast",
)


def has_visual_fix_hint(text: str) -> bool:
    lowered = text.lower()
    return any(hint in text or hint in lowered for hint in VISUAL_FIX_HINTS)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate first_60s_density and follow-up fix in review/improvement-notes.md."
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    notes_path = artifact_dir / "review" / "improvement-notes.md"
    scorecard_path = artifact_dir / "review" / "pre-analytics-quality-scorecard.md"

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, str] = {}

    result: dict[str, Any] = {
        "artifact_dir": str(artifact_dir),
        "notes_path": str(notes_path),
        "scorecard_path": str(scorecard_path),
        "status": "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": parsed,
    }

    if not notes_path.exists():
        errors.append(
            {
                "code": "missing_improvement_notes",
                "message": "review/improvement-notes.md is required.",
            }
        )
    else:
        text = notes_path.read_text(encoding="utf-8", errors="replace")

        density_match = re.search(
            r"(?im)^\s*(?:-\s*)?first_60s_density\s*:\s*(low|medium|high)\b",
            text,
        )
        if not density_match:
            errors.append(
                {
                    "code": "missing_first_60s_density",
                    "message": "Add canonical line: first_60s_density: low|medium|high",
                }
            )
        else:
            density = density_match.group(1).lower()
            parsed["first_60s_density"] = density

            if density not in ALLOWED_DENSITY:
                errors.append(
                    {
                        "code": "invalid_first_60s_density",
                        "value": density,
                        "message": "first_60s_density must be one of low|medium|high.",
                    }
                )

            if density in {"medium", "high"}:
                fix_match = re.search(
                    r"(?im)^\s*(?:-\s*)?first_60s_next_fix\s*:\s*(.+)$",
                    text,
                )
                if not fix_match:
                    errors.append(
                        {
                            "code": "missing_first_60s_next_fix",
                            "message": "When density is medium/high, add first_60s_next_fix: <one concrete de-noise action>.",
                        }
                    )
                else:
                    parsed["first_60s_next_fix"] = fix_match.group(1).strip()

        probe_match = re.search(
            r"(?im)^\s*(?:-\s*)?mobile_readability_probe\s*:\s*(PASS|WARN|FAIL)\b",
            text,
        )
        if probe_match:
            parsed["mobile_readability_probe"] = probe_match.group(1).upper()
        else:
            warnings.append(
                {
                    "code": "missing_mobile_readability_probe",
                    "message": (
                        "Add canonical line `mobile_readability_probe: PASS|WARN|FAIL` "
                        "to make slide-visual readability evidence machine-auditable."
                    ),
                }
            )

    if scorecard_path.exists():
        scorecard_text = scorecard_path.read_text(encoding="utf-8", errors="replace")

        def parse_score(key: str) -> str | None:
            match = re.search(
                rf"(?im)^\s*(?:-\s*)?{re.escape(key)}\s*:\s*(PASS|WARN|FAIL)\b",
                scorecard_text,
            )
            if not match:
                warnings.append(
                    {
                        "code": "missing_scorecard_key",
                        "key": key,
                        "message": f"Scorecard key missing or non-canonical: {key}",
                    }
                )
                return None
            return match.group(1).upper()

        mobile_readability = parse_score("Mobile readability")
        comprehension_load = parse_score("Comprehension load")

        if mobile_readability:
            parsed["mobile_readability"] = mobile_readability
        if comprehension_load:
            parsed["comprehension_load"] = comprehension_load

        probe_value = parsed.get("mobile_readability_probe")
        if probe_value and probe_value not in ALLOWED_PROBE:
            warnings.append(
                {
                    "code": "invalid_mobile_readability_probe",
                    "value": probe_value,
                    "message": "mobile_readability_probe must be one of PASS|WARN|FAIL.",
                }
            )

        density_value = parsed.get("first_60s_density")
        if density_value == "low" and (
            mobile_readability in {"WARN", "FAIL"}
            or comprehension_load in {"WARN", "FAIL"}
        ):
            warnings.append(
                {
                    "code": "density_scorecard_mismatch",
                    "message": (
                        "first_60s_density is low but scorecard has WARN/FAIL on "
                        "Mobile readability or Comprehension load. Recheck opening density "
                        "and add first_60s_next_fix when needed."
                    ),
                }
            )

        if (
            probe_value
            and mobile_readability
            and (
                (mobile_readability == "PASS" and probe_value in {"WARN", "FAIL"})
                or (mobile_readability in {"WARN", "FAIL"} and probe_value == "PASS")
            )
        ):
            warnings.append(
                {
                    "code": "mobile_readability_probe_mismatch",
                    "message": (
                        "mobile_readability_probe conflicts with scorecard `Mobile readability`; "
                        "recheck 360px proxy and align both records."
                    ),
                }
            )

        if mobile_readability in {"WARN", "FAIL"}:
            fix_text = parsed.get("first_60s_next_fix", "").strip()
            if not fix_text:
                warnings.append(
                    {
                        "code": "mobile_warn_missing_visual_fix_hint",
                        "message": (
                            "Mobile readability is WARN/FAIL. Add first_60s_next_fix with "
                            "one concrete visual readability action (font size, contrast, split slide, layout)."
                        ),
                    }
                )
            elif not has_visual_fix_hint(fix_text):
                warnings.append(
                    {
                        "code": "mobile_warn_without_visual_fix_hint",
                        "value": fix_text,
                        "message": (
                            "Mobile readability is WARN/FAIL, but first_60s_next_fix does not "
                            "clearly mention a visual readability action (font size, contrast, split slide, layout)."
                        ),
                    }
                )
    else:
        warnings.append(
            {
                "code": "missing_preanalytics_scorecard",
                "message": "review/pre-analytics-quality-scorecard.md not found; skip density-to-scorecard consistency check.",
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
