#!/usr/bin/env python3
"""Block compressed concept-heavy explainers before upload."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


BEGINNER_RE = re.compile(
    r"first[-_ ]?time|beginner|zero[-_ ]?knowledge|from zero|新手|第一次|不懂|從頭|從零",
    re.IGNORECASE,
)
BROAD_AUDIENCE_RE = re.compile(
    r"non[-_ ]?engineering|non[-_ ]?expert|非本科|非工程|跨角色|各行各業|"
    r"PM|產品|企業主|創業|founder|business|teacher|老師|教師|營運|設計|研究者|"
    r"AI[-_ ]?assisted|AI\s*軟體|AI\s*開發|AI\s*參與軟體",
    re.IGNORECASE,
)
ADVANCED_PROOF_RE = re.compile(
    r"Golod[- ]?Shafarevich|class\s+field\s+tower|class\s+group|class\s+number|"
    r"Minkowski|norm[- ]?one|pigeonhole|Q\(i\)|K=L\(i\)|"
    r"代數數論|數域塔|數域|分裂質數|質理想|理想類|類數|鴿籠原理|"
    r"複嵌入|Minkowski\s*嵌入|高維格子|高維複空間|全實數域|高斯整數|"
    r"norm[- ]?one\s*元素|證明稿|定理|推翻猜想|反例族|存在性構造|"
    r"n\^\(1\+o\(1\)\)|n\^\(1\+δ\)|n\^\(1\+delta\)|ν\(n\)|"
    r"漸近|下界|上界|固定\s*δ|固定\s*delta|無限多個\s*n|次方增益",
    re.IGNORECASE,
)
PLAIN_BRIDGE_RE = re.compile(
    r"白話|換句話說|也就是說|可以想成|先想成|可以理解為|"
    r"具體來說|最簡單的版本|先抓住|先不用懂|先不管|"
    r"像是|好比|比喻|日常|直覺上|一步一步|這句話的意思",
    re.IGNORECASE,
)

MIN_SECONDS_PER_KEY_CONCEPT = 120.0
HEALTHY_CONCEPT_HEAVY_SECONDS = 900.0
HARD_MIN_CONCEPT_HEAVY_SECONDS = 720.0


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def read_text(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def read_narration_text(artifact_dir: Path) -> str:
    narration = read_text(artifact_dir / "video" / "narration.md")
    if narration.strip():
        return narration

    payload = load_json(artifact_dir / "plan_payload.json")
    slides = payload.get("slides")
    if not isinstance(slides, list):
        return ""

    collected: list[str] = []
    for slide in slides:
        if not isinstance(slide, dict):
            continue
        for key in ("narration", "voiceover", "spoken_script", "script"):
            value = slide.get(key)
            if isinstance(value, str) and value.strip():
                collected.append(value.strip())
    return "\n\n".join(collected)


def narration_segments(text: str) -> list[str]:
    chunks = re.split(r"(?im)^\s*##\s+Slide\s+\d+\b.*$", text)
    segments = [chunk.strip() for chunk in chunks if chunk.strip()]
    if segments:
        return segments
    return [chunk.strip() for chunk in re.split(r"\n\s*\n", text) if chunk.strip()]


def canonical_lines(text: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    for match in re.finditer(r"(?im)^\s*(?:-\s*)?([a-z0-9_]+)\s*:\s*(.+?)\s*$", text):
        fields[match.group(1).lower()] = match.group(2).strip()
    return fields


def nested_get(data: dict[str, Any], *keys: str) -> Any:
    current: Any = data
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def warning_codes(data: dict[str, Any]) -> set[str]:
    codes: set[str] = set()
    for bucket in ("warnings", "errors"):
        items = data.get(bucket, [])
        if not isinstance(items, list):
            continue
        for item in items:
            if isinstance(item, dict) and isinstance(item.get("code"), str):
                codes.add(item["code"])
            elif isinstance(item, str) and item:
                codes.add(item)
    return codes


def duration_from_text(text: str) -> float | None:
    patterns = [
        r"(?im)^\s*duration\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*s?\b",
        r"(?im)^\s*-\s*Duration:\s*([0-9]+(?:\.[0-9]+)?)\s*s\b",
        r"(?im)\bduration_seconds\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)\b",
        r"(?im)\b([0-9]+(?:\.[0-9]+)?)s\s*\(",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return float(match.group(1))
    return None


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


def find_duration(artifact_dir: Path, visual_check: dict[str, Any]) -> tuple[float | None, str | None]:
    visual_duration = nested_get(visual_check, "parsed", "duration_seconds")
    if isinstance(visual_duration, (int, float)):
        return float(visual_duration), "review/visual-cadence-check.json"

    metadata = load_json(artifact_dir / "youtube" / "metadata.json")
    for key in ("video_path", "video", "file"):
        value = metadata.get(key)
        if isinstance(value, str) and value.strip():
            duration = ffprobe_duration(Path(value))
            if duration is not None:
                return duration, f"ffprobe:{value}"

    for rel in ("video/build-result.txt", "status.md", "final-report.md"):
        duration = duration_from_text(read_text(artifact_dir / rel))
        if duration is not None:
            return duration, rel

    return None, None


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Validate whether a concept-heavy video has enough depth, duration, "
            "opening clarity, and broad-audience assumptions."
        )
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    review_dir = artifact_dir / "review"

    source = load_json(artifact_dir / "source.json")
    explainer_check = load_json(review_dir / "explainer-comprehension-check.json")
    preanalytics_check = load_json(review_dir / "preanalytics-opening-check.json")
    first60_check = load_json(review_dir / "first60-density-check.json")
    visual_check = load_json(review_dir / "visual-cadence-check.json")
    explainer_fields = canonical_lines(read_text(review_dir / "explainer-comprehension.md"))

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []

    topic_domain = str(source.get("topic_domain") or "").strip().lower()
    format_decision = str(source.get("format_decision") or "").strip().lower()
    target_viewer = str(nested_get(source, "reader_value", "target_viewer") or "")
    audience_assumption = explainer_fields.get("audience_assumption", "")
    hard_parts_raw = nested_get(source, "difficulty_budget", "hard_parts")
    hard_part_count = len(hard_parts_raw) if isinstance(hard_parts_raw, list) else 0

    key_concept_count = nested_get(explainer_check, "parsed", "key_concept_count")
    if not isinstance(key_concept_count, int):
        try:
            key_concept_count = int(explainer_fields.get("key_concept_count", "0"))
        except ValueError:
            key_concept_count = 0

    preanalytics_parsed = preanalytics_check.get("parsed", {}) if isinstance(preanalytics_check.get("parsed"), dict) else {}
    first60_parsed = first60_check.get("parsed", {}) if isinstance(first60_check.get("parsed"), dict) else {}

    comprehension_load = str(
        preanalytics_parsed.get("comprehension_load")
        or first60_parsed.get("comprehension_load")
        or ""
    ).upper()
    first60_density = str(
        preanalytics_parsed.get("first_60s_density")
        or first60_parsed.get("first_60s_density")
        or ""
    ).lower()
    first30_clarity = str(preanalytics_parsed.get("first_30_second_clarity") or "").upper()
    opening_labels = preanalytics_parsed.get("opening_new_labels_before_30s")
    opening_points = preanalytics_parsed.get("opening_slide2_points_count")
    narration_text = read_narration_text(artifact_dir)
    segments = narration_segments(narration_text)
    advanced_proof_term_count = len(ADVANCED_PROOF_RE.findall(narration_text))
    advanced_proof_segment_count = sum(1 for segment in segments if ADVANCED_PROOF_RE.search(segment))
    plain_bridge_count = len(PLAIN_BRIDGE_RE.findall(narration_text))

    duration_seconds, duration_source = find_duration(artifact_dir, visual_check)
    seconds_per_key_concept = (
        round(duration_seconds / key_concept_count, 3)
        if duration_seconds is not None and key_concept_count > 0
        else None
    )

    preanalytics_codes = warning_codes(preanalytics_check)
    first60_codes = warning_codes(first60_check)
    compression_signals = {
        "first30_comprehension_gap": "first30_comprehension_gap" in preanalytics_codes,
        "comprehension_load_warn_or_fail": comprehension_load in {"WARN", "FAIL"},
        "first60_density_medium_or_high": first60_density in {"medium", "high"},
    }
    has_compression_signal = any(compression_signals.values())

    is_technical = topic_domain == "technical"
    is_long_form = format_decision in {"", "long-form", "long_form", "longform"}
    is_concept_heavy = key_concept_count >= 4 or hard_part_count >= 3
    audience_text = f"{audience_assumption} {target_viewer}"

    parsed: dict[str, Any] = {
        "topic_domain": topic_domain,
        "format_decision": format_decision,
        "target_viewer": target_viewer,
        "audience_assumption": audience_assumption,
        "key_concept_count": key_concept_count,
        "hard_part_count": hard_part_count,
        "duration_seconds": duration_seconds,
        "duration_source": duration_source,
        "seconds_per_key_concept": seconds_per_key_concept,
        "first_30_second_clarity": first30_clarity,
        "comprehension_load": comprehension_load,
        "first_60s_density": first60_density,
        "opening_new_labels_before_30s": opening_labels,
        "opening_slide2_points_count": opening_points,
        "is_technical": is_technical,
        "is_long_form": is_long_form,
        "is_concept_heavy": is_concept_heavy,
        "compression_signals": compression_signals,
        "narration_segment_count": len(segments),
        "advanced_proof_term_count": advanced_proof_term_count,
        "advanced_proof_segment_count": advanced_proof_segment_count,
        "plain_bridge_count": plain_bridge_count,
    }

    if explainer_check.get("status") != "PASS":
        errors.append(
            {
                "code": "explainer_comprehension_not_pass",
                "message": (
                    "review/explainer-comprehension-check.json must be PASS before "
                    "concept-depth review can pass."
                ),
            }
        )

    if not BEGINNER_RE.search(audience_text):
        errors.append(
            {
                "code": "audience_not_explicitly_first_time",
                "audience_assumption": audience_assumption,
                "target_viewer": target_viewer,
                "message": (
                    "State explicitly that the viewer may be first-time, beginner, "
                    "or zero-knowledge before upload."
                ),
            }
        )

    if is_technical and not BROAD_AUDIENCE_RE.search(audience_text):
        errors.append(
            {
                "code": "technical_audience_not_cross_role_explicit",
                "audience_assumption": audience_assumption,
                "target_viewer": target_viewer,
                "message": (
                    "Technical explainers must explicitly include non-specialist or "
                    "cross-role viewers such as PMs, business owners, teachers, "
                    "non-CS learners, or AI-assisted software participants."
                ),
            }
        )

    for name, data in (
        ("preanalytics-opening-check", preanalytics_check),
        ("first60-density-check", first60_check),
        ("visual-cadence-check", visual_check),
    ):
        if data.get("status") == "FAIL":
            errors.append(
                {
                    "code": f"{name}_fail",
                    "message": f"review/{name}.json is FAIL and must be repaired before upload.",
                }
            )

    if is_technical and is_long_form and is_concept_heavy and has_compression_signal:
        if first60_density == "high":
            errors.append(
                {
                    "code": "concept_heavy_opening_density_high",
                    "first_60s_density": first60_density,
                    "message": (
                        "A concept-heavy technical long-form video cannot upload with "
                        "high first-60-second density. Slow down the opening, split labels, "
                        "or turn the topic into a concept series."
                    ),
                }
            )

        if duration_seconds is not None and duration_seconds < HARD_MIN_CONCEPT_HEAVY_SECONDS:
            errors.append(
                {
                    "code": "concept_heavy_video_too_short_for_warned_comprehension",
                    "duration_seconds": round(duration_seconds, 3),
                    "hard_min_seconds": HARD_MIN_CONCEPT_HEAVY_SECONDS,
                    "message": (
                        "This is a concept-heavy technical long-form topic with opening "
                        "comprehension warnings, but the video is under 12 minutes. "
                        "Expand explanations or split into a term/concept series before upload."
                    ),
                }
            )
        elif duration_seconds is not None and duration_seconds < HEALTHY_CONCEPT_HEAVY_SECONDS:
            warnings.append(
                {
                    "code": "concept_heavy_duration_below_healthy_target",
                    "duration_seconds": round(duration_seconds, 3),
                    "healthy_target_seconds": HEALTHY_CONCEPT_HEAVY_SECONDS,
                    "message": (
                        "Concept-heavy technical long-form videos should usually target "
                        "15-20 minutes when the source supports it. Keep upload eligibility "
                        "only if the script has enough examples, mechanisms, and tradeoffs."
                    ),
                }
            )

        if (
            seconds_per_key_concept is not None
            and seconds_per_key_concept < MIN_SECONDS_PER_KEY_CONCEPT
        ):
            errors.append(
                {
                    "code": "too_little_time_per_key_concept",
                    "seconds_per_key_concept": seconds_per_key_concept,
                    "min_seconds_per_key_concept": MIN_SECONDS_PER_KEY_CONCEPT,
                    "message": (
                        "The declared key concepts are too compressed for the current "
                        "runtime while comprehension warnings are present. Reduce the "
                        "concept set, extend the runtime, or split the source into a series."
                    ),
                }
            )

        if "first30_comprehension_gap" in preanalytics_codes:
            errors.append(
                {
                    "code": "first30_comprehension_gap_blocks_concept_heavy_upload",
                    "first_30_second_clarity": first30_clarity,
                    "comprehension_load": comprehension_load,
                    "message": (
                        "For concept-heavy technical videos, a clear opening promise is "
                        "not enough when comprehension load is still WARN/FAIL. Repair "
                        "the opening or split the concepts before upload."
                    ),
                }
            )

    elif has_compression_signal:
        warnings.append(
            {
                "code": "opening_compression_signal",
                "compression_signals": compression_signals,
                "message": (
                    "Opening compression was detected. This is not a hard blocker for "
                    "narrow topics, but it must be recorded as a concrete next-run fix."
                ),
            }
        )

    if (
        is_technical
        and is_long_form
        and is_concept_heavy
        and hard_part_count >= 5
        and duration_seconds is not None
        and duration_seconds < HEALTHY_CONCEPT_HEAVY_SECONDS
        and advanced_proof_term_count >= 18
        and advanced_proof_segment_count >= 6
    ):
        errors.append(
            {
                "code": "advanced_proof_topic_too_compressed_for_first_time_viewer",
                "duration_seconds": round(duration_seconds, 3),
                "healthy_target_seconds": HEALTHY_CONCEPT_HEAVY_SECONDS,
                "hard_part_count": hard_part_count,
                "advanced_proof_term_count": advanced_proof_term_count,
                "advanced_proof_segment_count": advanced_proof_segment_count,
                "message": (
                    "This technical long-form script relies on many advanced proof or "
                    "abstract-math terms while staying under the 15-minute healthy target. "
                    "Narrow the promise, split the source into a concept series, or rewrite "
                    "the script so the first-time viewer can follow one proof chain from zero."
                ),
            }
        )

    if (
        is_technical
        and is_long_form
        and is_concept_heavy
        and advanced_proof_term_count >= 18
        and advanced_proof_segment_count >= 8
        and plain_bridge_count < max(5, hard_part_count)
    ):
        errors.append(
            {
                "code": "not_enough_plain_language_bridges_for_advanced_proof",
                "plain_bridge_count": plain_bridge_count,
                "required_plain_bridge_count": max(5, hard_part_count),
                "advanced_proof_segment_count": advanced_proof_segment_count,
                "message": (
                    "Advanced proof-heavy narration needs repeated plain-language bridges, "
                    "not only labels or term translations. Add concrete intuition, step-by-step "
                    "bridges, and worked examples before upload."
                ),
            }
        )

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
