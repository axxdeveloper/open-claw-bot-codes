#!/usr/bin/env python3
"""Check routine YouTube Community source-intro drafts against 小舟's allowed scope."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


TECHNICAL_SCOPE_RE = re.compile(
    r"(?<![a-z0-9])(?:ai|agent|api|architecture|backend|benchmark|cache|cassandra|"
    r"cloud|coding|database|debug|developer|devtools|distributed|eval|framework|"
    r"infra|infrastructure|java|jvm|kafka|kubernetes|latency|llm|model|openai|"
    r"anthropic|deepmind|observability|operator|performance|postgres|production|"
    r"release|reliability|repo|research|runtime|security|software|streaming|"
    r"system|tooling|tracing)(?![a-z0-9])|"
    r"技術|工程|後端|軟體|架構|資料庫|分散式|系統|維運|可靠性|觀測|安全|"
    r"效能|部署|工具|模型|研究|論文|發布|更新|程式|開發",
    re.IGNORECASE,
)

TECHNICAL_TOPIC_SUBDOMAIN_RE = re.compile(
    r"^(?:ai|backend|software|engineering|operator|infra|sre|security|devtools|"
    r"runtime|streaming|messaging|database|databases|data|jvm|java|kafka|"
    r"cassandra|distributed|architecture|observability|performance|api|"
    r"tooling|coding_agent)(?:[_-][a-z0-9]+)*$",
    re.IGNORECASE,
)

TECHNICAL_SOURCE_TYPE_RE = re.compile(
    r"^(?:ai(?:_[a-z0-9]+)*|backend(?:_[a-z0-9]+)*|engineering(?:_[a-z0-9]+)*|"
    r"technical(?:_[a-z0-9]+)*|research(?:_[a-z0-9]+)*|paper(?:_[a-z0-9]+)*|"
    r"arxiv(?:_[a-z0-9]+)*|conference(?:_[a-z0-9]+)*|release(?:_[a-z0-9]+)*|"
    r"official_(?:engineering_blog|release_note|project_post|research_blog)|"
    r"project_blog|developer_blog|security_blog|repo|docs|documentation|changelog)$",
    re.IGNORECASE,
)

TECHNICAL_CATEGORY_RE = re.compile(
    r"^(?:AI|Backend|Technical|Engineering)$",
    re.IGNORECASE,
)

INTERNAL_OR_DERIVATIVE_SOURCE_RE = re.compile(
    r"(isaac\s*note|shooeugenesea\.github\.io/(?:pull|issues?)/|"
    r"github\.com/axxdeveloper/shooeugenesea\.github\.io/(?:pull|issues?)/|"
    r"\breports/article-video-publisher\b|\bMEMORY\.md\b|\bAGENTS\.md\b)",
    re.IGNORECASE,
)


def load_json(path: Path | None) -> dict[str, Any]:
    if not path:
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return {"_load_error": str(exc), "_path": str(path)}


def flatten_strings(value: Any, *, include_keys: bool = True) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, (int, float, bool)):
        return [str(value)]
    if isinstance(value, list):
        out: list[str] = []
        for item in value:
            out.extend(flatten_strings(item, include_keys=include_keys))
        return out
    if isinstance(value, dict):
        out = []
        for key, item in value.items():
            if include_keys:
                out.append(str(key))
            out.extend(flatten_strings(item, include_keys=include_keys))
        return out
    return [str(value)]


def main() -> int:
    parser = argparse.ArgumentParser(description="Check whether a routine YouTube Community source-intro is in scope.")
    parser.add_argument("draft", type=Path)
    parser.add_argument("--source-json", type=Path)
    parser.add_argument("--source-url", default="")
    parser.add_argument("--title", default="")
    parser.add_argument("--posted-ledger", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    draft_text = args.draft.read_text(encoding="utf-8", errors="replace") if args.draft.exists() else ""
    source = load_json(args.source_json)
    source_url = args.source_url or str(source.get("url") or source.get("source_url") or "")
    title = args.title or str(source.get("title") or "")
    source_name = str(source.get("source_name") or source.get("name") or "")
    source_type = str(source.get("source_type") or source.get("type") or "")
    topic_domain = str(source.get("topic_domain") or "")
    topic_subdomain = str(source.get("topic_subdomain") or source.get("subdomain") or "")
    source_id = str(source.get("source_id") or source.get("id") or "")
    category = str(source.get("category") or source.get("source_category") or "")

    source_text = " ".join(flatten_strings(source, include_keys=False))

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []

    internal_or_derivative_source = bool(
        INTERNAL_OR_DERIVATIVE_SOURCE_RE.search(
            " ".join([source_url, source_name, source_type, topic_domain, topic_subdomain, source_id, source_text])
        )
    )
    source_scope_text = " ".join([source_type, topic_domain, topic_subdomain, source_id, source_url, title, source_name, category, source_text])
    canonical_technical_domain = topic_domain.strip().lower() == "technical"
    legacy_detail_as_domain = bool(TECHNICAL_TOPIC_SUBDOMAIN_RE.fullmatch(topic_domain.strip())) and not canonical_technical_domain
    explicit_technical_subdomain = bool(TECHNICAL_TOPIC_SUBDOMAIN_RE.fullmatch(topic_subdomain.strip()))
    explicit_technical_type = bool(TECHNICAL_SOURCE_TYPE_RE.fullmatch(source_type.strip()))
    explicit_technical_category = bool(TECHNICAL_CATEGORY_RE.search(category))
    source_metadata_technical_signal = bool(TECHNICAL_SCOPE_RE.search(source_scope_text))
    source_side_technical_signal = bool(
        explicit_technical_subdomain
        or explicit_technical_type
        or explicit_technical_category
        or source_metadata_technical_signal
    )
    in_technical_scope = canonical_technical_domain and source_side_technical_signal

    if internal_or_derivative_source:
        errors.append(
            {
                "code": "routine_source_intro_internal_or_derivative_source",
                "message": "Routine YouTube Community source-intro must use the original public source as the main link, not Isaac Note, local reports, memory/instruction files, or internal derivative PRs.",
                "source_url": source_url,
                "source_name": source_name,
            }
        )

    if legacy_detail_as_domain:
        warnings.append(
            {
                "code": "topic_domain_detail_should_move_to_topic_subdomain",
                "message": "Use source.json.topic_domain='technical' and put backend/AI/database/etc. in topic_subdomain.",
                "topic_domain": topic_domain,
            }
        )

    if not canonical_technical_domain:
        errors.append(
            {
                "code": "source_topic_domain_not_technical",
                "message": "Routine 小舟 source-intro only accepts source.json.topic_domain='technical'. Put finer labels in topic_subdomain.",
                "topic_domain": topic_domain,
            }
        )
    elif not source_side_technical_signal:
        errors.append(
            {
                "code": "source_metadata_not_technical_enough",
                "message": "Routine 小舟 source-intro requires technical source-side metadata, not only technical-looking draft wording.",
                "source_type": source_type,
                "category": category,
                "topic_subdomain": topic_subdomain,
            }
        )

    if not args.source_json:
        errors.append(
            {
                "code": "source_json_not_provided",
                "message": "Routine YouTube Community source-intro scope checks require --source-json so the gate can inspect source-side metadata instead of trusting draft wording.",
            }
        )
    elif source.get("_load_error"):
        errors.append(
            {
                "code": "source_json_load_failed",
                "path": source.get("_path"),
                "message": source.get("_load_error"),
            }
        )

    result = {
        "status": "FAIL" if errors else "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": {
            "source_url": source_url,
            "title": title,
            "source_name": source_name,
            "source_type": source_type,
            "topic_domain": topic_domain,
            "topic_subdomain": topic_subdomain,
            "source_id": source_id,
            "category": category,
            "internal_or_derivative_source": internal_or_derivative_source,
            "in_technical_scope": in_technical_scope,
            "canonical_technical_domain": canonical_technical_domain,
            "legacy_detail_as_domain": legacy_detail_as_domain,
            "explicit_technical_subdomain": explicit_technical_subdomain,
            "explicit_technical_type": explicit_technical_type,
            "explicit_technical_category": explicit_technical_category,
            "source_metadata_technical_signal": source_metadata_technical_signal,
            "source_side_technical_signal": source_side_technical_signal,
        },
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
