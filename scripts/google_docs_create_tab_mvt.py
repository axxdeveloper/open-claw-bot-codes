#!/usr/bin/env python3
"""Minimal viable test: create a new Google Docs tab via batchUpdate.

What it does:
1) Read current tabs
2) Send batchUpdate(addDocumentTab)
3) Read tabs again and verify the new tab exists

Example:
  python3 scripts/google_docs_create_tab_mvt.py \
    --doc-id <DOC_ID> \
    --title "測試-自動新增tab-2026-02-27-1350"
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Make sibling script importable when run as a standalone file.
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import google_docs_tab_write as tab_writer


def summarize_tabs(tabs: List[Dict[str, Any]]) -> List[Dict[str, Optional[str]]]:
    return [
        {
            "title": (t.get("tabProperties") or {}).get("title"),
            "tabId": (t.get("tabProperties") or {}).get("tabId"),
            "parentTabId": (t.get("tabProperties") or {}).get("parentTabId"),
        }
        for t in tabs
    ]


def find_tabs_by_title(tabs: List[Dict[str, Any]], title: str) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for t in tabs:
        props = t.get("tabProperties") or {}
        if props.get("title") == title:
            out.append(t)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="MVT: create Google Docs tab")
    ap.add_argument("--doc-id", required=True, help="Google Docs document ID")
    ap.add_argument(
        "--title",
        help="Title for new tab (default: 測試-自動新增tab-<timestamp>)",
    )
    ap.add_argument("--parent-tab-id", help="Optional parent tabId for nested tab")
    ap.add_argument("--index", type=int, help="Optional zero-based index under parent")
    ap.add_argument("--icon-emoji", help="Optional emoji icon")
    ap.add_argument("--dry-run", action="store_true", help="Build request only")

    args = ap.parse_args()

    title = args.title or f"測試-自動新增tab-{dt.datetime.now().strftime('%Y%m%d-%H%M%S')}"

    access_token = tab_writer.get_access_token_from_gog()

    before_doc = tab_writer.get_doc_with_tabs(args.doc_id, access_token)
    before_tabs = tab_writer.flatten_tabs(before_doc.get("tabs") or [])

    tab_properties: Dict[str, Any] = {"title": title}
    if args.parent_tab_id:
        tab_properties["parentTabId"] = args.parent_tab_id
    if args.index is not None:
        tab_properties["index"] = args.index
    if args.icon_emoji:
        tab_properties["iconEmoji"] = args.icon_emoji

    requests = [{"addDocumentTab": {"tabProperties": tab_properties}}]

    update_response: Optional[Dict[str, Any]] = None
    created_props: Optional[Dict[str, Any]] = None
    if not args.dry_run:
        update_response = tab_writer.batch_update(args.doc_id, access_token, requests)
        replies = update_response.get("replies") or []
        if replies:
            created_props = ((replies[0] or {}).get("addDocumentTab") or {}).get("tabProperties")

    after_doc = tab_writer.get_doc_with_tabs(args.doc_id, access_token)
    after_tabs = tab_writer.flatten_tabs(after_doc.get("tabs") or [])

    matched_after = find_tabs_by_title(after_tabs, title)
    created_tab_id = (created_props or {}).get("tabId")
    verified_by_id = False
    if created_tab_id:
        verified_by_id = any(
            ((t.get("tabProperties") or {}).get("tabId") == created_tab_id)
            for t in after_tabs
        )

    ok = bool(args.dry_run or matched_after) and (True if not created_tab_id else verified_by_id)

    result = {
        "ok": ok,
        "dryRun": args.dry_run,
        "docId": args.doc_id,
        "requestedTitle": title,
        "request": requests,
        "beforeTabCount": len(before_tabs),
        "afterTabCount": len(after_tabs),
        "createdTabFromResponse": created_props,
        "matchedTabsAfter": summarize_tabs(matched_after),
        "allTabsAfter": summarize_tabs(after_tabs),
        "updateResponse": update_response,
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False, indent=2), file=sys.stderr)
        raise
