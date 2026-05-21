#!/usr/bin/env python3
"""Validate source-first Threads drafts for beginner-friendly explanation."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


URL_LINE_RE = re.compile(r"(?m)^https?://\S+\s*$")
BAD_ATTACHED_URL_RE = re.compile(
    r"(來源|想用聽的|影片|YouTube)[：:][ \t]*https?://|"
    r"[，。；、:：)]https?://"
)
BANNED_BLOGGER_LABEL_RE = re.compile(r"延伸文章|延伸閱讀|中文版文章|中文解說文章")
TODAYSHIP_BLOGGER_URL_RE = re.compile(r"https?://todayshipdoc\.blogspot\.com/\S*", re.IGNORECASE)
QUESTION_FRAMED_RE = re.compile(r"(先問|可以問|要問|問自己|問題是|為什麼\?)")
DEFINITION_RE = re.compile(
    r"(是指|指的是|意思是|白話|可以想成|就是|是一種|是一個|是.{0,18}(?:說明|文章|訪談|影片|論文|更新|release|repo))"
)
MECHANISM_RE = re.compile(r"(機制|怎麼運作|流程|透過|因為|所以|會把|會先|會直接|改變|估計|探索|收資料|決定|分成|取捨|限制|邊界)")
SOURCE_IDENTITY_RE = re.compile(
    r"(這(?:篇|集|份|支|個)|來源|原文|訪談|影片|paper|論文|release|repo|文章|報告)"
)
SOURCE_CONCLUSION_RE = re.compile(
    r"(結論|發現|指出|顯示|代表|意味|限制|邊界|不能代表|不是說|重點是|改了|新增|修正|比較|結果)"
)


def read_text(args: argparse.Namespace) -> str:
    if args.text:
        return args.text
    if args.text_file:
        return Path(args.text_file).read_text(encoding="utf-8", errors="replace")
    return sys.stdin.read()


def visible_blocks(text: str) -> list[str]:
    return [block.strip() for block in re.split(r"\n\s*\n", text.strip()) if block.strip()]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check a Threads source-intro draft for from-zero explanation and link formatting."
    )
    parser.add_argument("text_file", nargs="?")
    parser.add_argument("--text")
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    text = read_text(args)
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    blocks = visible_blocks(text)
    urls = URL_LINE_RE.findall(text)

    if not text.strip():
        errors.append({"code": "empty_post", "message": "Threads draft is empty."})

    if len(blocks) < 3:
        errors.append(
            {
                "code": "too_few_readable_blocks",
                "block_count": len(blocks),
                "message": "Use at least 3 short readable blocks: takeaway, explanation, source.",
            }
        )
    elif len(blocks) > 8:
        warnings.append(
            {
                "code": "too_many_blocks",
                "block_count": len(blocks),
                "message": "Threads posts should stay compact; consider 3-6 blocks when possible.",
            }
        )

    if not urls:
        errors.append(
            {
                "code": "missing_raw_url_line",
                "message": "Put the original source URL on its own line.",
            }
        )

    if BAD_ATTACHED_URL_RE.search(text):
        errors.append(
            {
                "code": "url_attached_to_label_or_punctuation",
                "message": "Do not write `來源：https://...` or attach URLs to punctuation/labels.",
            }
        )

    if BANNED_BLOGGER_LABEL_RE.search(text):
        errors.append(
            {
                "code": "blogger_link_label_not_allowed",
                "message": "Do not add Blogger link labels in Threads source-intro posts; keep Blogger on Blogger.",
            }
        )

    if TODAYSHIP_BLOGGER_URL_RE.search(text):
        errors.append(
            {
                "code": "blogger_link_not_allowed_in_threads_source_intro",
                "message": "Do not include TodayShip Blogger links in Threads source-intro posts; keep only the original source and optional YouTube note.",
            }
        )

    if QUESTION_FRAMED_RE.search(text):
        errors.append(
            {
                "code": "question_framed_takeaway",
                "message": "Threads takeaways should give the answer directly, not frame the learning as a question.",
            }
        )

    if not DEFINITION_RE.search(text):
        errors.append(
            {
                "code": "missing_plain_definition",
                "message": "Add one plain definition of the core term or source object.",
            }
        )

    if not MECHANISM_RE.search(text):
        errors.append(
            {
                "code": "missing_mechanism_or_boundary",
                "message": "Add one short mechanism, boundary, or limitation so the post teaches more than a claim.",
            }
        )

    if not SOURCE_IDENTITY_RE.search(text):
        errors.append(
            {
                "code": "missing_source_identity",
                "message": "Identify the source object first: article, interview, paper, release, repo, or video.",
            }
        )

    if not SOURCE_CONCLUSION_RE.search(text):
        errors.append(
            {
                "code": "missing_source_conclusion_or_limit",
                "message": "Add one source-backed conclusion, result, change, limitation, or boundary.",
            }
        )

    result = {
        "status": "FAIL" if errors else "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": {
            "char_count": len(text),
            "block_count": len(blocks),
            "url_line_count": len(urls),
            "has_plain_definition": bool(DEFINITION_RE.search(text)),
            "has_mechanism_or_boundary": bool(MECHANISM_RE.search(text)),
            "has_source_identity": bool(SOURCE_IDENTITY_RE.search(text)),
            "has_source_conclusion_or_limit": bool(SOURCE_CONCLUSION_RE.search(text)),
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
