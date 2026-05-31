#!/usr/bin/env python3
"""Block narration/slide framing that sounds like review notes or meta lessons."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


LABEL_RE = re.compile(
    r"(定義上|背景是|機制上|例子上|限制是|取捨是|結論是|意義是|證據是|"
    r"definition[- ]?wise|mechanism[- ]?wise|example[- ]?wise|limitation[- ]?wise)",
    re.IGNORECASE,
)

META_READING_RE = re.compile(
    r"(怎麼讀(?:這篇|來源|.*benchmark)|如何讀(?:這篇|來源|.*benchmark)|"
    r"怎麼看(?:這篇|來源|.*benchmark)|如何看(?:這篇|來源|.*benchmark)|"
    r"如何閱讀|讀文章時|讀這篇時|看來源時|看這篇時|"
    r"下次讀這類來源|下次看這類來源|閱讀方式|"
    r"怎麼判讀來源|如何判讀來源|怎麼判斷來源|如何判斷來源|benchmark\s*敘述.*過度解讀|"
    r"先看來源[：:]|這篇(?:來源|文章)?.{0,10}在回答什麼|"
    r"讀完這篇|看完這篇|這篇(?:來源|文章)?.{0,12}(?:邊界|限制)|"
    r"來源能說的.{0,12}不能(?:直接)?說的)",
    re.IGNORECASE,
)


def load_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def read_narration_from_markdown(path: Path) -> list[str]:
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8", errors="replace")
    chunks: list[str] = []
    current: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            if current:
                chunks.append(" ".join(current).strip())
                current = []
            continue
        if re.match(r"^#{1,6}\s+", stripped):
            if current:
                chunks.append(" ".join(current).strip())
                current = []
            continue
        current.append(stripped)
    if current:
        chunks.append(" ".join(current).strip())
    return [chunk for chunk in chunks if chunk]


def read_narration(artifact_dir: Path) -> list[str]:
    plan = load_json(artifact_dir / "plan_payload.json") or {}
    raw = plan.get("narration")
    if isinstance(raw, list):
        narration = [str(item).strip() for item in raw if str(item).strip()]
        if narration:
            return narration

    nested_plan = plan.get("plan")
    if isinstance(nested_plan, dict) and isinstance(nested_plan.get("narration"), list):
        narration = [
            str(item).strip()
            for item in nested_plan["narration"]
            if str(item).strip()
        ]
        if narration:
            return narration

    return read_narration_from_markdown(artifact_dir / "video" / "narration.md")


def read_public_text_surfaces(artifact_dir: Path) -> list[dict[str, Any]]:
    surfaces: list[dict[str, Any]] = []

    for index, segment in enumerate(read_narration(artifact_dir), start=1):
        surfaces.append({"surface": "narration", "index": index, "text": segment})

    plan = load_json(artifact_dir / "plan_payload.json") or {}
    slides = plan.get("slides")
    if not isinstance(slides, list):
        nested_plan = plan.get("plan")
        if isinstance(nested_plan, dict):
            slides = nested_plan.get("slides")
    if isinstance(slides, list):
        for slide_index, slide in enumerate(slides, start=1):
            if not isinstance(slide, dict):
                continue
            for field in ("title", "subtitle", "headline"):
                value = slide.get(field)
                if isinstance(value, str) and value.strip():
                    surfaces.append(
                        {
                            "surface": f"slide.{field}",
                            "index": slide_index,
                            "text": value.strip(),
                        }
                    )

    metadata = load_json(artifact_dir / "youtube" / "metadata.json") or {}
    for field in ("title", "description"):
        value = metadata.get(field)
        if isinstance(value, str) and value.strip():
            surfaces.append({"surface": f"youtube.{field}", "index": None, "text": value.strip()})

    return surfaces


def excerpt(text: str, max_chars: int = 140) -> str:
    compact = re.sub(r"\s+", " ", text).strip()
    if len(compact) <= max_chars:
        return compact
    return compact[: max_chars - 1].rstrip() + "..."


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate that final narration/slides are natural source explanation, not checklist labels or generic reading-method lessons."
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    narration = read_narration(artifact_dir)
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []

    segment_details: list[dict[str, Any]] = []
    label_segment_count = 0
    heavy_label_segment_count = 0
    total_label_count = 0
    meta_reading_hits: list[dict[str, Any]] = []

    for index, segment in enumerate(narration, start=1):
        labels = [match.group(0) for match in LABEL_RE.finditer(segment)]
        label_count = len(labels)
        if label_count:
            label_segment_count += 1
            total_label_count += label_count
        if label_count >= 3:
            heavy_label_segment_count += 1
        if label_count:
            segment_details.append(
                {
                    "segment": index,
                    "label_count": label_count,
                    "labels": labels,
                    "excerpt": excerpt(segment),
                }
            )

    parsed: dict[str, Any] = {
        "narration_segment_count": len(narration),
        "label_segment_count": label_segment_count,
        "heavy_label_segment_count": heavy_label_segment_count,
        "total_label_count": total_label_count,
        "label_segment_ratio": round(label_segment_count / len(narration), 4)
        if narration
        else None,
        "segments_with_labels": segment_details[:20],
    }

    for item in read_public_text_surfaces(artifact_dir):
        text = str(item.get("text") or "")
        matches = [match.group(0) for match in META_READING_RE.finditer(text)]
        if matches:
            meta_reading_hits.append(
                {
                    "surface": item.get("surface"),
                    "index": item.get("index"),
                    "matches": matches,
                    "excerpt": excerpt(text),
                }
            )
    parsed["meta_reading_hits"] = meta_reading_hits[:20]

    if not narration:
        errors.append(
            {
                "code": "missing_narration",
                "message": "plan_payload.json or video/narration.md must contain final narration.",
            }
        )
    elif heavy_label_segment_count >= 2 or label_segment_count >= 4 or total_label_count >= 8:
        errors.append(
            {
                "code": "checklist_label_narration",
                "message": (
                    "Final narration repeatedly uses review/checklist labels such as "
                    "`定義上`, `機制上`, `例子上`, or `限制是`. Rewrite as natural spoken prose "
                    "before TTS/render/upload."
                ),
                "label_segment_count": label_segment_count,
                "heavy_label_segment_count": heavy_label_segment_count,
                "total_label_count": total_label_count,
            }
        )
    elif label_segment_count:
        warnings.append(
            {
                "code": "isolated_checklist_label_phrase",
                "message": (
                    "A small number of checklist label phrases appeared. This may pass only "
                    "when it sounds natural in context; prefer ordinary prose."
                ),
                "label_segment_count": label_segment_count,
                "total_label_count": total_label_count,
            }
        )

    if meta_reading_hits:
        errors.append(
            {
                "code": "meta_reading_method_frame",
                "message": (
                    "Final narration, slide text, or metadata frames the source video as a generic "
                    "lesson about how to read the article/source/benchmark. Source videos should do "
                    "the reading work directly. Rewrite as source-native evidence boundaries: what "
                    "was compared, under which conditions, what conclusion is supported, and what "
                    "cannot be inferred."
                ),
                "hit_count": len(meta_reading_hits),
                "hits": meta_reading_hits[:10],
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
