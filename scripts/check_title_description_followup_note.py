#!/usr/bin/env python3
"""Validate packaging follow-up notes when title/description warnings exist."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


FOLLOWUP_WARNING_CODES = {
    "title_truncation_risk",
    "title_date_prefix",
    "first_line_too_long",
    "first_line_missing_source_understanding_cue",
    "first_line_starts_with_internal_payoff",
    "use_case_first_line_drift",
}
SOURCE_UNDERSTANDING_FIX_CUE_RE = re.compile(
    r"("
    r"來源|原文|原始來源|這(?:篇|集|份|支|個)|訪談|Podcast|paper|論文|release|repo|"
    r"讀懂|理解|看懂|聽懂|跟上|source|article|interview|episode|paper|release|repo"
    r")",
    re.IGNORECASE,
)
TITLE_FIX_CUE_RE = re.compile(r"(標題|title)", re.IGNORECASE)
FIRST_LINE_FIX_CUE_RE = re.compile(
    r"(首句|第一句|first line|top preview|description)",
    re.IGNORECASE,
)
FIRST_LINE_SHORTEN_RE = re.compile(
    r"(縮短|精簡|壓到|控制在|字內|<=|under|within|shorten|trim|reduce)",
    re.IGNORECASE,
)
TITLE_LENGTH_TARGET_RE = re.compile(
    r"(<=\s*\d+|under\s*\d+|within\s*\d+|\d+\s*(?:-|到)\s*\d+\s*(?:字|chars?|混合字元)|\d+\s*(?:字|chars?|混合字元))",
    re.IGNORECASE,
)
NO_REWRITE_RE = re.compile(
    r"(no rewrite needed|no rewrite|no change needed|無需改寫|不需改寫|不用改寫|無須改寫)",
    re.IGNORECASE,
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Require `metadata_packaging_next_fix` in improvement notes when "
            "title-description packaging check reports follow-up warnings."
        )
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    notes_path = artifact_dir / "review" / "improvement-notes.md"
    packaging_path = artifact_dir / "review" / "title-description-packaging-check.json"

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {}

    result: dict[str, Any] = {
        "artifact_dir": str(artifact_dir),
        "notes_path": str(notes_path),
        "packaging_check_path": str(packaging_path),
        "status": "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": parsed,
    }

    notes_text = ""
    if not notes_path.exists():
        errors.append(
            {
                "code": "missing_improvement_notes",
                "message": "review/improvement-notes.md is required.",
            }
        )
    else:
        notes_text = notes_path.read_text(encoding="utf-8", errors="replace")

    packaging = None
    if not packaging_path.exists():
        warnings.append(
            {
                "code": "missing_packaging_check",
                "message": (
                    "review/title-description-packaging-check.json not found; "
                    "skip follow-up validation."
                ),
            }
        )
    else:
        try:
            packaging = json.loads(packaging_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(
                {
                    "code": "invalid_packaging_check_json",
                    "message": str(exc),
                }
            )

    if packaging:
        status = str(packaging.get("status", "")).upper()
        parsed["packaging_status"] = status
        warning_codes = [w.get("code") for w in packaging.get("warnings", []) if isinstance(w, dict)]
        warning_codes = [code for code in warning_codes if isinstance(code, str)]
        parsed["packaging_warning_codes"] = warning_codes
        followup_codes = [code for code in warning_codes if code in FOLLOWUP_WARNING_CODES]
        parsed["followup_warning_codes"] = followup_codes

        if status == "FAIL":
            warnings.append(
                {
                    "code": "packaging_check_failed",
                    "message": (
                        "Packaging check already failed; fix packaging errors first. "
                        "Follow-up note check is informational for this state."
                    ),
                }
            )
        elif followup_codes:
            fix_match = re.search(
                r"(?im)^\s*(?:-\s*)?metadata_packaging_next_fix\s*:\s*(.+)$",
                notes_text,
            )
            if not fix_match:
                errors.append(
                    {
                        "code": "missing_metadata_packaging_next_fix",
                        "value": followup_codes,
                        "message": (
                            "Packaging warnings need follow-up. Add "
                            "`metadata_packaging_next_fix: <one concrete next-run rewrite action>` "
                            "to review/improvement-notes.md."
                        ),
                    }
                )
            else:
                value = fix_match.group(1).strip()
                parsed["metadata_packaging_next_fix"] = value
                if len(value) < 8:
                    errors.append(
                        {
                            "code": "metadata_packaging_next_fix_too_short",
                            "value": value,
                            "message": (
                                "metadata_packaging_next_fix should be a concrete action, "
                                "not a short placeholder."
                            ),
                        }
                    )
                source_understanding_warning = any(
                    code in followup_codes
                    for code in (
                        "first_line_missing_source_understanding_cue",
                        "first_line_starts_with_internal_payoff",
                        "use_case_first_line_drift",
                    )
                )
                if source_understanding_warning:
                    if NO_REWRITE_RE.search(value):
                        errors.append(
                            {
                                "code": "source_understanding_fix_conflict",
                                "value": value,
                                "message": (
                                    "When a source-understanding first-line warning exists, "
                                    "`metadata_packaging_next_fix` cannot be a no-change statement."
                                ),
                            }
                        )
                    elif not SOURCE_UNDERSTANDING_FIX_CUE_RE.search(value):
                        errors.append(
                            {
                                "code": "source_understanding_fix_missing_source_cue",
                                "value": value,
                                "message": (
                                    "When a source-understanding first-line warning exists, "
                                    "`metadata_packaging_next_fix` should explicitly describe "
                                    "a source-object first-line rewrite (for example, "
                                    "`這集訪談在聊...` or `這份 release note 改了...`)."
                                ),
                            }
                        )
                if "first_line_too_long" in followup_codes:
                    has_first_line_cue = bool(FIRST_LINE_FIX_CUE_RE.search(value))
                    has_first_line_shorten_cue = bool(FIRST_LINE_SHORTEN_RE.search(value))
                    parsed["first_line_too_long_fix_has_first_line_cue"] = has_first_line_cue
                    parsed["first_line_too_long_fix_has_shorten_cue"] = has_first_line_shorten_cue
                    if not has_first_line_cue or not has_first_line_shorten_cue:
                        errors.append(
                            {
                                "code": "first_line_too_long_fix_missing_preview_shorten_cue",
                                "value": value,
                                "message": (
                                    "When `first_line_too_long` exists, "
                                    "`metadata_packaging_next_fix` should explicitly mention "
                                    "shortening the description first line/top-preview text."
                                ),
                            }
                        )
                if "title_truncation_risk" in followup_codes:
                    has_title_cue = bool(TITLE_FIX_CUE_RE.search(value))
                    has_title_shorten_cue = bool(FIRST_LINE_SHORTEN_RE.search(value))
                    has_title_length_target = bool(TITLE_LENGTH_TARGET_RE.search(value))
                    parsed["title_truncation_fix_has_title_cue"] = has_title_cue
                    parsed["title_truncation_fix_has_shorten_cue"] = has_title_shorten_cue
                    parsed["title_truncation_fix_has_length_target"] = has_title_length_target
                    if not has_title_cue or not has_title_shorten_cue:
                        errors.append(
                            {
                                "code": "title_truncation_fix_missing_title_shorten_cue",
                                "value": value,
                                "message": (
                                    "When `title_truncation_risk` exists, "
                                    "`metadata_packaging_next_fix` should explicitly mention "
                                    "shortening the title."
                                ),
                            }
                        )
                    if not has_title_length_target:
                        warnings.append(
                            {
                                "code": "title_truncation_fix_missing_numeric_target",
                                "value": value,
                                "message": (
                                    "Add a measurable title-length target in "
                                    "`metadata_packaging_next_fix` (for example `<=42` or "
                                    "`40-44 字`) for `title_truncation_risk` follow-up."
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
