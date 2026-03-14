#!/usr/bin/env bash
set -euo pipefail

BASE="/Users/openclaw-user/.openclaw/workspace"
CAL_FETCH="$BASE/scripts/google_calendar_events.py"
FROM_TS="$(TZ=Asia/Taipei date '+%Y-%m-%dT00:00:00+08:00')"
TO_TS="$(TZ=Asia/Taipei date -v+1d '+%Y-%m-%dT23:59:59+08:00')"

if ! out="$(python3 "$CAL_FETCH" --calendar-id primary --from "$FROM_TS" --to "$TO_TS" 2>&1)"; then
  if echo "$out" | grep -qi 'invalid_grant\|unauthorized_client\|invalid_client'; then
    echo "[ALERT] Google OAuth refresh 失敗（token/client 無效），請重新授權。"
    exit 0
  fi
  echo "[ALERT] Google Calendar API 讀取失敗：$out"
  exit 0
fi

echo "[OK] Google OAuth refresh 正常。"
