#!/usr/bin/env python3
"""Validate thumbnail and first-frame visual direction for article videos."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


REQUIRED_NOTE_KEYS = (
    "visual_hook",
    "main_object",
    "source_specific_anchor",
    "composition",
    "palette",
    "homepage_plan",
    "mobile_text_plan",
)

QUANTIFIED_TARGET_RE = re.compile(
    r"(<=|≦|\b\d+\s*[-~]\s*\d+\b|\b\d+\s*字(?:元)?\b|\b\d+\s*行\b)"
)
COMPOSITION_CUE_RE = re.compile(
    r"(foreground|background|left|right|center|diagonal|depth|hero|negative space|"
    r"前景|背景|左|右|中央|對角|層次|留白|主視覺|鏡頭|構圖|焦點)",
    re.IGNORECASE,
)
VISUAL_SCENE_CUE_RE = re.compile(
    r"(scene|object|photo|illustration|isometric|depth|texture|lighting|material|"
    r"editorial|foreground|background|hero|palette|主視覺|物件|場景|插畫|照片|"
    r"材質|光|前景|背景|留白|構圖|色彩)",
    re.IGNORECASE,
)
DIAGRAM_ONLY_RE = re.compile(
    r"\b(blocks?|cards?|boxes?|flow|diagram|table|bars?|labels?|arrows?)\b",
    re.IGNORECASE,
)
TEXT_ONLY_RE = re.compile(
    r"^(title|text|headline|label|labels|文字|標題|字卡|短標|副標|關鍵詞|"
    r"cover alias|source title)[\s。,.，：:!-]*$",
    re.IGNORECASE,
)


def parse_slides(payload: dict[str, Any]) -> list[dict[str, Any]]:
    slides = payload.get("slides")
    if isinstance(slides, list):
        return [s for s in slides if isinstance(s, dict)]
    plan = payload.get("plan")
    if isinstance(plan, dict) and isinstance(plan.get("slides"), list):
        return [s for s in plan["slides"] if isinstance(s, dict)]
    return []


def parse_note_keys(text: str) -> dict[str, str]:
    parsed: dict[str, str] = {}
    for key in REQUIRED_NOTE_KEYS:
        match = re.search(
            rf"(?im)^\s*(?:-\s*)?{re.escape(key)}\s*:\s*(.+)$",
            text,
        )
        if match:
            parsed[key] = match.group(1).strip()
    return parsed


def text_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return []


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Check that a video artifact has a real thumbnail/homepage visual "
            "direction, not only a readable text card."
        )
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    review_dir = artifact_dir / "review"
    note_path = review_dir / "thumbnail-visual-direction.md"
    plan_path = artifact_dir / "plan_payload.json"

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {
        "required_note_keys": list(REQUIRED_NOTE_KEYS),
    }

    result: dict[str, Any] = {
        "artifact_dir": str(artifact_dir),
        "note_path": str(note_path),
        "plan_payload_path": str(plan_path),
        "status": "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": parsed,
    }

    if not note_path.exists() or not note_path.read_text(
        encoding="utf-8", errors="replace"
    ).strip():
        errors.append(
            {
                "code": "missing_thumbnail_visual_direction_note",
                "file": "review/thumbnail-visual-direction.md",
                "message": (
                    "Write review/thumbnail-visual-direction.md before upload. "
                    "The cover needs an editorial visual concept, not only text length checks."
                ),
            }
        )
        note_text = ""
    else:
        note_text = note_path.read_text(encoding="utf-8", errors="replace")

    note_keys = parse_note_keys(note_text)
    parsed["note_keys"] = note_keys
    for key in REQUIRED_NOTE_KEYS:
        value = note_keys.get(key, "")
        if not value:
            errors.append(
                {
                    "code": "missing_thumbnail_visual_direction_key",
                    "key": key,
                    "message": f"review/thumbnail-visual-direction.md is missing `{key}: ...`.",
                }
            )
            continue
        if len(value) < 8:
            errors.append(
                {
                    "code": "thumbnail_visual_direction_key_too_short",
                    "key": key,
                    "value": value,
                    "message": f"`{key}` should be a concrete visual decision, not a placeholder.",
                }
            )

    main_object = note_keys.get("main_object", "")
    if main_object and TEXT_ONLY_RE.fullmatch(main_object):
        errors.append(
            {
                "code": "main_object_is_text_only",
                "value": main_object,
                "message": (
                    "`main_object` must name a source-specific visual subject, "
                    "not only title text or labels."
                ),
            }
        )

    composition = note_keys.get("composition", "")
    if composition and not COMPOSITION_CUE_RE.search(composition):
        errors.append(
            {
                "code": "composition_missing_layout_cue",
                "value": composition,
                "message": (
                    "`composition` must say how the cover is arranged: foreground/background, "
                    "left/right/center, depth, negative space, or another concrete layout cue."
                ),
            }
        )

    mobile_text_plan = note_keys.get("mobile_text_plan", "")
    if mobile_text_plan and not QUANTIFIED_TARGET_RE.search(mobile_text_plan):
        errors.append(
            {
                "code": "mobile_text_plan_missing_measurable_target",
                "value": mobile_text_plan,
                "message": (
                    "`mobile_text_plan` needs a measurable target such as title+subtitle<=54 "
                    "or subtitle<=1 line."
                ),
            }
        )

    if not plan_path.exists():
        errors.append(
            {
                "code": "missing_plan_payload",
                "message": "plan_payload.json is required for thumbnail visual checks.",
            }
        )
    else:
        try:
            payload = json.loads(plan_path.read_text(encoding="utf-8", errors="replace"))
        except json.JSONDecodeError as exc:
            errors.append(
                {
                    "code": "invalid_plan_payload_json",
                    "message": f"Failed to parse plan_payload.json: {exc}",
                }
            )
            payload = {}

        slides = parse_slides(payload)
        if not slides:
            errors.append(
                {
                    "code": "missing_slides_array",
                    "message": "No slides array found in plan_payload.json.",
                }
            )
        else:
            cover = slides[0]
            cover_kind = str(cover.get("kind") or "").strip().lower()
            cover_title = str(cover.get("title") or "").strip()
            cover_subtitle = str(cover.get("subtitle") or "").strip()
            cover_visual = str(cover.get("visual") or "").strip()
            cover_points = text_list(cover.get("points")) + text_list(
                cover.get("key_points")
            )

            parsed["cover"] = {
                "kind": cover_kind,
                "title": cover_title,
                "subtitle": cover_subtitle,
                "visual": cover_visual,
                "points_count": len(cover_points),
            }

            if cover_kind and cover_kind != "cover":
                warnings.append(
                    {
                        "code": "slide1_kind_not_cover",
                        "value": cover_kind,
                        "message": "Slide 1 should normally be `kind: cover` for article videos.",
                    }
                )

            if cover_points:
                errors.append(
                    {
                        "code": "cover_contains_body_points",
                        "value": cover_points,
                        "message": (
                            "Slide 1 must behave like a thumbnail/homepage frame. "
                            "Move bullets or body points to slide 2+."
                        ),
                    }
                )

            if not cover_visual:
                errors.append(
                    {
                        "code": "missing_cover_visual",
                        "message": "Slide 1 needs a non-empty `visual` field.",
                    }
                )
            elif TEXT_ONLY_RE.fullmatch(cover_visual):
                errors.append(
                    {
                        "code": "cover_visual_is_text_only",
                        "value": cover_visual,
                        "message": "Slide 1 visual cannot be only title/text/label planning.",
                    }
                )
            elif DIAGRAM_ONLY_RE.search(cover_visual) and not VISUAL_SCENE_CUE_RE.search(
                cover_visual
            ):
                warnings.append(
                    {
                        "code": "diagrammatic_cover_visual_risk",
                        "value": cover_visual,
                        "message": (
                            "Cover visual reads like a diagram/card layout. Consider a stronger "
                            "editorial main object, depth, texture, light, or scene before treating it as polished."
                        ),
                    }
                )

    result["status"] = "FAIL" if errors else "PASS"
    output = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(output, encoding="utf-8")
    else:
        print(output, end="")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
