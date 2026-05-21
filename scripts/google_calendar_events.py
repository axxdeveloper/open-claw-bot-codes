#!/usr/bin/env python3
"""Fetch Google Calendar events via OAuth refresh token (no gog runtime needed)."""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional

from google_oauth_policy import load_google_oauth_config

CAL_API_BASE = "https://www.googleapis.com/calendar/v3"
OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"


class CalendarError(RuntimeError):
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
        raise CalendarError(f"HTTP {e.code} {method} {url}: {detail}") from e


def get_access_token(oauth_file: Optional[str]) -> str:
    try:
        cfg = load_google_oauth_config(oauth_file)
    except RuntimeError as e:
        raise CalendarError(str(e)) from e
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
        raise CalendarError(f"No access_token in OAuth response: {token_resp}")
    return access_token


def main() -> int:
    ap = argparse.ArgumentParser(description="Fetch Google Calendar events")
    ap.add_argument("--calendar-id", default="primary")
    ap.add_argument("--from", dest="time_min", required=True, help="RFC3339 start time")
    ap.add_argument("--to", dest="time_max", required=True, help="RFC3339 end time")
    ap.add_argument("--max", dest="max_results", type=int, default=250)
    ap.add_argument("--oauth-file", help="Path to google-oauth.json")
    args = ap.parse_args()

    token = get_access_token(args.oauth_file)
    params = {
        "timeMin": args.time_min,
        "timeMax": args.time_max,
        "singleEvents": "true",
        "orderBy": "startTime",
        "maxResults": str(args.max_results),
    }
    url = (
        f"{CAL_API_BASE}/calendars/{urllib.parse.quote(args.calendar_id, safe='')}"
        f"/events?{urllib.parse.urlencode(params)}"
    )
    data = http_json("GET", url, token=token)
    payload = {
        "ok": True,
        "calendarId": args.calendar_id,
        "timeMin": args.time_min,
        "timeMax": args.time_max,
        "items": data.get("items", []),
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False, indent=2), file=sys.stderr)
        raise SystemExit(1)
