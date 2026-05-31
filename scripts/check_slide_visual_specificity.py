#!/usr/bin/env python3
"""Validate slide visual specificity in plan_payload.json."""

from __future__ import annotations

import argparse
import json
import re
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

CARD_BULLET_DIAGRAM_TYPES = {
    "boundary",
    "default_path",
    "questions",
    "rubric",
    "score_card",
    "source",
    "source_card",
    "summary",
}

CARD_BULLET_VISUAL_RE = re.compile(
    r"\b("
    r"card|cards|checklist|check-list|bullet|bullets|workflow|reading workflow|"
    r"frame|triad|dossier|rubric"
    r")\b",
    re.IGNORECASE,
)

SOURCE_SPECIFIC_VISUAL_FAMILIES = {
    "annotated screenshot / source excerpt",
    "architecture sketch",
    "code-drawn architecture/dataflow diagram",
    "state transition / lifecycle map",
    "before-after contrast",
    "failure path / recovery path",
    "metric chart",
    "timeline",
    "map / topology",
    "anatomy / layer cutaway",
    "concrete object or scene illustration",
    "evidence boundary matrix",
}

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


def looks_card_bullet_like(slide: dict[str, Any]) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    dtype = diagram_type(slide)
    visual = str(slide.get("visual", "")).strip()
    if dtype in CARD_BULLET_DIAGRAM_TYPES:
        reasons.append(f"diagram_type={dtype}")
    if CARD_BULLET_VISUAL_RE.search(visual):
        reasons.append("visual_text_card_or_layout_word")
    return bool(reasons), reasons


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


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Check whether plan_payload visual fields are non-empty, source-specific, "
            "and not dominated by repeated card/bullet layouts."
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
        "content_slide_count": 0,
        "card_bullet_like_count": 0,
        "card_bullet_like_ratio": 0.0,
        "diagram_type_counts": {},
        "layout_diversity_count": 0,
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

        content_slides: list[dict[str, Any]] = []
        content_slide_ids: set[int] = set()

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

        for fallback_number, slide in enumerate(slides, start=1):
            if not is_content_slide(slide, fallback_number, len(slides)):
                continue
            content_slides.append(slide)
            content_slide_ids.add(id(slide))

        diagram_type_counts: dict[str, int] = {}
        repeated_layout_hits: list[dict[str, Any]] = []
        structured_diagram_candidates: list[dict[str, Any]] = []
        structured_diagram_missing_spec: list[dict[str, Any]] = []

        for fallback_number, slide in enumerate(slides, start=1):
            if id(slide) not in content_slide_ids:
                continue
            dtype = diagram_type(slide) or "unspecified"
            diagram_type_counts[dtype] = diagram_type_counts.get(dtype, 0) + 1
            card_like, reasons = looks_card_bullet_like(slide)
            if card_like:
                repeated_layout_hits.append(
                    {
                        "slide_number": slide_number(slide, fallback_number),
                        "title": str(slide.get("title", "")).strip(),
                        "diagram_type": dtype,
                        "visual": str(slide.get("visual", "")).strip(),
                        "reasons": reasons,
                    }
                )

            visual = str(slide.get("visual", "")).strip()
            wants_structured_diagram = (
                dtype in STRUCTURED_DIAGRAM_TYPES
                or bool(STRUCTURED_VISUAL_RE.search(visual))
            )
            if wants_structured_diagram:
                item = {
                    "slide_number": slide_number(slide, fallback_number),
                    "title": str(slide.get("title", "")).strip(),
                    "diagram_type": dtype,
                    "visual": visual,
                }
                structured_diagram_candidates.append(item)
                if not has_structured_diagram_spec(slide):
                    structured_diagram_missing_spec.append(item)

        content_count = len(content_slides)
        card_count = len(repeated_layout_hits)
        card_ratio = card_count / content_count if content_count else 0.0
        layout_diversity_count = len([k for k, v in diagram_type_counts.items() if v > 0])

        parsed["content_slide_count"] = content_count
        parsed["card_bullet_like_count"] = card_count
        parsed["card_bullet_like_ratio"] = round(card_ratio, 3)
        parsed["diagram_type_counts"] = dict(sorted(diagram_type_counts.items()))
        parsed["layout_diversity_count"] = layout_diversity_count
        parsed["card_bullet_like_slides"] = repeated_layout_hits
        parsed["structured_diagram_candidate_count"] = len(
            structured_diagram_candidates
        )
        parsed["structured_diagram_missing_spec_count"] = len(
            structured_diagram_missing_spec
        )
        parsed["structured_diagram_missing_spec_slides"] = (
            structured_diagram_missing_spec
        )
        parsed["source_specific_visual_family_examples"] = sorted(
            SOURCE_SPECIFIC_VISUAL_FAMILIES
        )

        if content_count >= 8 and card_ratio >= 0.45:
            errors.append(
                {
                    "code": "repeated_card_bullet_layout_pattern",
                    "value": {
                        "content_slide_count": content_count,
                        "card_bullet_like_count": card_count,
                        "card_bullet_like_ratio": round(card_ratio, 3),
                    },
                    "message": (
                        "Too many body slides are planned as card/board/checklist/"
                        "question/summary-style layouts. Replace repeated box-and-bullet "
                        "patterns with source-specific visuals such as annotated source "
                        "excerpts, state transitions, before/after contrasts, architecture "
                        "sketches, metric charts, timelines, topology maps, failure paths, "
                        "or concrete scene illustrations."
                    ),
                }
            )

        if content_count >= 10 and layout_diversity_count < 5:
            warnings.append(
                {
                    "code": "low_visual_layout_diversity",
                    "value": {
                        "content_slide_count": content_count,
                        "layout_diversity_count": layout_diversity_count,
                        "diagram_type_counts": dict(sorted(diagram_type_counts.items())),
                    },
                    "message": (
                        "Body slides use too few diagram/layout families. Add more visual "
                        "families tied to the source mechanism, evidence, examples, and "
                        "failure modes."
                    ),
                }
            )

        if structured_diagram_missing_spec:
            warnings.append(
                {
                    "code": "structured_diagram_missing_spec",
                    "value": {
                        "count": len(structured_diagram_missing_spec),
                        "slides": structured_diagram_missing_spec,
                    },
                    "message": (
                        "Slides planned as architecture/dataflow/state/timeline/"
                        "failure-path diagrams should include a structured diagram "
                        "spec or code source such as diagram_spec, diagram.nodes/"
                        "edges, mermaid_code, graphviz_code, or svg_source. This "
                        "keeps generated visuals source-auditable and easier to "
                        "render consistently."
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
