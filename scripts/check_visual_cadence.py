#!/usr/bin/env python3
"""Validate visual cadence for article-video artifacts."""

from __future__ import annotations

import argparse
import json
import math
import re
import subprocess
from pathlib import Path
from typing import Any


TARGET_SECONDS_PER_VISUAL = 35.0
HARD_MAX_SECONDS_PER_VISUAL = 45.0


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def parse_slides(payload: dict[str, Any]) -> list[dict[str, Any]]:
    slides = payload.get("slides")
    if isinstance(slides, list):
        return [s for s in slides if isinstance(s, dict)]
    plan = payload.get("plan")
    if isinstance(plan, dict) and isinstance(plan.get("slides"), list):
        return [s for s in plan["slides"] if isinstance(s, dict)]
    return []


def parse_narration(payload: dict[str, Any]) -> list[str]:
    narration = payload.get("narration")
    if isinstance(narration, list):
        return [str(item) for item in narration]
    plan = payload.get("plan")
    if isinstance(plan, dict) and isinstance(plan.get("narration"), list):
        return [str(item) for item in plan["narration"]]
    return []


def ffprobe_duration(path: Path) -> float | None:
    if not path.exists():
        return None
    try:
        output = subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(path),
            ],
            text=True,
            stderr=subprocess.DEVNULL,
            timeout=20,
        ).strip()
        return float(output)
    except Exception:
        return None


def duration_from_text(text: str) -> float | None:
    patterns = [
        r"(?im)^\s*duration\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*s?\b",
        r"(?im)^\s*-\s*Duration:\s*([0-9]+(?:\.[0-9]+)?)\s*s\b",
        r"(?im)\bduration_seconds\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return float(match.group(1))
    return None


def find_duration(artifact_dir: Path) -> tuple[float | None, str | None]:
    metadata = load_json(artifact_dir / "youtube" / "metadata.json")
    for key in ("video_path", "video", "file"):
        value = metadata.get(key)
        if isinstance(value, str) and value.strip():
            duration = ffprobe_duration(Path(value))
            if duration is not None:
                return duration, f"ffprobe:{value}"

    for rel in ("video/build-result.txt", "status.md", "final-report.md"):
        path = artifact_dir / rel
        if path.exists():
            duration = duration_from_text(path.read_text(encoding="utf-8", errors="replace"))
            if duration is not None:
                return duration, rel

    return None, None


def hard_part_count(artifact_dir: Path) -> int:
    source = load_json(artifact_dir / "source.json")
    budget = source.get("difficulty_budget")
    if isinstance(budget, dict) and isinstance(budget.get("hard_parts"), list):
        return len(budget["hard_parts"])
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check that video visuals change often enough for dense explainers."
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    plan_path = artifact_dir / "plan_payload.json"

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {}

    if not plan_path.exists():
        errors.append(
            {
                "code": "missing_plan_payload",
                "message": "plan_payload.json is required for visual cadence checks.",
            }
        )
        payload: dict[str, Any] = {}
    else:
        payload = load_json(plan_path)
        if not payload:
            errors.append(
                {
                    "code": "invalid_plan_payload_json",
                    "message": "plan_payload.json could not be parsed as an object.",
                }
            )

    slides = parse_slides(payload)
    narration = parse_narration(payload)
    duration, duration_source = find_duration(artifact_dir)
    hard_parts = hard_part_count(artifact_dir)

    parsed.update(
        {
            "slide_count": len(slides),
            "narration_count": len(narration),
            "duration_seconds": duration,
            "duration_source": duration_source,
            "target_seconds_per_visual": TARGET_SECONDS_PER_VISUAL,
            "hard_max_seconds_per_visual": HARD_MAX_SECONDS_PER_VISUAL,
            "hard_part_count": hard_parts,
        }
    )

    if not slides:
        errors.append(
            {
                "code": "missing_slides",
                "message": "No slides found in plan_payload.json.",
            }
        )

    if narration and slides and len(narration) != len(slides):
        errors.append(
            {
                "code": "narration_slide_count_mismatch",
                "slide_count": len(slides),
                "narration_count": len(narration),
                "message": "Each slide should have a matching narration segment.",
            }
        )

    if duration is None:
        warnings.append(
            {
                "code": "missing_duration",
                "message": "Could not determine final video duration; cadence check is partial.",
            }
        )
    elif slides:
        avg = duration / len(slides)
        target_min_visuals = math.ceil(duration / TARGET_SECONDS_PER_VISUAL)
        hard_min_visuals = math.ceil(duration / HARD_MAX_SECONDS_PER_VISUAL)
        parsed.update(
            {
                "average_seconds_per_visual": round(avg, 3),
                "target_min_visuals": target_min_visuals,
                "hard_min_visuals": hard_min_visuals,
            }
        )
        if len(slides) < hard_min_visuals or avg > HARD_MAX_SECONDS_PER_VISUAL:
            errors.append(
                {
                    "code": "visual_cadence_too_sparse",
                    "slide_count": len(slides),
                    "duration_seconds": round(duration, 3),
                    "average_seconds_per_visual": round(avg, 3),
                    "hard_max_seconds_per_visual": HARD_MAX_SECONDS_PER_VISUAL,
                    "message": (
                        "Average visual beat is too sparse for a knowledge explainer. "
                        "Split long concepts into more slides or visual states."
                    ),
                }
            )
        elif len(slides) < target_min_visuals or avg > TARGET_SECONDS_PER_VISUAL:
            warnings.append(
                {
                    "code": "visual_cadence_above_target",
                    "slide_count": len(slides),
                    "duration_seconds": round(duration, 3),
                    "average_seconds_per_visual": round(avg, 3),
                    "target_seconds_per_visual": TARGET_SECONDS_PER_VISUAL,
                    "message": (
                        "Aim for a new visual beat roughly every 25-35 seconds. "
                        "Consider adding a concept bridge, mechanism step, or example slide."
                    ),
                }
            )

    if hard_parts >= 2 and slides and len(slides) < (hard_parts * 2 + 2):
        warnings.append(
            {
                "code": "hard_concepts_need_more_visual_beats",
                "slide_count": len(slides),
                "hard_part_count": hard_parts,
                "suggested_min_slides": hard_parts * 2 + 2,
                "message": (
                    "Dense topics usually need at least two visual beats per hard concept: "
                    "definition/mechanism plus example/tradeoff."
                ),
            }
        )

    result = {
        "artifact_dir": str(artifact_dir),
        "plan_payload_path": str(plan_path),
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
    raise SystemExit(main())
