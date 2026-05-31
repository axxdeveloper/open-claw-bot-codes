#!/usr/bin/env python3
"""Build a weekly technical-topic radar from source-watch reports."""

from __future__ import annotations

import argparse
import datetime as dt
import json
from collections import Counter
from pathlib import Path
from typing import Any

try:
    import yaml
except Exception:  # pragma: no cover - runtime fallback
    yaml = None


WORKSPACE = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_WATCH_DIR = WORKSPACE / "reports" / "source-watch"
DEFAULT_ARTIFACT_ROOT = WORKSPACE / "reports" / "article-video-publisher"
DEFAULT_REGISTRY = WORKSPACE / "skills" / "article-video-publisher" / "SOURCE_REGISTRY.yml"
DEFAULT_OUTPUT_DIR = WORKSPACE / "reports" / "weekly-tech-radar"


def parse_date(value: str | None) -> dt.date:
    if value:
        return dt.date.fromisoformat(value)
    return dt.datetime.now(dt.timezone(dt.timedelta(hours=8))).date()


def date_range(end: dt.date, days: int) -> list[dt.date]:
    start = end - dt.timedelta(days=max(1, days) - 1)
    return [start + dt.timedelta(days=offset) for offset in range((end - start).days + 1)]


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if not line.strip():
            continue
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict):
            rows.append(data)
    return rows


def load_registry(path: Path) -> dict[str, dict[str, Any]]:
    if yaml is None or not path.exists():
        return {}
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8", errors="replace"))
    except Exception:
        return {}
    sources = data.get("sources") if isinstance(data, dict) else None
    if not isinstance(sources, list):
        return {}
    registry: dict[str, dict[str, Any]] = {}
    for source in sources:
        if isinstance(source, dict) and source.get("id"):
            registry[str(source["id"])] = source
    return registry


def candidate_key(candidate: dict[str, Any]) -> str:
    item = candidate.get("item") if isinstance(candidate.get("item"), dict) else {}
    return str(candidate.get("dedupe_key") or item.get("url") or item.get("title") or id(candidate))


