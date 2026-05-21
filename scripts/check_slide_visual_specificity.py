#!/usr/bin/env python3
"""Validate early-slide visual field specificity in plan_payload.json."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


GENERIC_VISUAL_PHRASES = {
    "policy learning loop",
    "data synthesis pipeline",
    "deployment checklist",
    "final rule card",
    "result comparison bars",
    "multi-objective reward card",
    "online rollout and replay",
    "warmup sft + single-turn rl",
    "system architecture diagram",
    "workflow diagram",
}


def parse_slides(payload: dict[str, Any]) -> list[dict[str, Any]]:
    slides = payload.get("slides")
    if isinstance(slides, list):
        return [s for s in slides if isinstance(s, dict)]
    plan = payload.get("plan")
    if isinstance(plan, dict) and isinstance(plan.get("slides"), list):
        return [s for s in plan["slides"] if isinstance(s, dict)]
    return []


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Check whether plan_payload early-slide visual fields are non-empty "
            "and avoid known generic placeholders."
        )
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    plan_path = artifact_dir / "plan_payload.json"

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {
        "checked_slides": [],
    }

    result: dict[str, Any] = {
        "artifact_dir": str(artifact_dir),
        "plan_payload_path": str(plan_path),
        "status": "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": parsed,
    }

    if not plan_path.exists():
        errors.append(
            {
                "code": "missing_plan_payload",
                "message": "plan_payload.json is required for slide visual checks.",
            }
        )
    else:
        try:
            payload = json.loads(plan_path.read_text(encoding="utf-8"))
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
        elif len(slides) < 4:
            warnings.append(
                {
                    "code": "insufficient_slide_count_for_first60_check",
                    "value": len(slides),
                    "message": "Less than 4 slides available; first-60 visual check is partial.",
                }
            )

        for idx, slide in enumerate(slides[:4], start=1):
            visual = str(slide.get("visual", "")).strip()
            title = str(slide.get("title", "")).strip()
            parsed["checked_slides"].append(
                {
                    "slide_number": idx,
                    "title": title,
                    "visual": visual,
                }
            )
            if not visual:
                errors.append(
                    {
                        "code": "missing_visual_field",
                        "slide_number": idx,
                        "title": title,
                        "message": "Slides 1-4 must include non-empty `visual` text.",
                    }
                )
                continue

            if visual.lower() in GENERIC_VISUAL_PHRASES:
                warnings.append(
                    {
                        "code": "visual_field_missing_or_generic",
                        "slide_number": idx,
                        "title": title,
                        "value": visual,
                        "message": (
                            "Visual field is a known generic placeholder; replace with "
                            "source-specific scene details."
                        ),
                    }
                )

    parsed["generic_warning_count"] = sum(
        1 for w in warnings if w.get("code") == "visual_field_missing_or_generic"
    )
    result["status"] = "FAIL" if errors else "PASS"

    payload = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(payload, encoding="utf-8")
    else:
        print(payload, end="")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
