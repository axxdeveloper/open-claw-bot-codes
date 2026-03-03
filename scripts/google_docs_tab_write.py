#!/usr/bin/env python3
"""Write text to a specific Google Docs tab.

Features:
- Authenticate via existing `gog` login (no extra Python deps)
- Target a tab by `--tab-title` or `--tab-id`
- Input content from `--text` or `--file`
- Choose `--mode replace` (default) or `--mode append`
- Support `--dry-run` for safe request preview

Examples:
  # Replace whole tab content from inline text
  python3 scripts/google_docs_tab_write.py \
    --doc-id <DOC_ID> \
    --tab-title "最近行程" \
    --text "今天行程：\n- 13:00 會議" \
    --mode replace

  # Append content from file
  python3 scripts/google_docs_tab_write.py \
    --doc-id <DOC_ID> \
    --tab-title "AI 新聞" \
    --file /tmp/ai_news.txt \
    --mode append

  # Dry-run only
  python3 scripts/google_docs_tab_write.py \
    --doc-id <DOC_ID> \
    --tab-title "美股" \
    --file /tmp/us_stock.txt \
    --dry-run
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional

DOCS_API_BASE = "https://docs.googleapis.com/v1"
OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"


class TabWriteError(RuntimeError):
    """Domain-specific error for tab writing operations."""


def run_cmd(cmd: List[str]) -> str:
    p = subprocess.run(cmd, check=True, text=True, capture_output=True)
    return p.stdout


def http_json(
    method: str,
    url: str,
    *,
    token: Optional[str] = None,
    body: Optional[Dict[str, Any]] = None,
    form: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    headers = {"Accept": "application/json"}
    data: Optional[bytes] = None

    if token:
        headers["Authorization"] = f"Bearer {token}"

    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    elif form is not None:
        data = urllib.parse.urlencode(form).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise TabWriteError(f"HTTP {e.code} {method} {url}: {detail}") from e


def get_access_token_from_gog() -> str:
    status = json.loads(run_cmd(["gog", "auth", "status", "--json"]))
    account = status.get("account") or {}
    email = account.get("email")
    credentials_path = account.get("credentials_path")

    if not email:
        raise TabWriteError("No gog account email found in `gog auth status --json`.")
    if not credentials_path or not os.path.exists(credentials_path):
        raise TabWriteError(
            "No gog OAuth credentials file found. Check `gog auth status --json`."
        )

    with open(credentials_path, "r", encoding="utf-8") as f:
        creds = json.load(f)
    client_id = creds.get("client_id")
    client_secret = creds.get("client_secret")
    if not client_id or not client_secret:
        raise TabWriteError("Missing client_id/client_secret in gog credentials file.")

    tmp = tempfile.NamedTemporaryFile(prefix="gog-refresh-", suffix=".json", delete=False)
    tmp_path = tmp.name
    tmp.close()

    try:
        run_cmd(
            [
                "gog",
                "auth",
                "tokens",
                "export",
                email,
                "--out",
                tmp_path,
                "--overwrite",
            ]
        )
        with open(tmp_path, "r", encoding="utf-8") as f:
            token_doc = json.load(f)
        refresh_token = token_doc.get("refresh_token")
        if not refresh_token:
            raise TabWriteError("Exported token JSON missing refresh_token.")

        token_resp = http_json(
            "POST",
            OAUTH_TOKEN_URL,
            form={
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        access_token = token_resp.get("access_token")
        if not access_token:
            raise TabWriteError(f"No access_token in OAuth response: {token_resp}")
        return access_token
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass


def flatten_tabs(tabs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []

    def walk(nodes: List[Dict[str, Any]]) -> None:
        for t in nodes or []:
            out.append(t)
            walk(t.get("childTabs") or [])

    walk(tabs)
    return out


def get_doc_with_tabs(doc_id: str, access_token: str) -> Dict[str, Any]:
    # Keep full response shape to avoid brittle fields masks when Google API evolves.
    url = (
        f"{DOCS_API_BASE}/documents/{urllib.parse.quote(doc_id)}"
        "?includeTabsContent=true"
    )
    return http_json("GET", url, token=access_token)


def find_tab_by_title(all_tabs: List[Dict[str, Any]], title: str) -> Optional[Dict[str, Any]]:
    for t in all_tabs:
        props = t.get("tabProperties") or {}
        if props.get("title") == title:
            return t
    return None


def find_tab_by_id(all_tabs: List[Dict[str, Any]], tab_id: str) -> Optional[Dict[str, Any]]:
    for t in all_tabs:
        props = t.get("tabProperties") or {}
        if props.get("tabId") == tab_id:
            return t
    return None


def tab_text(tab: Dict[str, Any]) -> str:
    chunks: List[str] = []
    body = ((tab.get("documentTab") or {}).get("body") or {})
    for se in body.get("content") or []:
        para = se.get("paragraph")
        if not para:
            continue
        for el in para.get("elements") or []:
            tr = el.get("textRun")
            if tr and "content" in tr:
                chunks.append(tr["content"])
    return "".join(chunks)


def tab_end_index(tab: Dict[str, Any]) -> int:
    body = ((tab.get("documentTab") or {}).get("body") or {})
    max_end = 1
    for se in body.get("content") or []:
        end_index = se.get("endIndex")
        if isinstance(end_index, int):
            max_end = max(max_end, end_index)
    return max_end


def batch_update(doc_id: str, access_token: str, requests: List[Dict[str, Any]]) -> Dict[str, Any]:
    url = f"{DOCS_API_BASE}/documents/{urllib.parse.quote(doc_id)}:batchUpdate"
    return http_json("POST", url, token=access_token, body={"requests": requests})


def build_write_requests(tab_id: str, text: str, mode: str, target_tab_end: int) -> List[Dict[str, Any]]:
    if mode not in {"replace", "append"}:
        raise TabWriteError(f"Unsupported mode: {mode}")

    requests: List[Dict[str, Any]] = []

    if mode == "replace":
        # In Google Docs, user-editable body text in a tab starts at index 1.
        # Keep trailing structural newline by deleting until (endIndex - 1).
        delete_end = max(1, target_tab_end - 1)
        if delete_end > 1:
            requests.append(
                {
                    "deleteContentRange": {
                        "range": {
                            "tabId": tab_id,
                            "startIndex": 1,
                            "endIndex": delete_end,
                        }
                    }
                }
            )
        requests.append(
            {
                "insertText": {
                    "location": {"tabId": tab_id, "index": 1},
                    "text": text,
                }
            }
        )
        return requests

    requests.append(
        {
            "insertText": {
                "endOfSegmentLocation": {"tabId": tab_id},
                "text": text,
            }
        }
    )
    return requests


def write_text_to_tab(
    doc_id: str,
    access_token: str,
    *,
    tab_title: Optional[str],
    tab_id: Optional[str],
    text: str,
    mode: str,
    dry_run: bool,
) -> Dict[str, Any]:
    doc = get_doc_with_tabs(doc_id, access_token)
    tabs = flatten_tabs(doc.get("tabs") or [])

    target = None
    if tab_id:
        target = find_tab_by_id(tabs, tab_id)
    elif tab_title:
        target = find_tab_by_title(tabs, tab_title)

    if not target:
        if tab_id:
            raise TabWriteError(f"Tab not found by tabId: {tab_id}")
        raise TabWriteError(f"Tab not found by title: {tab_title}")

    props = target.get("tabProperties") or {}
    resolved_tab_id = props.get("tabId")
    resolved_tab_title = props.get("title")
    if not resolved_tab_id:
        raise TabWriteError("Target tab has no tabId")

    requests = build_write_requests(
        resolved_tab_id,
        text,
        mode,
        target_tab_end=tab_end_index(target),
    )

    update_resp = None
    if not dry_run:
        update_resp = batch_update(doc_id, access_token, requests)

    return {
        "ok": True,
        "docId": doc_id,
        "tabId": resolved_tab_id,
        "tabTitle": resolved_tab_title,
        "mode": mode,
        "dryRun": dry_run,
        "textLength": len(text),
        "requestCount": len(requests),
        "requests": requests,
        "updateResponse": update_resp,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Write text to a specific Google Docs tab")
    ap.add_argument("--doc-id", required=True, help="Google Docs document ID")
    ap.add_argument("--list-tabs", action="store_true", help="List tab titles/tabIds and exit")
    ap.add_argument(
        "--mode",
        choices=["replace", "append"],
        default="replace",
        help="Write mode: replace whole tab content (default) or append",
    )
    ap.add_argument("--dry-run", action="store_true", help="Build requests only, do not write")

    target = ap.add_mutually_exclusive_group()
    target.add_argument("--tab-title", help="Target tab title")
    target.add_argument("--tab-id", help="Target tabId")

    content = ap.add_mutually_exclusive_group()
    content.add_argument("--text", help="Inline text to write")
    content.add_argument("--file", help="Read text content from file path")

    args = ap.parse_args()

    if not args.list_tabs:
        if not args.tab_title and not args.tab_id:
            ap.error("One of --tab-title or --tab-id is required unless --list-tabs is used")
        if args.text is None and args.file is None:
            ap.error("One of --text or --file is required unless --list-tabs is used")

    access_token = get_access_token_from_gog()

    if args.list_tabs:
        doc = get_doc_with_tabs(args.doc_id, access_token)
        tabs = flatten_tabs(doc.get("tabs") or [])
        payload = {
            "ok": True,
            "docId": args.doc_id,
            "tabs": [
                {
                    "title": (t.get("tabProperties") or {}).get("title"),
                    "tabId": (t.get("tabProperties") or {}).get("tabId"),
                }
                for t in tabs
            ],
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    if args.file is not None:
        text = Path(args.file).read_text(encoding="utf-8")
    else:
        text = args.text or ""

    result = write_text_to_tab(
        args.doc_id,
        access_token,
        tab_title=args.tab_title,
        tab_id=args.tab_id,
        text=text,
        mode=args.mode,
        dry_run=args.dry_run,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False, indent=2), file=sys.stderr)
        raise
