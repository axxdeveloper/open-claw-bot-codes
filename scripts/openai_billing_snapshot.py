#!/usr/bin/env python3
"""Read-only OpenAI organization cost/usage snapshot for video workflows.

This script intentionally uses an Admin/billing key, not the normal TTS key.
It never prints secrets and exits successfully with an "unavailable" status
when billing credentials are not present or do not have permission.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from decimal import Decimal
from pathlib import Path

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover - Python 3.8 fallback if ever needed.
    ZoneInfo = None  # type: ignore[assignment]


DEFAULT_BASE_URL = "https://api.openai.com/v1"
ADMIN_KEY_ENVS = (
    "OPENAI_TEXT_TO_SPEECH_ADMIN_KEY",
    "OPENAI_ADMIN_KEY",
    "OPENAI_BILLING_API_KEY",
    "OPENAI_TEXT_TO_SPEECH_BILLING_API_KEY",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch a read-only OpenAI billing/usage snapshot.")
    parser.add_argument("--output", type=Path, help="Optional path to write the JSON snapshot")
    parser.add_argument(
        "--timeout",
        type=float,
        default=float(os.environ.get("OPENAI_BILLING_SNAPSHOT_TIMEOUT", "30")),
        help="HTTP timeout seconds",
    )
    parser.add_argument(
        "--timezone",
        default=os.environ.get("OPENAI_BILLING_SNAPSHOT_TZ", "Asia/Taipei"),
        help="Timezone used for today/month-to-date windows",
    )
    return parser.parse_args()


def resolve_tz(name: str):
    if ZoneInfo is None:
        return None
    try:
        return ZoneInfo(name)
    except Exception:
        return None


def find_admin_key() -> tuple[str | None, str | None]:
    for name in ADMIN_KEY_ENVS:
        value = os.environ.get(name)
        if value:
            return name, value
    return None, None


def unavailable(reason: str, tz_name: str) -> dict:
    return {
        "status": "unavailable",
        "reason": reason,
        "queried_at_unix": int(time.time()),
        "timezone": tz_name,
    }


def api_get_json(api_key: str, path: str, params: dict, timeout: float) -> dict:
    base_url = os.environ.get("OPENAI_ADMIN_BASE_URL", DEFAULT_BASE_URL).rstrip("/")
    query = urllib.parse.urlencode(params, doseq=True)
    url = f"{base_url}{path}?{query}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def iter_results(page: dict):
    for bucket in page.get("data", []):
        for result in bucket.get("results", []):
            yield result


def sum_costs(page: dict) -> dict[str, str]:
    totals: dict[str, Decimal] = defaultdict(Decimal)
    for result in iter_results(page):
        amount = result.get("amount") or {}
        value = amount.get("value")
        currency = amount.get("currency") or "unknown"
        if value is not None:
            totals[currency] += Decimal(str(value))
    return {currency: format(value, "f") for currency, value in sorted(totals.items())}


def sum_audio_speeches(page: dict) -> dict[str, int]:
    characters = 0
    requests = 0
    for result in iter_results(page):
        characters += int(result.get("characters") or 0)
        requests += int(result.get("num_model_requests") or 0)
    return {"characters": characters, "num_model_requests": requests}


def build_snapshot(args: argparse.Namespace) -> dict:
    tz = resolve_tz(args.timezone)
    tz_name = args.timezone if tz is not None else "system-local"
    key_name, api_key = find_admin_key()
    if not api_key:
        names = "/".join(ADMIN_KEY_ENVS)
        return unavailable(f"{names} is not set", tz_name)

    now = time.time()
    if tz is None:
        now_struct = time.localtime(now)
        day_start = time.mktime(now_struct[:3] + (0, 0, 0, now_struct.tm_wday, now_struct.tm_yday, now_struct.tm_isdst))
        month_start_struct = (now_struct.tm_year, now_struct.tm_mon, 1, 0, 0, 0, 0, 1, now_struct.tm_isdst)
        month_start = time.mktime(month_start_struct)
    else:
        from datetime import datetime

        now_dt = datetime.fromtimestamp(now, tz)
        day_start = now_dt.replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
        month_start = now_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0).timestamp()

    end_time = int(now)
    day_start_i = int(day_start)
    month_start_i = int(month_start)
    seven_days_start_i = int(now - 7 * 24 * 60 * 60)

    try:
        month_costs = api_get_json(
            api_key,
            "/organization/costs",
            {
                "start_time": month_start_i,
                "end_time": end_time,
                "bucket_width": "1d",
                "limit": 31,
            },
            args.timeout,
        )
        last_7d_costs = api_get_json(
            api_key,
            "/organization/costs",
            {
                "start_time": seven_days_start_i,
                "end_time": end_time,
                "bucket_width": "1d",
                "limit": 7,
            },
            args.timeout,
        )
        audio_today = api_get_json(
            api_key,
            "/organization/usage/audio_speeches",
            {
                "start_time": day_start_i,
                "end_time": end_time,
                "bucket_width": "1d",
                "limit": 1,
            },
            args.timeout,
        )
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")[:500]
        return unavailable(f"billing API HTTP {exc.code}: {body}", tz_name)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        return unavailable(f"billing API request failed: {exc}", tz_name)

    return {
        "status": "available",
        "queried_at_unix": end_time,
        "timezone": tz_name,
        "key_env": key_name,
        "costs": {
            "month_to_date": {
                "start_time": month_start_i,
                "end_time": end_time,
                "amount_by_currency": sum_costs(month_costs),
            },
            "last_7_days": {
                "start_time": seven_days_start_i,
                "end_time": end_time,
                "amount_by_currency": sum_costs(last_7d_costs),
            },
        },
        "audio_speeches_today": {
            "start_time": day_start_i,
            "end_time": end_time,
            **sum_audio_speeches(audio_today),
        },
    }


def main() -> int:
    args = parse_args()
    snapshot = build_snapshot(args)
    output = json.dumps(snapshot, ensure_ascii=False, indent=2, sort_keys=True)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(output + "\n", encoding="utf-8")
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
