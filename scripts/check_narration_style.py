#!/usr/bin/env python3
"""Block checklist-label narration that sounds like review notes read aloud."""

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


def excerpt(text: str, max_chars: int = 140) -> str:
    compact = re.sub(r"\s+", " ", text).strip()
    if len(compact) <= max_chars:
        return compact
    return compact[: max_chars - 1].rstrip() + "..."


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate that final narration is natural prose, not checklist labels."
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
