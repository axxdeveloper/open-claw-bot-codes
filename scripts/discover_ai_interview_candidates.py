#!/usr/bin/env python3
"""Discover high-signal AI interview candidates beyond the fixed source registry."""

from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path
import re
import sys
import urllib.parse

import source_pool_watch as watcher


WORKSPACE = Path(__file__).resolve().parents[1]
DEFAULT_REPORT_DIR = WORKSPACE / "reports/source-discovery"
TAIPEI = dt.timezone(dt.timedelta(hours=8))

DEFAULT_QUERIES = [
    "AI founder mode interview",
    "AI era CEO interview consumer AI",
    "consumer AI founder interview",
    "AI product strategy founder interview",
    "AI product design CEO interview",
    "AI agents product founder interview",
    "AI infrastructure interview tokens inference GPU",
    "coding agents interview software engineering",
    "frontier AI interview AGI",
    "AI for science interview",
]

DISCOVERY_SOURCE = {
    "id": "youtube-ai-interview-discovery",
    "name": "YouTube AI Interview Discovery",
    "category": "AI",
    "tier": 2,
    "type": "ai_video_interview",
    "url": "https://www.youtube.com/results",
    "fetch_mode": "youtube_channel",
    "weight": 1.15,
    "tags": ["ai_interviews", "source_discovery", "product_strategy", "operators"],
    "exclude_url_substrings": ["/shorts/"],
    "exclude_title_patterns": ["shorts?"],
}

DERIVATIVE_TITLE_PATTERNS = [
    r"\bclips?\b",
    r"\bhighlights?\b",
    r"\breaction\b",
    r"\bsummary\b",
    r"\bexplained\b",
    r"\brecap\b",
    r"解讀",
    r"总结",
    r"精華",
    r"剪輯",
]


def has_cjk(text: str) -> bool:
    return bool(re.search(r"[\u3400-\u9fff]", text))


def duration_seconds(summary: str) -> int | None:
    # YouTube search metadata often looks like:
    # "7 天前 1:23:28 觀看次數：63,696次" or "4 days ago 35:16 6K views".
    matches = re.findall(r"(?<!\d)(\d{1,2}:)?(\d{1,2}):(\d{2})(?!\d)", summary)
    if not matches:
        return None
    hours, minutes, seconds = matches[0]
    return (int(hours[:-1]) * 3600 if hours else 0) + int(minutes) * 60 + int(seconds)


def likely_derivative(item: dict) -> bool:
    title = str(item.get("title", ""))
    if has_cjk(title):
        return True
    return any(re.search(pattern, title, re.I) for pattern in DERIVATIVE_TITLE_PATTERNS)


def youtube_search_url(query: str) -> str:
    return "https://www.youtube.com/results?search_query=" + urllib.parse.quote_plus(query)


def discover_query(query: str, max_results: int, timeout: int) -> list[dict]:
    source = {**DISCOVERY_SOURCE, "fetch_url": youtube_search_url(query)}
    text, final_url, content_type = watcher.fetch_text(source["fetch_url"], timeout=timeout)
    items = watcher.parse_items(text, content_type, source)
    now = dt.datetime.now(dt.timezone.utc)
    candidates: list[dict] = []
    for item in items[:max_results]:
        if likely_derivative(item):
            continue
        duration = duration_seconds(str(item.get("summary", "")))
        if duration is not None and duration < 8 * 60:
            continue
        score = watcher.score_candidate(source, item, seen_before=False, now_utc=now)
        decision = watcher.format_decision(score)
        if decision == "reject":
            continue
        candidates.append(
            {
                "query": query,
                "search_url": final_url,
                "source": {
                    "id": source["id"],
                    "name": source["name"],
                    "category": source["category"],
                    "tier": source["tier"],
                    "type": source["type"],
                    "url": source["url"],
                    "weight": source["weight"],
                },
                "item": {**item, "duration_seconds": duration},
                "dedupe_key": watcher.candidate_key(str(item.get("url", "")), str(item.get("title", ""))),
                "candidate_score": score,
                "format_decision": decision,
                "decision_reason": watcher.decision_reason(source, item, score),
            }
        )
    return candidates


def main() -> int:
    parser = argparse.ArgumentParser(description="Discover AI interview candidates from broad YouTube search.")
    parser.add_argument("--report-dir", type=Path, default=DEFAULT_REPORT_DIR)
    parser.add_argument("--date", default=dt.datetime.now(TAIPEI).date().isoformat())
    parser.add_argument("--query", action="append", dest="queries", default=[])
    parser.add_argument("--max-results-per-query", type=int, default=8)
    parser.add_argument("--fetch-timeout", type=int, default=20)
    parser.add_argument("--replace", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    queries = args.queries or DEFAULT_QUERIES
    observed_at = dt.datetime.now(dt.timezone.utc).isoformat()
    all_candidates: list[dict] = []
    errors: list[dict] = []
    seen: set[str] = set()

    for query in queries:
        try:
            for candidate in discover_query(query, args.max_results_per_query, args.fetch_timeout):
                key = candidate["dedupe_key"]
                if key in seen:
                    continue
                seen.add(key)
                candidate["observed_at"] = observed_at
                all_candidates.append(candidate)
        except Exception as exc:
            errors.append({"query": query, "error": f"{type(exc).__name__}: {exc}"})

    all_candidates.sort(
        key=lambda obj: (
            obj["candidate_score"]["ranking_score"],
            obj["candidate_score"]["total"],
            obj["item"].get("duration_seconds") or 0,
        ),
        reverse=True,
    )

    output_path = args.report_dir / f"{args.date}.jsonl"
    if not args.dry_run:
        args.report_dir.mkdir(parents=True, exist_ok=True)
        if args.replace and output_path.exists():
            output_path.unlink()
        with output_path.open("a", encoding="utf-8") as fh:
            for candidate in all_candidates:
                fh.write(json.dumps(candidate, ensure_ascii=False, sort_keys=True) + "\n")

    print(
        json.dumps(
            {
                "status": "ok" if not errors else "partial",
                "dry_run": args.dry_run,
                "queries": len(queries),
                "candidates": len(all_candidates),
                "errors": errors,
                "output": str(output_path),
                "top": [
                    {
                        "score": candidate["candidate_score"]["ranking_score"],
                        "title": candidate["item"]["title"],
                        "url": candidate["item"]["url"],
                        "query": candidate["query"],
                        "format": candidate["format_decision"],
                        "ai_product_operator": candidate["candidate_score"].get("ai_product_operator_signal", False),
                        "ai_interview_importance": candidate["candidate_score"].get("ai_interview_importance_signal", False),
                    }
                    for candidate in all_candidates[:8]
                ],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0 if not errors or all_candidates else 2


if __name__ == "__main__":
    sys.exit(main())
