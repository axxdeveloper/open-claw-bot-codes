#!/usr/bin/env python3
"""Block out-of-scope routine Threads source-intro drafts."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


BLOCKED_TOPIC_RE = re.compile(
    r"("
    r"\b(?:investment|economy|economic|macro|macroeconomic|finance|financial|"
    r"market|gdp|inflation|rates?|etf|stock(?:-market)?|treasury|fed|federal reserve|"
    r"bea|bureau of economic analysis|fred|cpi|pce)\b|"
    r"投資|經濟|總體|宏觀|財經|金融|市場|GDP|國內生產毛額|利率|通膨|通脹|"
    r"ETF|股票|股市|美債|央行|聯準會|BEA|"
    r"politics|political|public[- ]issue|election|campaign|party politics|"
    r"政治|公共議題|公眾議題|選舉|政黨|立法院"
    r")",
    re.IGNORECASE,
)

BLOCKED_SOURCE_TYPE_RE = re.compile(
    r"(official_stat_release|macro|market|finance|investment|economy|politic|public_issue)",
    re.IGNORECASE,
)

STYLE_SOURCE_RE = re.compile(
    r"(lifestyle_style|fashion|style|styling|taste|clothing|wardrobe|garment|outfit|"
    r"lifestyle|sustainability|穿搭|服裝|衣服|衣櫃|單品|搭配|造型|品味)",
    re.IGNORECASE,
)

PRACTICAL_STYLE_RE = re.compile(
    r"(fit|proportion|silhouette|color|layering|shoes?|accessor(?:y|ies)|occasion|"
    r"office|commute|travel|outfit formula|how to wear|pair(?:ing)?|wardrobe formula|"
    r"版型|比例|輪廓|配色|層次|鞋|配件|場合|辦公室|通勤|旅行|穿搭公式|"
    r"搭配|怎麼穿|怎麼配|一衣多穿|外套|褲|裙|襯衫|毛衣|鞋款)",
    re.IGNORECASE,
)

SERIOUS_STYLE_CONTEXT_RE = re.compile(
    r"(history|colonial|slavery|enslaved|labor|labour|supply chain|sustainability|"
    r"ethics|ethical|cotton history|殖民|奴役|奴隸|勞動|供應鏈|永續|倫理|歷史)",
    re.IGNORECASE,
)


def load_json(path: Path | None) -> dict[str, Any]:
    if not path:
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return {"_load_error": str(exc), "_path": str(path)}


def flatten_strings(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, (int, float, bool)):
        return [str(value)]
    if isinstance(value, list):
        out: list[str] = []
        for item in value:
            out.extend(flatten_strings(item))
        return out
    if isinstance(value, dict):
        out = []
        for key, item in value.items():
            out.append(str(key))
            out.extend(flatten_strings(item))
        return out
    return [str(value)]


def style_signal(text: str) -> bool:
    return bool(STYLE_SOURCE_RE.search(text))


def ledger_recent_style_count(path: Path | None, source_url: str) -> int:
    if not path or not path.exists():
        return 0
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except Exception:
            continue
    count = 0
    for row in rows[-10:]:
        row_source_url = str(row.get("source_url") or "")
        if source_url and row_source_url == source_url:
            continue
        combined = " ".join(flatten_strings(row))
        if style_signal(combined):
            count += 1
    return count


def main() -> int:
    parser = argparse.ArgumentParser(description="Check whether a routine Threads source-intro is in scope.")
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
    source_type = str(source.get("source_type") or source.get("type") or "")
    topic_domain = str(source.get("topic_domain") or "")
    source_id = str(source.get("source_id") or source.get("id") or "")

    source_text = " ".join(flatten_strings(source))
    combined = " ".join([draft_text, source_text, source_url, title, source_type, topic_domain, source_id])

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []

    blocked_source_type = bool(BLOCKED_SOURCE_TYPE_RE.search(" ".join([source_type, topic_domain, source_id, source_text])))
    blocked_topic = bool(BLOCKED_TOPIC_RE.search(combined))
    is_style = topic_domain == "lifestyle_style" or style_signal(" ".join([source_type, topic_domain, source_id, source_url, title, source_text]))
    practical_style_hits = PRACTICAL_STYLE_RE.findall(draft_text)
    serious_style_context = bool(SERIOUS_STYLE_CONTEXT_RE.search(combined))
    recent_style_count = ledger_recent_style_count(args.posted_ledger, source_url)

    if blocked_source_type or blocked_topic:
        errors.append(
            {
                "code": "routine_scope_blocked_macro_finance_politics",
                "message": "Routine 小舟 Threads source-intro must not publish economy, macro, market, finance, investment, GDP, stock-market, politics, or public-issue sources.",
                "blocked_source_type": blocked_source_type,
                "blocked_topic_signal": blocked_topic,
            }
        )

    if is_style:
        if len(practical_style_hits) < 2:
            errors.append(
                {
                    "code": "styling_not_practical_enough",
                    "message": "Routine styling posts must teach direct practical outfit/styling value such as fit, proportion, silhouette, color, layering, shoes/accessories, occasion, or outfit formula.",
                    "practical_style_hit_count": len(practical_style_hits),
                }
            )
        if serious_style_context and len(practical_style_hits) < 3:
            errors.append(
                {
                    "code": "styling_serious_context_without_clear_outfit_value",
                    "message": "Fashion history, colonial/ethical/labor/supply-chain, or sustainability sources are not routine unless the public draft has clear direct outfit/styling guidance.",
                    "practical_style_hit_count": len(practical_style_hits),
                }
            )
        if recent_style_count > 0:
            errors.append(
                {
                    "code": "styling_frequency_exceeded",
                    "message": "Practical styling is a small side lane. Do not publish a styling source-intro when another styling-like source appears in the latest 10 source-intro ledger entries.",
                    "recent_style_count_latest_10": recent_style_count,
                }
            )

    if not args.source_json:
        warnings.append(
            {
                "code": "source_json_not_provided",
                "message": "Pass --source-json when the source comes from an artifact so the scope gate can inspect topic_domain/source_type/internal context.",
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
            "source_type": source_type,
            "topic_domain": topic_domain,
            "source_id": source_id,
            "is_style": is_style,
            "blocked_source_type": blocked_source_type,
            "blocked_topic_signal": blocked_topic,
            "practical_style_hit_count": len(practical_style_hits),
            "serious_style_context": serious_style_context,
            "recent_style_count_latest_10": recent_style_count,
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
