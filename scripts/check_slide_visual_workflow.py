#!/usr/bin/env python3
"""Validate Claude-Code-style slide visual workflow artifacts."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path
from typing import Any


TARGET_STATIC_SLIDE_SECONDS = 35.0
HARD_MAX_STATIC_SLIDE_SECONDS = 45.0

REQUIRED_VISUAL_BRIEF_FIELDS = (
    "main_object",
    "source_specific_anchor",
    "layout_family",
    "visual_role",
    "diagram_spec_or_source",
    "mobile_readability_risk",
    "expected_screenshot_check",
)

PASS_VALUES = {"PASS", "YES", "DONE"}
NO_ISSUES_VALUES = {"PASS", "NO_ISSUES", "NO_ISSUES_FOUND"}
SKIP_VALUES = {"SKIP", "SKIP_SIMPLE_TOPIC", "NOT_NEEDED"}

STRUCTURED_DIAGRAM_TYPES = {
    "architecture",
    "architecture_sketch",
    "data_flow",
    "dataflow",
    "decision_map",
    "failure_path",
    "flow",
    "flowchart",
    "graph",
    "lifecycle",
    "mermaid",
    "mermaid_flowchart",
    "mermaid_sequence",
    "mermaid_state",
    "pipeline",
    "sequence",
    "state",
    "state_transition",
    "timeline",
    "topology",
}

STRUCTURED_VISUAL_RE = re.compile(
    r"\b("
    r"architecture|data[- ]?flow|flowchart|pipeline|sequence|state transition|"
    r"timeline|topology|failure path|decision map|graph|mermaid|graphviz"
    r")\b",
    re.IGNORECASE,
)


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def parse_key_values(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    values: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        match = re.match(r"^\s*(?:[-*]\s*)?([a-zA-Z0-9_/-]+)\s*:\s*(.+?)\s*$", raw)
        if not match:
            continue
        key = match.group(1).strip().replace("-", "_").lower()
        values[key] = match.group(2).strip()
    return values


def status_value(values: dict[str, str], key: str) -> str:
    return values.get(key, "").strip().upper().replace(" ", "_")


def parse_slides(payload: dict[str, Any]) -> list[dict[str, Any]]:
    slides = payload.get("slides")
    if isinstance(slides, list):
        return [s for s in slides if isinstance(s, dict)]
    plan = payload.get("plan")
    if isinstance(plan, dict) and isinstance(plan.get("slides"), list):
        return [s for s in plan["slides"] if isinstance(s, dict)]
    return []


def slide_number(slide: dict[str, Any], fallback: int) -> int:
    for key in ("idx", "slide_number", "number"):
        value = slide.get(key)
        if isinstance(value, int):
            return value
        if isinstance(value, str) and value.isdigit():
            return int(value)
    return fallback


def diagram_type(slide: dict[str, Any]) -> str:
    for key in ("diagram_type", "kind", "diagramKind"):
        value = slide.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip().lower()
    diagram = slide.get("diagram")
    if isinstance(diagram, dict):
        value = diagram.get("type") or diagram.get("kind")
        if isinstance(value, str) and value.strip():
            return value.strip().lower()
    return ""


def is_content_slide(slide: dict[str, Any], fallback_number: int, total: int) -> bool:
    number = slide_number(slide, fallback_number)
    if number <= 1 or fallback_number <= 1:
        return False
    if total >= 6 and fallback_number == total:
        return False
    role = str(slide.get("role", "")).strip().lower()
    title = str(slide.get("title", "")).strip().lower()
    if role in {"cover", "title", "homepage", "summary", "final"}:
        return False
    if "總結" in title and fallback_number == total:
        return False
    return True


def has_structured_diagram_spec(slide: dict[str, Any]) -> bool:
    for key in (
        "diagram_spec",
        "diagram_code",
        "mermaid",
        "mermaid_code",
        "graphviz",
        "graphviz_code",
        "svg_source",
    ):
        value = slide.get(key)
        if isinstance(value, str) and value.strip():
            return True
        if isinstance(value, dict) and value:
            return True

    diagram = slide.get("diagram")
    if isinstance(diagram, dict):
        for key in ("spec", "code", "mermaid", "graphviz", "source", "nodes", "edges"):
            value = diagram.get(key)
            if isinstance(value, str) and value.strip():
                return True
            if isinstance(value, list) and value:
                return True
            if isinstance(value, dict) and value:
                return True
    return False


def wants_structured_diagram(slide: dict[str, Any]) -> bool:
    dtype = diagram_type(slide)
    visual = str(slide.get("visual", "")).strip()
    return dtype in STRUCTURED_DIAGRAM_TYPES or bool(STRUCTURED_VISUAL_RE.search(visual))


def visual_brief(slide: dict[str, Any]) -> dict[str, Any]:
    brief = slide.get("visual_brief")
    return brief if isinstance(brief, dict) else {}


def missing_visual_brief_fields(slide: dict[str, Any]) -> list[str]:
    brief = visual_brief(slide)
    missing: list[str] = []
    for key in REQUIRED_VISUAL_BRIEF_FIELDS:
        value = brief.get(key)
        if not isinstance(value, str) or len(value.strip()) < 4:
            missing.append(key)
    return missing


def resolve_note_path(artifact_dir: Path, raw: str, default_relative: str) -> Path:
    value = raw.strip() or default_relative
    path = Path(value)
    if path.is_absolute():
        return path
    return artifact_dir / path


def display_path(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def preview_artifact_count(path: Path) -> int:
    if not path.exists() or not path.is_dir():
        return 0
    return len(
        [
            item
            for item in path.iterdir()
            if item.is_file() and item.suffix.lower() in {".png", ".jpg", ".jpeg", ".html", ".md", ".svg"}
        ]
    )


def natural_key(path: Path) -> list[object]:
    parts: list[object] = []
    for part in re.split(r"(\d+)", path.name):
        parts.append(int(part) if part.isdigit() else part.lower())
    return parts


def ffprobe_duration(path: Path) -> float | None:
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


def segment_duration_records(artifact_dir: Path) -> list[dict[str, Any]]:
    segment_dir = artifact_dir / "video" / "build" / "segments"
    if not segment_dir.exists():
        return []

    records: list[dict[str, Any]] = []
    for fallback_number, path in enumerate(sorted(segment_dir.glob("*.mp4"), key=natural_key), start=1):
        duration = ffprobe_duration(path)
        if duration is None:
            continue
        records.append(
            {
                "slide_number": fallback_number,
                "file": display_path(path, artifact_dir),
                "duration_seconds": round(duration, 3),
            }
        )
    return records


def float_value(values: dict[str, str], key: str) -> float | None:
    match = re.search(r"-?\d+(?:\.\d+)?", values.get(key, ""))
    return float(match.group(0)) if match else None


def int_value(values: dict[str, str], key: str) -> int:
    match = re.search(r"\d+", values.get(key, ""))
    return int(match.group(0)) if match else 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check slide visual brief, preview, contact-sheet, and screenshot review artifacts."
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    review_dir = artifact_dir / "review"
    note_path = review_dir / "slide-visual-workflow.md"
    plan_path = artifact_dir / "plan_payload.json"
    source_path = artifact_dir / "source.json"
    values = parse_key_values(note_path)
    payload = load_json(plan_path)
    source = load_json(source_path)
    slides = parse_slides(payload)

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {
        "note_path": str(note_path),
        "plan_payload_path": str(plan_path),
        "slide_count": len(slides),
        "source_format_decision": source.get("format_decision"),
        "checked_keys": values,
    }

    result: dict[str, Any] = {
        "artifact_dir": str(artifact_dir),
        "status": "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": parsed,
    }

    if not note_path.exists():
        errors.append(
            {
                "code": "missing_slide_visual_workflow_note",
                "file": "review/slide-visual-workflow.md",
                "message": "Create review/slide-visual-workflow.md before upload.",
            }
        )
    if not plan_path.exists():
        errors.append(
            {
                "code": "missing_plan_payload",
                "file": "plan_payload.json",
                "message": "plan_payload.json is required for slide visual workflow checks.",
            }
        )
    if not slides:
        errors.append(
            {
                "code": "missing_slides",
                "message": "No slides found in plan_payload.json.",
            }
        )

    required_pass_keys = (
        "visual_brief_created",
        "visual_brief_fields_complete",
        "structured_diagram_specs_checked",
        "progressive_split_reviewed",
        "slide_duration_reviewed",
        "dark_mode_body_slides_reviewed",
        "contact_sheet_created",
        "contact_sheet_reviewed",
        "mobile_readability_reviewed",
        "template_repetition_reviewed",
    )
    for key in required_pass_keys:
        if status_value(values, key) not in PASS_VALUES:
            errors.append(
                {
                    "code": "slide_visual_workflow_key_not_pass",
                    "key": key,
                    "value": values.get(key),
                    "message": f"`{key}: PASS` is required in review/slide-visual-workflow.md.",
                }
            )

    fix_status = status_value(values, "fix_cycle_completed")
    if fix_status not in NO_ISSUES_VALUES:
        errors.append(
            {
                "code": "missing_or_unfinished_visual_fix_cycle",
                "key": "fix_cycle_completed",
                "value": values.get("fix_cycle_completed"),
                "message": "`fix_cycle_completed` must be PASS or NO_ISSUES_FOUND after contact-sheet review.",
            }
        )

    findings = values.get("screenshot_review_findings", "").strip()
    if len(findings) < 20:
        errors.append(
            {
                "code": "missing_screenshot_review_findings",
                "key": "screenshot_review_findings",
                "message": "Record what was checked in the rendered slide contact sheet.",
            }
        )

    contact_sheet_path = resolve_note_path(
        artifact_dir,
        values.get("contact_sheet_path", ""),
        "review/slide-contact-sheet.png",
    )
    parsed["contact_sheet_path"] = str(contact_sheet_path)
    if status_value(values, "contact_sheet_created") in PASS_VALUES and not contact_sheet_path.exists():
        errors.append(
            {
                "code": "contact_sheet_file_missing",
                "file": display_path(contact_sheet_path, artifact_dir),
                "message": "contact_sheet_created is PASS but the contact sheet image does not exist.",
            }
        )

    segment_records = segment_duration_records(artifact_dir)
    parsed["target_static_slide_seconds"] = TARGET_STATIC_SLIDE_SECONDS
    parsed["hard_max_static_slide_seconds"] = HARD_MAX_STATIC_SLIDE_SECONDS
    parsed["segment_duration_count"] = len(segment_records)
    parsed["segment_durations"] = segment_records

    if segment_records:
        longest = max(segment_records, key=lambda record: record["duration_seconds"])
        over_target = [
            record
            for record in segment_records
            if record["duration_seconds"] > TARGET_STATIC_SLIDE_SECONDS
        ]
        over_hard = [
            record
            for record in segment_records
            if record["duration_seconds"] > HARD_MAX_STATIC_SLIDE_SECONDS
        ]
        parsed["longest_static_slide"] = longest
        parsed["static_slide_above_target_count"] = len(over_target)
        parsed["static_slide_above_hard_max_count"] = len(over_hard)

        if slides and len(segment_records) != len(slides):
            errors.append(
                {
                    "code": "segment_slide_count_mismatch",
                    "slide_count": len(slides),
                    "segment_count": len(segment_records),
                    "message": (
                        "Rendered video segments must match slide count so per-slide duration "
                        "can be audited before upload."
                    ),
                }
            )
        if over_hard:
            errors.append(
                {
                    "code": "static_slide_duration_over_hard_max",
                    "value": over_hard,
                    "message": (
                        "A single static slide is carrying more than 45 seconds of narration. "
                        "Split it into progressive reveal states or multiple slides before upload."
                    ),
                }
            )
        elif over_target:
            warnings.append(
                {
                    "code": "static_slide_duration_above_target",
                    "value": over_target,
                    "message": (
                        "One or more static slides exceed the 35-second target. "
                        "Keep only if the contact-sheet review confirms the slide is not too dense; "
                        "otherwise split into progressive visual beats."
                    ),
                }
            )
    else:
        note_max_static = float_value(values, "max_static_slide_seconds")
        parsed["max_static_slide_seconds_from_note"] = note_max_static
        if note_max_static is None:
            errors.append(
                {
                    "code": "missing_static_slide_duration_evidence",
                    "key": "max_static_slide_seconds",
                    "message": (
                        "No video/build/segments/*.mp4 durations were found. Record "
                        "`max_static_slide_seconds` in review/slide-visual-workflow.md, "
                        "or keep build segments so the checker can audit per-slide duration."
                    ),
                }
            )
        elif note_max_static > HARD_MAX_STATIC_SLIDE_SECONDS:
            errors.append(
                {
                    "code": "static_slide_duration_over_hard_max",
                    "value": note_max_static,
                    "message": (
                        "A single static slide is carrying more than 45 seconds of narration. "
                        "Split it into progressive reveal states or multiple slides before upload."
                    ),
                }
            )
        elif note_max_static > TARGET_STATIC_SLIDE_SECONDS:
            warnings.append(
                {
                    "code": "static_slide_duration_above_target",
                    "value": note_max_static,
                    "message": (
                        "The longest static slide exceeds the 35-second target. "
                        "Review whether it should be split into progressive visual beats."
                    ),
                }
            )

    structured_slides: list[dict[str, Any]] = []
    structured_missing_spec: list[dict[str, Any]] = []
    required_brief_slide_ids: set[int] = set()
    required_brief_slides: list[dict[str, Any]] = []
    content_count = 0
    for fallback_number, slide in enumerate(slides, start=1):
        if fallback_number <= 4:
            required_brief_slide_ids.add(id(slide))
        if is_content_slide(slide, fallback_number, len(slides)):
            content_count += 1
        if wants_structured_diagram(slide):
            item = {
                "slide_number": slide_number(slide, fallback_number),
                "title": str(slide.get("title", "")).strip(),
                "diagram_type": diagram_type(slide) or "unspecified",
                "visual": str(slide.get("visual", "")).strip(),
            }
            structured_slides.append(item)
            required_brief_slide_ids.add(id(slide))
            if not has_structured_diagram_spec(slide):
                structured_missing_spec.append(item)
    for fallback_number, slide in enumerate(slides, start=1):
        if id(slide) in required_brief_slide_ids:
            required_brief_slides.append(slide)

    parsed["content_slide_count"] = content_count
    parsed["structured_diagram_candidate_count"] = len(structured_slides)
    parsed["structured_diagram_missing_spec_count"] = len(structured_missing_spec)
    parsed["structured_diagram_missing_spec_slides"] = structured_missing_spec
    if structured_missing_spec:
        errors.append(
            {
                "code": "structured_diagram_missing_spec",
                "value": {
                    "count": len(structured_missing_spec),
                    "slides": structured_missing_spec,
                },
                "message": (
                    "Architecture/dataflow/state/timeline/failure-path slides need "
                    "diagram_spec, diagram.nodes/edges, mermaid_code, graphviz_code, or svg_source."
                ),
            }
        )

    missing_brief_slides: list[dict[str, Any]] = []
    slide_fallback_numbers = {id(slide): idx for idx, slide in enumerate(slides, start=1)}
    for slide in required_brief_slides:
        fallback_number = slide_fallback_numbers.get(id(slide), 1)
        missing = missing_visual_brief_fields(slide)
        if missing:
            missing_brief_slides.append(
                {
                    "slide_number": slide_number(slide, fallback_number),
                    "title": str(slide.get("title", "")).strip(),
                    "missing_fields": missing,
                }
            )
    parsed["visual_brief_required_slide_count"] = len(required_brief_slides)
    parsed["visual_brief_missing_or_incomplete_count"] = len(missing_brief_slides)
    if missing_brief_slides:
        errors.append(
            {
                "code": "visual_brief_missing_or_incomplete",
                "value": missing_brief_slides,
                "message": (
                    "Slides 1-4 and structural diagram slides must include visual_brief "
                    "with main_object, source_specific_anchor, layout_family, visual_role, "
                    "diagram_spec_or_source, mobile_readability_risk, and expected_screenshot_check."
                ),
            }
        )

    preview_status = status_value(values, "direction_previews_considered")
    preview_path = resolve_note_path(
        artifact_dir,
        values.get("visual_direction_preview_path", ""),
        "review/visual-direction-previews",
    )
    preview_count = max(int_value(values, "direction_preview_count"), preview_artifact_count(preview_path))
    hard_topic = (
        len(slides) >= 10
        or str(source.get("format_decision", "")).lower() == "long-form"
        or len(structured_slides) >= 2
    )
    parsed["hard_topic_preview_required"] = hard_topic
    parsed["visual_direction_preview_path"] = str(preview_path)
    parsed["direction_preview_count"] = preview_count
    if hard_topic:
        if preview_status not in PASS_VALUES or preview_count < 3:
            errors.append(
                {
                    "code": "direction_previews_required_for_hard_topic",
                    "value": {
                        "direction_previews_considered": values.get("direction_previews_considered"),
                        "direction_preview_count": preview_count,
                        "visual_direction_preview_path": str(preview_path),
                    },
                    "message": (
                        "Hard technical videos need three visual direction previews "
                        "before the full deck: safe editorial, source-native, and wildcard."
                    ),
                }
            )
    elif preview_status not in PASS_VALUES and preview_status not in SKIP_VALUES:
        warnings.append(
            {
                "code": "direction_previews_not_recorded",
                "value": values.get("direction_previews_considered"),
                "message": "Record PASS or SKIP_SIMPLE_TOPIC for direction_previews_considered.",
            }
        )

    result["status"] = "FAIL" if errors else "PASS"
    payload_text = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(payload_text, encoding="utf-8")
    else:
        print(payload_text, end="")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