def score(candidate: dict[str, Any], key: str, default: float = 0.0) -> float:
    score_data = candidate.get("candidate_score")
    if not isinstance(score_data, dict):
        return default
    value = score_data.get(key, default)
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def sort_candidates(candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(
        candidates,
        key=lambda row: (
            score(row, "ranking_score"),
            score(row, "total"),
            bool(row.get("candidate_score", {}).get("ai_priority")) if isinstance(row.get("candidate_score"), dict) else False,
            str(row.get("observed_at", "")),
        ),
        reverse=True,
    )


def dedupe(candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    best: dict[str, dict[str, Any]] = {}
    for candidate in candidates:
        key = candidate_key(candidate)
        previous = best.get(key)
        if previous is None or score(candidate, "ranking_score") > score(previous, "ranking_score"):
            best[key] = candidate
    return sort_candidates(list(best.values()))


def source_id(candidate: dict[str, Any]) -> str:
    source = candidate.get("source")
    return str(source.get("id") or source.get("name") or "unknown") if isinstance(source, dict) else "unknown"


def category(candidate: dict[str, Any]) -> str:
    source = candidate.get("source")
    return str(source.get("category") or "Uncategorized") if isinstance(source, dict) else "Uncategorized"


def top_diverse(candidates: list[dict[str, Any]], limit: int, max_per_source: int = 2) -> list[dict[str, Any]]:
    counts: Counter[str] = Counter()
    picked: list[dict[str, Any]] = []
    for candidate in candidates:
        sid = source_id(candidate)
        if counts[sid] >= max_per_source:
            continue
        picked.append(candidate)
        counts[sid] += 1
        if len(picked) >= limit:
            break
    return picked


def short_title(candidate: dict[str, Any]) -> str:
    item = candidate.get("item")
    return str(item.get("title") or "(untitled)") if isinstance(item, dict) else "(untitled)"


def candidate_url(candidate: dict[str, Any]) -> str:
    item = candidate.get("item")
    return str(item.get("url") or "") if isinstance(item, dict) else ""


def source_name(candidate: dict[str, Any]) -> str:
    source = candidate.get("source")
    return str(source.get("name") or source.get("id") or "unknown") if isinstance(source, dict) else "unknown"


def decision(candidate: dict[str, Any]) -> str:
    return str(candidate.get("decision_reason") or "").strip()


def format_candidate(candidate: dict[str, Any], rank: int) -> dict[str, Any]:
    score_data = candidate.get("candidate_score") if isinstance(candidate.get("candidate_score"), dict) else {}
    return {
        "rank": rank,
        "title": short_title(candidate),
        "url": candidate_url(candidate),
        "source": source_name(candidate),
        "source_id": source_id(candidate),
        "category": category(candidate),
        "format_decision": candidate.get("format_decision"),
        "score": score_data.get("ranking_score"),
        "raw_score": score_data.get("total"),
        "ai_priority": bool(score_data.get("ai_priority")),
        "source_diversity_note": score_data.get("source_diversity_note", ""),
        "decision_reason": decision(candidate),
    }


def published_sources(root: Path, dates: list[dt.date]) -> list[dict[str, Any]]:
    wanted = {day.isoformat() for day in dates}
    rows: list[dict[str, Any]] = []
    if not root.exists():
        return rows
    for source_path in sorted(root.glob("*/*/source.json")):
        try:
            report_date = source_path.parts[-3]
        except IndexError:
            continue
        if report_date not in wanted:
            continue
        data = load_json(source_path)
        rows.append(
            {
                "date": report_date,
                "artifact": str(source_path.parent.relative_to(WORKSPACE)),
                "title": data.get("title") or data.get("topic") or source_path.parent.name,
                "source_url": data.get("source_url") or data.get("url"),
                "source_name": data.get("source_name") or data.get("source"),
                "topic_domain": data.get("topic_domain"),
                "topic_subdomain": data.get("topic_subdomain") or data.get("subdomain"),
            }
        )
    return rows


def registry_gaps(registry: dict[str, dict[str, Any]], candidates: list[dict[str, Any]]) -> dict[str, Any]:
    enabled = {
        sid: source
        for sid, source in registry.items()
        if source.get("enabled", True) is not False
    }
    seen_sources = {source_id(candidate) for candidate in candidates}
    category_counts: Counter[str] = Counter()
    for source in enabled.values():
        category_counts[str(source.get("category") or "Uncategorized")] += 1

    seen_categories = {category(candidate) for candidate in candidates}
    return {
        "enabled_source_count": len(enabled),
        "enabled_categories": dict(sorted(category_counts.items())),
        "categories_without_accepted_candidates": sorted(set(category_counts) - seen_categories),
        "enabled_sources_without_accepted_candidates_sample": [
            {
                "id": sid,
                "name": str(source.get("name") or sid),
                "category": str(source.get("category") or "Uncategorized"),
            }
            for sid, source in sorted(enabled.items())
            if sid not in seen_sources
        ][:30],
    }


def source_health_gaps(source_watch_dir: Path) -> dict[str, Any]:
    health = load_json(source_watch_dir / "source-health.json")
    sources = health.get("sources") if isinstance(health.get("sources"), dict) else {}
    errors = []
    zero_candidates = []
    for sid, item in sorted(sources.items()):
        if not isinstance(item, dict):
            continue
        if item.get("status") not in {None, "ok"} or item.get("error"):
            errors.append(
                {
                    "id": sid,
                    "status": item.get("status"),
                    "error": item.get("error"),
                    "fetch_url": item.get("fetch_url"),
                }
            )
        if item.get("candidate_count") == 0:
            zero_candidates.append(sid)
    return {
        "generated_at": health.get("generated_at"),
        "source_error_count": len(errors),
        "source_errors": errors[:20],
        "latest_zero_candidate_source_count": len(zero_candidates),
        "latest_zero_candidate_sources_sample": zero_candidates[:30],
    }


def build_markdown(report: dict[str, Any]) -> str:
    lines: list[str] = []
    lines.append(f"# Weekly Tech Radar: {report['date_range']['start']} to {report['date_range']['end']}")
    lines.append("")
    lines.append("Status: draft")
    lines.append("")
    lines.append("這份雷達不是單題選片結果，而是把本週 source-watch 掃到的技術訊號、入選理由、未選理由、以及掃描盲點整理成可做影片或 YouTube 貼文的素材。")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append(f"- Raw candidates: {report['counts']['raw_candidates']}")
    lines.append(f"- Deduped candidates: {report['counts']['deduped_candidates']}")
    lines.append(f"- Published artifacts in range: {len(report['published_artifacts'])}")
    lines.append(f"- Source health errors: {report['source_health']['source_error_count']}")
    lines.append("")
    lines.append("## Category Radar")
    lines.append("")
    for cat, count in report["category_counts"].items():
        lines.append(f"- {cat}: {count}")
    lines.append("")
    lines.append("## Top Picks")
    lines.append("")
    for candidate in report["top_picks"]:
        lines.append(
            f"- #{candidate['rank']} [{candidate['title']}]({candidate['url']}) "
            f"- {candidate['source']} / {candidate['category']} / score {candidate['score']} "
            f"/ format {candidate['format_decision']}"
        )
        if candidate["decision_reason"]:
            lines.append(f"  - Why: {candidate['decision_reason']}")
        if candidate["source_diversity_note"]:
            lines.append(f"  - Diversity note: {candidate['source_diversity_note']}")
    lines.append("")
    lines.append("## Worth Mentioning But Not Main Pick")
    lines.append("")
    for candidate in report["watch_list"]:
        lines.append(
            f"- [{candidate['title']}]({candidate['url']}) "
            f"- {candidate['source']} / {candidate['category']} / score {candidate['score']} "
            f"/ format {candidate['format_decision']}"
        )
    lines.append("")
    lines.append("## Published This Week")
    lines.append("")
    if report["published_artifacts"]:
        for item in report["published_artifacts"]:
            lines.append(f"- {item['date']} {item['title']} - `{item['artifact']}`")
    else:
        lines.append("- No published article-video artifacts found in this date range.")
    lines.append("")
    lines.append("## Radar Gaps")
    lines.append("")
    gaps = report["registry_gaps"]
    missing_categories = gaps["categories_without_accepted_candidates"]
    if missing_categories:
        lines.append("- Categories with no accepted candidates this week: " + ", ".join(missing_categories))
    else:
        lines.append("- Every enabled registry category had at least one accepted candidate this week.")
    lines.append(
        f"- Latest source-health zero-candidate sources: {report['source_health']['latest_zero_candidate_source_count']} "
        "(sample stored in JSON)."
    )
    if report["source_health"]["source_errors"]:
        lines.append("- Source fetch/parse errors that may hide topics:")
        for error in report["source_health"]["source_errors"]:
            lines.append(f"  - {error['id']}: {error['status']} {error['error'] or ''}".rstrip())
    else:
        lines.append("- No latest source-health fetch errors were recorded.")
    lines.append("")
    lines.append("## Manual Review Prompts")
    lines.append("")
    lines.append("- Check whether important releases from high-quality primary sources were hidden by thin metadata, source downtime, or source concentration penalties.")
    lines.append("- Compare the radar against HN/top technical discussion context before recording a true miss.")
    lines.append("- Treat `not scanned` as a coverage statement, not proof that the topic was unimportant.")
    lines.append("")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build weekly technical radar from source-watch JSONL files.")
    parser.add_argument("--date", help="Week-ending date in YYYY-MM-DD. Defaults to Asia/Taipei today.")
    parser.add_argument("--days", type=int, default=7)
    parser.add_argument("--source-watch-dir", type=Path, default=DEFAULT_SOURCE_WATCH_DIR)
    parser.add_argument("--artifact-root", type=Path, default=DEFAULT_ARTIFACT_ROOT)
    parser.add_argument("--registry", type=Path, default=DEFAULT_REGISTRY)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--top", type=int, default=8)
    parser.add_argument("--watch", type=int, default=12)
    args = parser.parse_args()

    end = parse_date(args.date)
    dates = date_range(end, args.days)
    raw_candidates: list[dict[str, Any]] = []
    report_files: list[str] = []
    for day in dates:
        path = args.source_watch_dir / f"{day.isoformat()}.jsonl"
        report_files.append(str(path.relative_to(WORKSPACE)) if path.exists() else str(path))
        raw_candidates.extend(load_jsonl(path))

    candidates = dedupe(raw_candidates)
    top_candidates = top_diverse(candidates, limit=max(1, args.top))
    top_keys = {candidate_key(candidate) for candidate in top_candidates}
    watch_candidates = [
        candidate for candidate in candidates if candidate_key(candidate) not in top_keys
    ][: max(0, args.watch)]

    category_counts = Counter(category(candidate) for candidate in candidates)
    registry = load_registry(args.registry)
    report: dict[str, Any] = {
        "status": "PASS",
        "date_range": {
            "start": dates[0].isoformat(),
            "end": dates[-1].isoformat(),
            "days": len(dates),
        },
        "inputs": {
            "source_watch_reports": report_files,
            "registry": str(args.registry.relative_to(WORKSPACE)) if args.registry.exists() else str(args.registry),
        },
        "counts": {
            "raw_candidates": len(raw_candidates),
            "deduped_candidates": len(candidates),
            "top_pick_count": len(top_candidates),
            "watch_list_count": len(watch_candidates),
        },
        "category_counts": dict(sorted(category_counts.items())),
        "top_picks": [format_candidate(candidate, idx) for idx, candidate in enumerate(top_candidates, start=1)],
        "watch_list": [
            format_candidate(candidate, idx)
            for idx, candidate in enumerate(watch_candidates, start=len(top_candidates) + 1)
        ],
        "published_artifacts": published_sources(args.artifact_root, dates),
        "registry_gaps": registry_gaps(registry, candidates),
        "source_health": source_health_gaps(args.source_watch_dir),
    }

    args.output_dir.mkdir(parents=True, exist_ok=True)
    stem = dates[-1].isoformat()
    json_path = args.output_dir / f"{stem}.json"
    md_path = args.output_dir / f"{stem}.md"
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    md_path.write_text(build_markdown(report), encoding="utf-8")
    print(json.dumps({"status": "PASS", "json": str(json_path), "markdown": str(md_path)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
