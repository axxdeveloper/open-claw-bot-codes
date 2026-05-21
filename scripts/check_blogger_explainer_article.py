#!/usr/bin/env python3
"""Validate Blogger HTML drafts as standalone explainers."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
import json
import re
import sys
from pathlib import Path
from typing import Any


SECTION_PATTERNS = {
    "source_object": r"來源|原文|文章|訪談|影片|paper|論文|release|repo|報告",
    "definition": r"是什麼|定義|白話|意思是|指的是",
    "problem_context": r"問題|背景|為什麼|痛點|現在|來源",
    "mechanism": r"怎麼運作|運作|機制|流程|步驟|架構",
    "example_or_scenario": r"例子|情境|場景|假設|實際|案例",
    "tradeoff_or_risk": r"取捨|風險|限制|失敗|代價|盲點",
    "source_conclusion_or_limit": r"結論|發現|指出|顯示|結果|限制|邊界|不能代表|不是說|意味|改了|新增|修正",
}

SOURCE_URL_RE = re.compile(r"https?://\S+")
YOUTUBE_RE = re.compile(r"https?://(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)\S+")


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        if data.strip():
            self.parts.append(data.strip())

    def get_text(self) -> str:
        return "\n".join(self.parts)


def html_to_text(html: str) -> str:
    parser = TextExtractor()
    parser.feed(html)
    return parser.get_text()


class LinkExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.hrefs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        href = dict(attrs).get("href")
        if href and href.startswith(("http://", "https://")):
            self.hrefs.append(href)


def html_to_hrefs(html: str) -> list[str]:
    parser = LinkExtractor()
    parser.feed(html)
    return parser.hrefs


def normalize_visible_url(url: str) -> str:
    return url.rstrip(".,，。)、）]】")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check a Blogger HTML draft for standalone from-zero explainer coverage."
    )
    parser.add_argument("html_file", type=Path)
    parser.add_argument("--require-youtube-url", action="store_true")
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    html_path = args.html_file.resolve()
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {"html_file": str(html_path)}
    hrefs: list[str] = []

    if not html_path.exists():
        errors.append({"code": "missing_html_file", "message": "Blogger HTML draft does not exist."})
        text = ""
    else:
        html = html_path.read_text(encoding="utf-8", errors="replace")
        text = html_to_text(html)
        hrefs = html_to_hrefs(html)

    parsed["text_chars"] = len(text)
    visible_urls = [normalize_visible_url(url) for url in SOURCE_URL_RE.findall(text)]
    href_urls = [normalize_visible_url(url) for url in hrefs]
    href_url_set = set(href_urls)
    visible_urls_missing_anchor = [url for url in visible_urls if url not in href_url_set]
    youtube_hrefs = [url for url in href_urls if YOUTUBE_RE.match(url)]
    parsed["source_url_count"] = len(visible_urls)
    parsed["youtube_url_count"] = len([url for url in visible_urls if YOUTUBE_RE.match(url)])
    parsed["anchor_href_url_count"] = len(href_urls)
    parsed["youtube_anchor_href_count"] = len(youtube_hrefs)
    parsed["visible_urls_missing_anchor"] = visible_urls_missing_anchor

    if len(text) < 1200:
        errors.append(
            {
                "code": "article_too_short_for_standalone_explainer",
                "text_chars": len(text),
                "message": "Blogger articles should stand alone; add enough explanation beyond a video summary.",
            }
        )

    for key, pattern in SECTION_PATTERNS.items():
        matched = bool(re.search(pattern, text, re.IGNORECASE))
        parsed[f"has_{key}"] = matched
        if not matched:
            errors.append(
                {
                    "code": f"missing_{key}",
                    "message": f"Add a clear standalone paragraph/section for {key}.",
                }
            )

    if not SOURCE_URL_RE.search(text):
        errors.append(
            {
                "code": "missing_source_url",
                "message": "The article must include the original source URL.",
            }
        )

    if visible_urls_missing_anchor:
        errors.append(
            {
                "code": "visible_url_not_clickable",
                "urls": visible_urls_missing_anchor,
                "message": "Visible URLs in Blogger articles must be clickable <a href> links.",
            }
        )

    if args.require_youtube_url and not YOUTUBE_RE.search(text):
        errors.append(
            {
                "code": "missing_youtube_url",
                "message": "This Blogger backfill should include the corresponding TodayShip YouTube URL.",
            }
        )
    elif args.require_youtube_url and not youtube_hrefs:
        errors.append(
            {
                "code": "youtube_url_not_clickable",
                "message": "The corresponding TodayShip YouTube URL must be a clickable <a href> link.",
            }
        )
    elif not YOUTUBE_RE.search(text):
        warnings.append(
            {
                "code": "youtube_url_not_detected",
                "message": "No YouTube URL detected; this is OK only for non-video standalone Blogger posts.",
            }
        )

    result = {
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
    raise SystemExit(main())
