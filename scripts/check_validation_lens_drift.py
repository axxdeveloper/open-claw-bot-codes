#!/usr/bin/env python3
"""Block validation/use-case lens drift in article-video public surfaces.

This gate exists for sources that are not themselves primarily about evals,
benchmarks, verification, governance, or acceptance testing. It checks the
surfaces viewers actually see: YouTube metadata, title/tags, opening/cover,
slide titles, and the ending narration. It also catches Isaac's 2026-05-21
source-understanding reset: public framing should introduce the source, not
lead with role lists or generic導入/驗收/use-case packaging.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path
from typing import Any


VALIDATION_TERMS = (
    "AI 驗收",
    "上線驗收",
    "驗收清單",
    "驗收流程",
    "可交付",
    "可負責",
    "驗收",
    "放行",
    "checklist",
    "validation",
    "validate",
    "verified",
    "verify",
    "verification",
    "acceptance",
    "acceptance testing",
    "governance",
    "gate",
)

DESCRIPTION_BLOCKING_TERMS = (
    "AI 驗收",
    "上線驗收",
    "驗收清單",
    "驗收流程",
    "可交付",
    "可負責",
    "驗收",
    "上線",
    "放行",
    "checklist",
    "validation",
    "validate",
    "verify",
    "verification",
    "acceptance",
    "gate",
)

SOURCE_NATIVE_RE = re.compile(
    r"("
    r"\bevals?\b|\bevaluation\b|\bbenchmark(?:s|ing)?\b|\bverification\b|"
    r"\bvalidation\b|\bvalidate\b|\bverified\b|\bgovernance\b|"
    r"\bacceptance(?: testing)?\b|\bsafety evals?\b|"
    r"評估|基準|測試|驗證|驗收|治理|安全評估|安全測試|紅隊|稽核"
    r")",
    re.IGNORECASE,
)

USECASE_TERMS = (
    "導入",
    "採用",
    "導入判斷",
    "採用判斷",
    "工作流",
    "實務判斷",
    "風險檢查",
    "決策框架",
    "判斷框架",
    "workflow",
    "adoption",
    "use case",
)

ROLE_TERMS = (
    "PM",
    "產品經理",
    "企業主",
    "老師",
    "教師",
    "各行各業",
    "想成為工程師",
    "現役工程師",
    "工程學習者",
    "AI 軟體參與者",
)

USECASE_SOURCE_NATIVE_RE = re.compile(
    r"("
    r"\badoption\b|\bworkflow\b|\brollout\b|\bdeployment\b|\bimplementation\b|"
    r"\boperational readiness\b|\bmigration\b|導入|採用|工作流|上線|部署|遷移|營運準備"
    r")",
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


def compact(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def count_terms(text: str, terms: tuple[str, ...] = VALIDATION_TERMS) -> dict[str, int]:
    lowered = text.lower()
    counts: dict[str, int] = {}
    for term in terms:
        if re.fullmatch(r"[A-Za-z][A-Za-z ]*", term):
            pattern = r"(?<![A-Za-z])" + re.escape(term.lower()).replace(r"\ ", r"\s+") + r"(?![A-Za-z])"
            n = len(re.findall(pattern, lowered, re.IGNORECASE))
        else:
            n = lowered.count(term.lower())
        if n:
            counts[term] = n
    return counts


def total_count(counts: dict[str, int]) -> int:
    return sum(counts.values())


def first_paragraphs(description: str, n: int = 2) -> str:
    parts = [p.strip() for p in re.split(r"\n\s*\n", description or "") if p.strip()]
    return "\n\n".join(parts[:n])


def slide_text(slide: dict[str, Any]) -> str:
    chunks: list[str] = []
    for key in ("title", "subtitle"):
        value = slide.get(key)
        if isinstance(value, str):
            chunks.append(value)
    for key in ("points", "diagram"):
        value = slide.get(key)
        if isinstance(value, list):
            chunks.extend(str(v) for v in value)
        elif isinstance(value, str):
            chunks.append(value)
    return compact(" ".join(chunks))


def read_narration(plan: dict[str, Any], artifact_dir: Path) -> list[str]:
    raw = plan.get("narration")
    if isinstance(raw, list) and raw:
        return [compact(x) for x in raw if str(x).strip()]
    narration_path = artifact_dir / "video" / "narration.md"
    if not narration_path.exists():
        return []
    text = narration_path.read_text(encoding="utf-8", errors="replace")
    parts = re.split(r"(?m)^##\s+Slide\s+\d+\s*$", text)
    return [compact(p) for p in parts if p.strip() and not p.strip().startswith("#")]


def source_native(source: dict[str, Any]) -> bool:
    # Keep this intentionally narrow: generated reader_value/context fields can
    # already be contaminated by workflow framing, so do not use them here.
    checked = " ".join(
        compact(source.get(key, ""))
        for key in ("title", "source_type", "topic_domain", "topic_reason")
    )
    return bool(SOURCE_NATIVE_RE.search(checked))


def usecase_native(source: dict[str, Any]) -> bool:
    checked = " ".join(
        compact(source.get(key, ""))
        for key in ("title", "source_type", "topic_domain", "topic_reason")
    )
    return bool(USECASE_SOURCE_NATIVE_RE.search(checked))


def add_issue(
    bucket: list[dict[str, Any]],
    code: str,
    message: str,
    surface: str,
    counts: dict[str, int],
    excerpt: str,
) -> None:
    bucket.append(
        {
            "code": code,
            "surface": surface,
            "terms": counts,
            "excerpt": excerpt[:320],
            "message": message,
        }
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    source = load_json(artifact_dir / "source.json")
    metadata = load_json(artifact_dir / "youtube" / "metadata.json")
    plan = load_json(artifact_dir / "plan_payload.json")

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {}

    native = source_native(source)
    use_native = usecase_native(source)
    parsed["source_native_validation_subject"] = native
    parsed["source_native_usecase_subject"] = use_native
    parsed["source_native_basis"] = {
        "title": source.get("title"),
        "source_type": source.get("source_type"),
        "topic_reason": source.get("topic_reason"),
    }

    title = compact(metadata.get("title", ""))
    description_opening = first_paragraphs(str(metadata.get("description", "")), 2)
    tags = metadata.get("tags") if isinstance(metadata.get("tags"), list) else []
    tag_text = " | ".join(str(t) for t in tags)
    slides = plan.get("slides") if isinstance(plan.get("slides"), list) else []
    narration = read_narration(plan, artifact_dir)

    opening_slides = " ".join(slide_text(s) for s in slides[:2] if isinstance(s, dict))
    slide_titles = " | ".join(
        compact(s.get("title", "")) for s in slides if isinstance(s, dict)
    )
    opening_narration = " ".join(narration[:2])
    ending_count = max(1, math.ceil(len(narration) * 0.2)) if narration else 0
    ending_narration = " ".join(narration[-ending_count:]) if ending_count else ""

    surfaces = {
        "title": title,
        "description_first_two_paragraphs": description_opening,
        "tags": tag_text,
        "cover_and_opening_slides": opening_slides,
        "slide_titles": slide_titles,
        "opening_narration": opening_narration,
        "ending_narration": ending_narration,
    }
    parsed["surface_counts"] = {name: count_terms(text) for name, text in surfaces.items()}
    parsed["surface_usecase_counts"] = {
        name: count_terms(text, USECASE_TERMS) for name, text in surfaces.items()
    }
    parsed["surface_role_counts"] = {
        name: count_terms(text, ROLE_TERMS) for name, text in surfaces.items()
    }
    parsed["narration_segment_count"] = len(narration)
    parsed["ending_narration_segment_count"] = ending_count

    if not metadata:
        errors.append(
            {
                "code": "missing_or_invalid_metadata_json",
                "message": "youtube/metadata.json is required for validation-lens drift check.",
            }
        )
    if not plan:
        errors.append(
            {
                "code": "missing_or_invalid_plan_payload",
                "message": "plan_payload.json is required for validation-lens drift check.",
            }
        )

    ai_acceptance_tag = any("AI 驗收" in str(tag) for tag in tags)
    if ai_acceptance_tag:
        add_issue(
            errors if not native else warnings,
            "ai_acceptance_tag",
            "`AI 驗收`-style tags make validation the public identity.",
            "tags",
            {"AI 驗收": 1},
            tag_text,
        )

    title_counts = count_terms(title)
    if title_counts and not native:
        add_issue(
            errors,
            "title_validation_lens",
            "Non-evaluation sources must not put validation/checklist/gate language in the title.",
            "title",
            title_counts,
            title,
        )

    desc_counts = count_terms(description_opening, DESCRIPTION_BLOCKING_TERMS)
    if desc_counts and not native:
        add_issue(
            errors,
            "description_opening_validation_lens",
            "Description opening promises validation/acceptance instead of source comprehension.",
            "description_first_two_paragraphs",
            desc_counts,
            description_opening,
        )

    opening_counts = count_terms(opening_slides + " " + opening_narration)
    if not native and (
        opening_counts.get("驗收", 0)
        or opening_counts.get("AI 驗收", 0)
        or opening_counts.get("上線驗收", 0)
        or total_count(opening_counts) >= 2
    ):
        add_issue(
            errors,
            "opening_validation_lens",
            "Opening/cover makes validation or launch-readiness the main frame.",
            "cover/opening",
            opening_counts,
            (opening_slides + " " + opening_narration),
        )

    ending_counts = count_terms(ending_narration)
    if not native and (
        ending_counts.get("驗收", 0)
        or ending_counts.get("驗收清單", 0)
        or ending_counts.get("驗收流程", 0)
        or ending_counts.get("可交付", 0)
        or ending_counts.get("可負責", 0)
        or total_count(ending_counts) >= 2
    ):
        add_issue(
            errors,
            "ending_validation_lens",
            "Final 20% of narration returns to validation/checklist identity.",
            "ending_narration",
            ending_counts,
            ending_narration,
        )

    all_public_text = " ".join(surfaces.values())
    all_counts = count_terms(all_public_text)
    parsed["total_public_surface_counts"] = all_counts
    if not native and all_counts.get("驗收", 0) and all_counts.get("驗收", 0) >= 3:
        add_issue(
            errors,
            "repeated_acceptance_language",
            "Repeated `驗收` language across public surfaces indicates validation-lens drift.",
            "all_public_surfaces",
            {"驗收": all_counts["驗收"]},
            all_public_text,
        )

    if native and total_count(all_counts) >= 8:
        add_issue(
            warnings,
            "high_validation_density_even_if_source_native",
            "Validation language is source-native, but density is high; keep it bounded.",
            "all_public_surfaces",
            all_counts,
            all_public_text,
        )

    role_counts_opening = count_terms(
        " ".join(
            [
                title,
                description_opening,
                opening_slides,
                opening_narration,
            ]
        ),
        ROLE_TERMS,
    )
    if role_counts_opening:
        add_issue(
            errors,
            "role_targeting_public_identity",
            "Public opening should introduce the source, not target role lists such as PM/business owner/teacher.",
            "title_description_opening",
            role_counts_opening,
            " ".join([title, description_opening, opening_slides, opening_narration]),
        )

    use_counts_front = count_terms(
        " ".join([title, description_opening, opening_slides, opening_narration]),
        USECASE_TERMS,
    )
    use_counts_all = count_terms(all_public_text, USECASE_TERMS)
    parsed["front_usecase_counts_total"] = total_count(use_counts_front)
    parsed["all_usecase_counts_total"] = total_count(use_counts_all)
    if not use_native and (total_count(use_counts_front) >= 2 or total_count(use_counts_all) >= 4):
        add_issue(
            errors,
            "generic_usecase_packaging_drift",
            "Non-use-case sources should not be reframed as導入/採用/workflow/decision-framework content.",
            "public_surfaces",
            use_counts_all or use_counts_front,
            all_public_text,
        )
    elif use_native and total_count(use_counts_all) >= 8:
        add_issue(
            warnings,
            "high_usecase_density_even_if_source_native",
            "Use-case language is source-native, but density is high; keep source explanation first.",
            "all_public_surfaces",
            use_counts_all,
            all_public_text,
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
