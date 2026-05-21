#!/usr/bin/env python3
"""Validate title/description top-preview packaging in youtube/metadata.json."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


DATE_PREFIX_RE = re.compile(r"^\d{4}-\d{2}-\d{2}[｜|-]")
URL_RE = re.compile(r"^https?://", re.IGNORECASE)
SOURCE_UNDERSTANDING_CUE_RE = re.compile(
    r"("
    r"這(?:篇|集|份|支|個)|本(?:篇|集)|原文|原始來源|來源|訪談|Podcast|paper|論文|release(?: note)?|repo|"
    r"讀懂|理解|看懂|聽懂|跟上|整理|介紹|在(?:說|聊|談|整理|介紹)|改了|發現|提出|測試|比較|指出|"
    r"article|interview|episode|paper|release|repo|source"
    r")",
    re.IGNORECASE,
)
INTERNAL_PAYOFF_START_RE = re.compile(
    r"^(看完後|觀眾可以|你可以|after watching|you can)",
    re.IGNORECASE,
)
ROLE_TARGETING_RE = re.compile(
    r"((?<![A-Za-z])PMs?(?![A-Za-z])|產品經理|企業主|老師|教師|各行各業|想成為工程師|現役工程師|工程師觀眾|"
    r"AI\s*(?:軟體)?(?:參與者|使用者)|用\s*AI.*(?:開發|做軟體|寫程式|參與軟體)|"
    r"product managers?|business owners?|teachers?|aspiring engineers?|engineers?)",
    re.IGNORECASE,
)
USE_CASE_PACKAGING_RE = re.compile(
    r"(導入|採用|驗收|上線|放行|工作流|workflow|risk check|風險檢查|決策框架|判斷框架|"
    r"可交付|可負責|acceptance|validation|checklist|gate)",
    re.IGNORECASE,
)

TITLE_WARN_LEN = 52
TITLE_HARD_LIMIT = 100
FIRST_LINE_WARN_MIN = 40
FIRST_LINE_WARN_MAX = 90


def _first_non_empty_line(text: str) -> tuple[str, int]:
    for idx, raw in enumerate(text.splitlines(), start=1):
        line = raw.strip()
        if line:
            return line, idx
    return "", 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Validate YouTube metadata title/description packaging: "
            "title truncation risk + top-preview source-understanding placement."
        )
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    metadata_path = artifact_dir / "youtube" / "metadata.json"
    source_path = artifact_dir / "source.json"

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {}

    result: dict[str, Any] = {
        "artifact_dir": str(artifact_dir),
        "metadata_path": str(metadata_path),
        "status": "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": parsed,
    }

    topic_domain = ""
    if source_path.exists():
        try:
            source_payload = json.loads(source_path.read_text(encoding="utf-8"))
            if isinstance(source_payload, dict):
                topic_domain_raw = source_payload.get("topic_domain")
                if not isinstance(topic_domain_raw, str):
                    topic_domain_raw = source_payload.get("topicDomain")
                if isinstance(topic_domain_raw, str):
                    topic_domain = topic_domain_raw.strip()
        except Exception as exc:  # pragma: no cover - defensive
            warnings.append(
                {
                    "code": "source_json_parse_failed",
                    "message": f"Cannot parse source.json for topic_domain: {exc}",
                }
            )
    parsed["topic_domain"] = topic_domain or "unknown"

    if not metadata_path.exists():
        errors.append(
            {
                "code": "missing_metadata_json",
                "message": "youtube/metadata.json is required.",
            }
        )
    else:
        try:
            payload = json.loads(metadata_path.read_text(encoding="utf-8"))
        except Exception as exc:  # pragma: no cover - defensive
            errors.append(
                {
                    "code": "invalid_metadata_json",
                    "message": f"Cannot parse metadata JSON: {exc}",
                }
            )
            payload = {}

        title = payload.get("title")
        description = payload.get("description")

        if not isinstance(title, str) or not title.strip():
            errors.append(
                {
                    "code": "missing_title",
                    "message": "metadata.title must be a non-empty string.",
                }
            )
            title = ""
        else:
            title = title.strip()

        if not isinstance(description, str) or not description.strip():
            errors.append(
                {
                    "code": "missing_description",
                    "message": "metadata.description must be a non-empty string.",
                }
            )
            description = ""

        if title:
            title_len = len(title)
            parsed["title_len"] = title_len
            parsed["title"] = title
            parsed["date_prefix"] = bool(DATE_PREFIX_RE.match(title))

            if title_len > TITLE_HARD_LIMIT:
                errors.append(
                    {
                        "code": "title_over_platform_limit",
                        "value": title_len,
                        "message": "Title exceeds 100-character YouTube limit.",
                    }
                )
            elif title_len > TITLE_WARN_LEN:
                warnings.append(
                    {
                        "code": "title_truncation_risk",
                        "value": title_len,
                        "message": "Title length > 52 can hide key meaning on mobile surfaces.",
                    }
                )

            if parsed["date_prefix"]:
                warnings.append(
                    {
                        "code": "title_date_prefix",
                        "message": "Title starts with date prefix; put key promise first.",
                    }
                )

        if description:
            if "文章來源：https://" in description:
                errors.append(
                    {
                        "code": "source_label_same_line_raw_url",
                        "message": "Do not place `文章來源：https://...` on a single line.",
                    }
                )

            first_line, first_line_number = _first_non_empty_line(description)
            if not first_line:
                errors.append(
                    {
                        "code": "missing_first_non_empty_line",
                        "message": "Description needs a non-empty first visible line before source block.",
                    }
                )
            else:
                parsed["first_non_empty"] = first_line
                parsed["first_non_empty_line_number"] = first_line_number
                parsed["first_non_empty_len"] = len(first_line)

                if first_line.startswith("文章來源："):
                    errors.append(
                        {
                            "code": "source_first_top_preview",
                            "message": "Top preview cannot begin with `文章來源：`; put a short source-understanding sentence first.",
                        }
                    )

                if URL_RE.match(first_line):
                    errors.append(
                        {
                            "code": "url_first_top_preview",
                            "message": "Top preview cannot begin with a URL; put a short source-understanding sentence first.",
                        }
                    )

                first_len = len(first_line)
                if first_len < FIRST_LINE_WARN_MIN:
                    warnings.append(
                        {
                            "code": "first_line_too_short",
                            "value": first_len,
                            "message": "Top line may be too short to identify the source and explain what becomes easier to understand.",
                        }
                    )
                elif first_len > FIRST_LINE_WARN_MAX:
                    warnings.append(
                        {
                            "code": "first_line_too_long",
                            "value": first_len,
                            "message": (
                                "Top source-understanding line may be too long for mobile preview readability "
                                "(recommended <= 90 chars)."
                            ),
                        }
                    )

                has_source_understanding_cue = bool(SOURCE_UNDERSTANDING_CUE_RE.search(first_line))
                parsed["first_line_source_understanding_cue"] = has_source_understanding_cue
                if not has_source_understanding_cue:
                    warnings.append(
                        {
                            "code": "first_line_missing_source_understanding_cue",
                            "message": (
                                "First visible line should introduce the source object or what "
                                "becomes easier to understand (for example, `這集訪談在聊...`)."
                            ),
                        }
                    )

                starts_with_internal_payoff = bool(INTERNAL_PAYOFF_START_RE.search(first_line))
                parsed["first_line_starts_with_internal_payoff"] = starts_with_internal_payoff
                if starts_with_internal_payoff:
                    warnings.append(
                        {
                            "code": "first_line_starts_with_internal_payoff",
                            "message": (
                                "Public first line should usually start from the source object "
                                "(`這篇...`, `這集訪談...`) instead of internal `看完後...` payoff wording."
                            ),
                        }
                    )

                if ROLE_TARGETING_RE.search(first_line):
                    errors.append(
                        {
                            "code": "role_targeted_first_line",
                            "message": (
                                "Public first line must not target role lists such as PM, "
                                "business owners, teachers, or AI-software participants. "
                                "Start from the source itself."
                            ),
                        }
                    )

                if USE_CASE_PACKAGING_RE.search(first_line):
                    warnings.append(
                        {
                            "code": "use_case_first_line_drift",
                            "message": (
                                "First line looks like use-case/adoption/validation packaging. "
                                "Use this only when the original source itself is framed that way."
                            ),
                        }
                    )

            if "文章來源：" not in description:
                errors.append(
                    {
                        "code": "missing_source_block_label",
                        "message": "Description must include a single `文章來源：` block.",
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
