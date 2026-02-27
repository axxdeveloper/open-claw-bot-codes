#!/usr/bin/env python3
"""Minimal viable test: verify write scope is limited to target Google Docs tab.

This script is intentionally test-oriented and now reuses the practical helper module
`google_docs_tab_write.py` for auth/doc operations.

What it does:
1) Insert a marker into one target tab (append mode)
2) Read all tabs and verify marker appears only in target tab
3) Cleanup marker from target tab (unless `--no-cleanup`)

Example:
  python3 scripts/google_docs_tab_write_mvt.py \
    --doc-id <DOC_ID> \
    --tab-title "最近行程"
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Make sibling script importable when run as a standalone file.
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import google_docs_tab_write as tab_writer


def main() -> int:
    ap = argparse.ArgumentParser(description="MVT: write to a specific Google Docs tab")
    ap.add_argument("--doc-id", required=True, help="Google Docs document ID")
    ap.add_argument("--tab-title", required=True, help="Target tab title")
    ap.add_argument(
        "--text",
        default="",
        help="Text to insert (default: auto marker with timestamp)",
    )
    ap.add_argument(
        "--no-cleanup",
        action="store_true",
        help="Do not remove marker after verification",
    )
    args = ap.parse_args()

    marker = args.text or f"\n[TAB_WRITE_TEST {dt.datetime.now().isoformat(timespec='seconds')}]"

    access_token = tab_writer.get_access_token_from_gog()

    before = tab_writer.get_doc_with_tabs(args.doc_id, access_token)
    tabs_before = tab_writer.flatten_tabs(before.get("tabs") or [])
    target = tab_writer.find_tab_by_title(tabs_before, args.tab_title)
    if not target:
        raise RuntimeError(f"Tab not found: {args.tab_title}")

    target_tab_id = (target.get("tabProperties") or {}).get("tabId")
    if not target_tab_id:
        raise RuntimeError(f"No tabId on tab: {args.tab_title}")

    write_result = tab_writer.write_text_to_tab(
        args.doc_id,
        access_token,
        tab_title=args.tab_title,
        tab_id=None,
        text=marker,
        mode="append",
        dry_run=False,
    )

    after = tab_writer.get_doc_with_tabs(args.doc_id, access_token)
    tabs_after = tab_writer.flatten_tabs(after.get("tabs") or [])

    found_tabs: List[Tuple[str, str]] = []
    for t in tabs_after:
        props = t.get("tabProperties") or {}
        title = props.get("title") or ""
        tid = props.get("tabId") or ""
        txt = tab_writer.tab_text(t)
        if marker in txt:
            found_tabs.append((title, tid))

    target_has_marker = any(tid == target_tab_id for _, tid in found_tabs)
    non_target_hits = [x for x in found_tabs if x[1] != target_tab_id]

    cleanup_resp: Optional[Dict[str, Any]] = None
    if not args.no_cleanup:
        cleanup_req = {
            "replaceAllText": {
                "containsText": {
                    "text": marker,
                    "matchCase": True,
                },
                "replaceText": "",
                "tabsCriteria": {
                    "tabIds": [target_tab_id],
                },
            }
        }
        cleanup_resp = tab_writer.batch_update(args.doc_id, access_token, [cleanup_req])

    result = {
        "ok": bool(target_has_marker and not non_target_hits),
        "docId": args.doc_id,
        "targetTabTitle": args.tab_title,
        "targetTabId": target_tab_id,
        "insertedText": marker,
        "writeRequestCount": write_result.get("requestCount"),
        "tabsContainingMarker": [
            {"title": title, "tabId": tid} for title, tid in found_tabs
        ],
        "cleanupEnabled": not args.no_cleanup,
        "cleanupResponse": cleanup_resp,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))

    return 0 if result["ok"] else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False, indent=2), file=sys.stderr)
        raise
