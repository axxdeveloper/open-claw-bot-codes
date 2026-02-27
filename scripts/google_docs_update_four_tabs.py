#!/usr/bin/env python3
"""Batch update four daily tabs in one command.

Default tab targets:
- 最近行程
- AI 新聞
- 美股
- 台股

Content is read from four files.

Examples:
  # Dry-run (build requests only)
  python3 scripts/google_docs_update_four_tabs.py \
    --doc-id <DOC_ID> \
    --recent-file /tmp/recent.txt \
    --ai-news-file /tmp/ai_news.txt \
    --us-stock-file /tmp/us_stock.txt \
    --tw-stock-file /tmp/tw_stock.txt \
    --dry-run

  # Real replace update to all four tabs
  python3 scripts/google_docs_update_four_tabs.py \
    --doc-id <DOC_ID> \
    --recent-file /tmp/recent.txt \
    --ai-news-file /tmp/ai_news.txt \
    --us-stock-file /tmp/us_stock.txt \
    --tw-stock-file /tmp/tw_stock.txt \
    --mode replace
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List

# Make sibling script importable when run as a standalone file.
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import google_docs_tab_write as tab_writer


DEFAULT_TABS = {
    "recent": "最近行程",
    "ai_news": "AI 新聞",
    "us_stock": "美股",
    "tw_stock": "台股",
}


def read_text(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description="Update four Google Docs tabs in one run")
    ap.add_argument("--doc-id", required=True, help="Google Docs document ID")
    ap.add_argument("--recent-file", required=True, help="Content file for 最近行程 tab")
    ap.add_argument("--ai-news-file", required=True, help="Content file for AI 新聞 tab")
    ap.add_argument("--us-stock-file", required=True, help="Content file for 美股 tab")
    ap.add_argument("--tw-stock-file", required=True, help="Content file for 台股 tab")

    ap.add_argument("--recent-tab-title", default=DEFAULT_TABS["recent"])
    ap.add_argument("--ai-news-tab-title", default=DEFAULT_TABS["ai_news"])
    ap.add_argument("--us-stock-tab-title", default=DEFAULT_TABS["us_stock"])
    ap.add_argument("--tw-stock-tab-title", default=DEFAULT_TABS["tw_stock"])

    ap.add_argument(
        "--mode",
        choices=["replace", "append"],
        default="replace",
        help="Write mode for each tab (default: replace)",
    )
    ap.add_argument("--dry-run", action="store_true", help="Build requests only, no writes")
    ap.add_argument(
        "--continue-on-error",
        action="store_true",
        help="Continue remaining tabs even if one tab update fails",
    )

    args = ap.parse_args()

    content_plan = [
        (args.recent_tab_title, args.recent_file),
        (args.ai_news_tab_title, args.ai_news_file),
        (args.us_stock_tab_title, args.us_stock_file),
        (args.tw_stock_tab_title, args.tw_stock_file),
    ]

    access_token = tab_writer.get_access_token_from_gog()

    results: List[Dict[str, Any]] = []
    all_ok = True

    for tab_title, file_path in content_plan:
        try:
            text = read_text(file_path)
            result = tab_writer.write_text_to_tab(
                args.doc_id,
                access_token,
                tab_title=tab_title,
                tab_id=None,
                text=text,
                mode=args.mode,
                dry_run=args.dry_run,
            )
            results.append(result)
        except Exception as e:
            all_ok = False
            err = {
                "ok": False,
                "docId": args.doc_id,
                "tabTitle": tab_title,
                "sourceFile": file_path,
                "error": str(e),
            }
            results.append(err)
            if not args.continue_on_error:
                break

    payload = {
        "ok": all_ok,
        "docId": args.doc_id,
        "mode": args.mode,
        "dryRun": args.dry_run,
        "results": results,
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0 if all_ok else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False, indent=2), file=sys.stderr)
        raise
