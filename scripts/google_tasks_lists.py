#!/usr/bin/env python3
"""Fetch Google Tasks lists + pending tasks via OAuth refresh token (no gog runtime needed)."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional

TASKS_API_BASE = "https://tasks.googleapis.com/tasks/v1"
OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"


class TasksError(RuntimeError):
    pass


def http_json(method: str, url: str, *, token: Optional[str] = None, form: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    headers = {"Accept": "application/json"}
    data = None
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if form is not None:
        data = urllib.parse.urlencode(form).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise TasksError(f"HTTP {e.code} {method} {url}: {detail}") from e


def _load_oauth_file(path: Path) -> Dict[str, str]:
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {
        "client_id": data.get("client_id", ""),
        "client_secret": data.get("client_secret", ""),
        "refresh_token": data.get("refresh_token", ""),
    }


def load_google_oauth_config(oauth_file: Optional[str]) -> Dict[str, str]:
    cfg = {
        "client_id": os.getenv("GOOGLE_OAUTH_CLIENT_ID", ""),
        "client_secret": os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", ""),
        "refresh_token": os.getenv("GOOGLE_OAUTH_REFRESH_TOKEN", ""),
    }
    path = Path(
        oauth_file
        or os.getenv("OPENCLAW_GOOGLE_OAUTH_FILE", "")
        or Path.home() / ".config" / "openclaw" / "google-oauth.json"
    )
    file_cfg = _load_oauth_file(path)

    for k in ("client_id", "client_secret", "refresh_token"):
        if not cfg[k]:
            cfg[k] = file_cfg.get(k, "")

    missing = [k for k, v in cfg.items() if not v]
    if missing:
        raise TasksError(
            "Missing Google OAuth config: "
            + ", ".join(missing)
            + ". Set env vars or create "
            + str(path)
        )
    return cfg


def get_access_token(oauth_file: Optional[str]) -> str:
    cfg = load_google_oauth_config(oauth_file)
    token_resp = http_json(
        "POST",
        OAUTH_TOKEN_URL,
        form={
            "client_id": cfg["client_id"],
            "client_secret": cfg["client_secret"],
            "refresh_token": cfg["refresh_token"],
            "grant_type": "refresh_token",
        },
    )
    access_token = token_resp.get("access_token")
    if not access_token:
        raise TasksError(f"No access_token in OAuth response: {token_resp}")
    return access_token


def list_tasklists(token: str) -> list[Dict[str, Any]]:
    url = f"{TASKS_API_BASE}/users/@me/lists?{urllib.parse.urlencode({'maxResults': '100'})}"
    data = http_json("GET", url, token=token)
    return data.get("items", []) or []


def list_tasks(token: str, tasklist_id: str) -> list[Dict[str, Any]]:
    q = {
        "showCompleted": "true",
        "showHidden": "false",
        "maxResults": "200",
    }
    url = f"{TASKS_API_BASE}/lists/{urllib.parse.quote(tasklist_id, safe='')}/tasks?{urllib.parse.urlencode(q)}"
    data = http_json("GET", url, token=token)
    return data.get("items", []) or []


def main() -> int:
    ap = argparse.ArgumentParser(description="Fetch Google Tasks lists and pending tasks")
    ap.add_argument("--oauth-file", help="Path to google-oauth.json")
    args = ap.parse_args()

    token = get_access_token(args.oauth_file)
    out_lists = []
    for li in list_tasklists(token):
        lid = li.get("id")
        if not lid:
            continue
        tasks = list_tasks(token, lid)
        pending = [t for t in tasks if t.get("status") != "completed"]
        out_lists.append({
            "id": lid,
            "title": li.get("title") or "(未命名清單)",
            "tasks": pending,
        })

    print(json.dumps({"ok": True, "tasklists": out_lists}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False, indent=2), file=sys.stderr)
        raise SystemExit(1)
