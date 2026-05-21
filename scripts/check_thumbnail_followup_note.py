#!/usr/bin/env python3
"""Validate thumbnail follow-up notes for mobile readability and opening clarity."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

TITLE_MOBILE_WARN_LEN = 45
COVER_TEXT_DENSITY_WARN_LEN = 58
QUANTIFIED_TARGET_RE = re.compile(
    r"(<=|≦|\b\d+\s*[-~]\s*\d+\b|\b\d+\s*字(?:元)?\b|\b\d+\s*行\b)"
)
READABILITY_ACTION_RE = re.compile(
    r"(縮短|精簡|前移|前置|對比|可讀|字重|主標|兩行|關鍵詞)"
)
COVER_ALIAS_ACTION_RE = re.compile(
    r"(縮短|精簡|短版|副標|一行|兩行|移到|slide\s*2|可讀|關鍵詞|前置)"
)


def _parse_score(text: str, key: str) -> str | None:
    match = re.search(
        rf"(?im)^\s*(?:-\s*)?{re.escape(key)}\s*:\s*(PASS|WARN|FAIL)\b",
        text,
    )
    if not match:
        return None
    return match.group(1).upper()


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Validate that improvement-notes include thumbnail_next_fix when "
            "pre-analytics scorecard has Mobile readability WARN/FAIL, and "
            "surface thumbnail/opening-promise alignment warnings."
        )
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    notes_path = artifact_dir / "review" / "improvement-notes.md"
    scorecard_path = artifact_dir / "review" / "pre-analytics-quality-scorecard.md"
    metadata_path = artifact_dir / "youtube" / "metadata.json"
    plan_payload_path = artifact_dir / "plan_payload.json"

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, str] = {}

    result: dict[str, Any] = {
        "artifact_dir": str(artifact_dir),
        "notes_path": str(notes_path),
        "scorecard_path": str(scorecard_path),
        "metadata_path": str(metadata_path),
        "plan_payload_path": str(plan_payload_path),
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
        notes_text = ""
    else:
        notes_text = notes_path.read_text(encoding="utf-8", errors="replace")
        fix_match = re.search(
            r"(?im)^\s*(?:-\s*)?thumbnail_next_fix\s*:\s*(.+)$",
            notes_text,
        )
        if fix_match:
            parsed["thumbnail_next_fix"] = fix_match.group(1).strip()
        cover_fix_match = re.search(
            r"(?im)^\s*(?:-\s*)?cover_alias_next_fix\s*:\s*(.+)$",
            notes_text,
        )
        if cover_fix_match:
            parsed["cover_alias_next_fix"] = cover_fix_match.group(1).strip()

    mobile_readability: str | None = None
    first30_clarity: str | None = None
    if not scorecard_path.exists():
        warnings.append(
            {
                "code": "missing_preanalytics_scorecard",
                "message": (
                    "review/pre-analytics-quality-scorecard.md not found; "
                    "skip thumbnail follow-up validation."
                ),
            }
        )
    else:
        scorecard_text = scorecard_path.read_text(encoding="utf-8", errors="replace")
        mobile_readability = _parse_score(scorecard_text, "Mobile readability")
        first30_clarity = _parse_score(scorecard_text, "First-30-second clarity")

        if mobile_readability is None:
            warnings.append(
                {
                    "code": "missing_mobile_readability_key",
                    "message": "Scorecard key missing or non-canonical: Mobile readability",
                }
            )
        else:
            parsed["mobile_readability"] = mobile_readability
            if mobile_readability in {"WARN", "FAIL"}:
                fix_value = parsed.get("thumbnail_next_fix", "").strip()
                if not fix_value:
                    errors.append(
                        {
                            "code": "missing_thumbnail_next_fix",
                            "message": (
                                "Mobile readability is WARN/FAIL; add "
                                "`thumbnail_next_fix: <one concrete next-run action>` "
                                "to review/improvement-notes.md."
                            ),
                        }
                    )
                else:
                    if len(fix_value) < 8:
                        errors.append(
                            {
                                "code": "thumbnail_next_fix_too_short",
                                "value": fix_value,
                                "message": (
                                    "thumbnail_next_fix should be a concrete action, not a short placeholder."
                                ),
                            }
                        )

        if first30_clarity is None:
            warnings.append(
                {
                    "code": "missing_first30_clarity_key",
                    "message": (
                        "Scorecard key missing or non-canonical: First-30-second clarity"
                    ),
                }
            )
        else:
            parsed["first_30_second_clarity"] = first30_clarity
            if first30_clarity in {"WARN", "FAIL"}:
                warnings.append(
                    {
                        "code": "first30_clarity_thumbnail_alignment_risk",
                        "value": first30_clarity,
                        "message": (
                            "First-30-second clarity is WARN/FAIL. Treat thumbnail/title promise "
                            "alignment as at least WARN and record one concrete thumbnail/packaging "
                            "follow-up action for the next run."
                        ),
                    }
                )
                if not parsed.get("thumbnail_next_fix", "").strip():
                    warnings.append(
                        {
                            "code": "first30_clarity_without_thumbnail_fix",
                            "value": first30_clarity,
                            "message": (
                                "First-30-second clarity is WARN/FAIL but `thumbnail_next_fix` is "
                                "missing. Add one concrete thumbnail/title promise alignment action."
                            ),
                        }
                    )

    title: str = ""
    if not metadata_path.exists():
        warnings.append(
            {
                "code": "missing_metadata_json",
                "message": "youtube/metadata.json not found; skip title-length risk check.",
            }
        )
    else:
        try:
            metadata = json.loads(metadata_path.read_text(encoding="utf-8", errors="replace"))
        except Exception as exc:  # pragma: no cover - defensive
            warnings.append(
                {
                    "code": "invalid_metadata_json",
                    "message": f"Cannot parse youtube/metadata.json: {exc}",
                }
            )
            metadata = {}

        raw_title = metadata.get("title")
        if isinstance(raw_title, str):
            title = raw_title.strip()
        if title:
            title_len = len(title)
            parsed["title_len"] = str(title_len)
            if title_len >= TITLE_MOBILE_WARN_LEN:
                warnings.append(
                    {
                        "code": "title_mobile_length_risk",
                        "value": title_len,
                        "message": (
                            f"metadata.title length >= {TITLE_MOBILE_WARN_LEN} may reduce one-second "
                            "mobile readability. Consider a shorter cover/title alias."
                        ),
                    }
                )
                if not parsed.get("thumbnail_next_fix"):
                    warnings.append(
                        {
                            "code": "title_mobile_length_risk_without_fix",
                            "value": title_len,
                            "message": (
                                "Title mobile-length risk detected but `thumbnail_next_fix` is missing. "
                                "Add one concrete next-run shortening/contrast action."
                            ),
                        }
                    )
                else:
                    fix_value = parsed["thumbnail_next_fix"]
                    has_quantified_target = bool(QUANTIFIED_TARGET_RE.search(fix_value))
                    has_readability_action = bool(READABILITY_ACTION_RE.search(fix_value))
                    parsed["thumbnail_fix_has_quantified_target"] = str(
                        has_quantified_target
                    )
                    parsed["thumbnail_fix_has_readability_action"] = str(
                        has_readability_action
                    )
                    if not has_quantified_target:
                        warnings.append(
                            {
                                "code": "title_mobile_length_risk_unquantified_fix",
                                "value": fix_value,
                                "message": (
                                    "Title mobile-length risk has a follow-up note, but the fix is "
                                    "not quantified. Add a measurable target (for example `<=42` mixed "
                                    "chars, or a concrete character range) for next-run verification."
                                ),
                            }
                        )
                    if not has_readability_action:
                        warnings.append(
                            {
                                "code": "title_mobile_length_risk_fix_lacks_readability_action",
                                "value": fix_value,
                                "message": (
                                    "Title mobile-length risk fix does not clearly mention a readability "
                                    "action (for example shorten/front-load keyword/raise contrast). "
                                    "Add one concrete readability action for next-run execution."
                                ),
                            }
                        )
                if mobile_readability == "PASS":
                    warnings.append(
                        {
                            "code": "mobile_readability_title_length_conflict",
                            "value": title_len,
                            "message": (
                                "Scorecard says `Mobile readability: PASS`, but metadata.title length "
                                f">= {TITLE_MOBILE_WARN_LEN} still triggers a mobile truncation risk. "
                                "Reconcile scorecard/readability judgment or shorten the title."
                            ),
                        }
                    )

    if not plan_payload_path.exists():
        warnings.append(
            {
                "code": "missing_plan_payload",
                "message": "plan_payload.json not found; skip cover-density checks.",
            }
        )
    else:
        try:
            plan_payload = json.loads(
                plan_payload_path.read_text(encoding="utf-8", errors="replace")
            )
        except Exception as exc:  # pragma: no cover - defensive
            warnings.append(
                {
                    "code": "invalid_plan_payload_json",
                    "message": f"Cannot parse plan_payload.json: {exc}",
                }
            )
            plan_payload = {}

        slides = plan_payload.get("slides") or plan_payload.get("slide_plan") or []
        if not isinstance(slides, list) or not slides:
            warnings.append(
                {
                    "code": "missing_slide_plan_data",
                    "message": (
                        "plan_payload has no slides/slide_plan; skip cover-density checks."
                    ),
                }
            )
        else:
            cover = slides[0] if isinstance(slides[0], dict) else {}
            cover_title = str(cover.get("title") or "").strip()
            cover_subtitle = str(cover.get("subtitle") or "").strip()
            raw_key_points = cover.get("key_points")
            cover_key_points = [x for x in raw_key_points if str(x).strip()] if isinstance(raw_key_points, list) else []

            cover_text = " ".join(
                part for part in [cover_title, cover_subtitle] if part
            ).strip()
            cover_text_len = len(cover_text)

            parsed["cover_title_len"] = str(len(cover_title))
            parsed["cover_subtitle_len"] = str(len(cover_subtitle))
            parsed["cover_text_len"] = str(cover_text_len)
            parsed["cover_key_points_count"] = str(len(cover_key_points))

            if len(cover_key_points) > 0:
                warnings.append(
                    {
                        "code": "cover_like_body_text_risk",
                        "value": len(cover_key_points),
                        "message": (
                            "Slide 1 includes key_points. Cover should not look like a body slide; "
                            "move bullets/key points to slide 2+ and keep slide 1 as a one-second promise frame."
                        ),
                    }
                )

            if cover_text_len >= COVER_TEXT_DENSITY_WARN_LEN:
                warnings.append(
                    {
                        "code": "cover_text_density_risk",
                        "value": cover_text_len,
                        "message": (
                            f"Slide-1 title+subtitle length >= {COVER_TEXT_DENSITY_WARN_LEN} may make the cover "
                            "feel like body text on mobile. Consider a shorter cover alias and shift detail to slide 2."
                        ),
                    }
                )
                cover_fix_value = parsed.get("cover_alias_next_fix", "").strip()
                if not cover_fix_value:
                    warnings.append(
                        {
                            "code": "cover_text_density_without_cover_alias_fix",
                            "value": cover_text_len,
                            "message": (
                                "Cover text density warning detected but `cover_alias_next_fix` is missing. "
                                "Add one concrete next-run cover alias action (for example `<=54` mixed chars + subtitle <=1 line)."
                            ),
                        }
                    )
                else:
                    has_quantified_target = bool(QUANTIFIED_TARGET_RE.search(cover_fix_value))
                    has_cover_action = bool(COVER_ALIAS_ACTION_RE.search(cover_fix_value))
                    parsed["cover_alias_fix_has_quantified_target"] = str(
                        has_quantified_target
                    )
                    parsed["cover_alias_fix_has_cover_action"] = str(has_cover_action)
                    if not has_quantified_target:
                        warnings.append(
                            {
                                "code": "cover_text_density_unquantified_fix",
                                "value": cover_fix_value,
                                "message": (
                                    "Cover text density follow-up exists but is not quantified. "
                                    "Add a measurable target (for example title+subtitle `<=54` mixed chars or subtitle `<=1` line)."
                                ),
                            }
                        )
                    if not has_cover_action:
                        warnings.append(
                            {
                                "code": "cover_text_density_fix_lacks_cover_action",
                                "value": cover_fix_value,
                                "message": (
                                    "Cover text density fix does not clearly describe a cover-alias action "
                                    "(for example shorten subtitle/use short alias/move detail to slide 2+)."
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
