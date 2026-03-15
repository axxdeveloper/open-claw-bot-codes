#!/usr/bin/env bash
set -euo pipefail

TZ_NAME="Asia/Taipei"
BASE="/Users/openclaw-user/.openclaw/workspace"
CAL_FETCH="$BASE/scripts/google_calendar_events.py"
FROM_TS="$(TZ=$TZ_NAME date '+%Y-%m-%dT00:00:00+08:00')"
TO_TS_7D="$(TZ=$TZ_NAME date -v+7d '+%Y-%m-%dT23:59:59+08:00')"
TO_TS_30D="$(TZ=$TZ_NAME date -v+30d '+%Y-%m-%dT23:59:59+08:00')"
NOW="$(TZ=$TZ_NAME date '+%Y-%m-%d %H:%M')"

if [[ ! -x "$CAL_FETCH" ]]; then
  echo "【06:00 行程預告】$NOW ($TZ_NAME)"
  echo "找不到 $CAL_FETCH，無法讀取 Google Calendar。"
  exit 0
fi

fetch_json() {
  local to_ts="$1"
  python3 "$CAL_FETCH" --calendar-id primary --from "$FROM_TS" --to "$to_ts" 2>&1
}

to_lines() {
  local raw_json="$1"
  python3 - <<'PY' "$raw_json"
import json
import sys

j = json.loads(sys.argv[1])
items = j.get("items") or []

for ev in items:
    start = ev.get("start", {})
    end = ev.get("end", {})
    st = start.get("dateTime") or start.get("date") or ""
    et = end.get("dateTime") or end.get("date") or ""
    title = ev.get("summary") or "(無標題)"
    print(f"{st}\t{et}\t{title}")
PY
}

fetch_tasks_lines() {
  python3 - <<'PY'
import json
import shutil
import subprocess
from datetime import datetime

TZ_OFFSET = "+08:00"
WEEKDAY = ["一", "二", "三", "四", "五", "六", "日"]

def run(cmd):
    p = subprocess.run(cmd, text=True, capture_output=True)
    return p.returncode, p.stdout, p.stderr

def fmt_due(due: str) -> str:
    if not due:
        return ""
    try:
        # ex: 2026-03-20T00:00:00.000Z
        if due.endswith("Z"):
            dt = datetime.fromisoformat(due.replace("Z", "+00:00"))
            # convert to +08
            dt = dt.astimezone().astimezone()  # keep local conversion behavior
            # fallback: only date is enough for task reminder
            y, m, d = dt.year, dt.month, dt.day
        else:
            dstr = due.split("T", 1)[0]
            y, m, d = map(int, dstr.split("-"))
        wd = WEEKDAY[datetime(y, m, d).weekday()]
        return f"（截止 {m}/{d}（{wd}））"
    except Exception:
        return f"（截止 {due}）"

if shutil.which("gog") is None:
    print("（未安裝 gog，略過 Google Tasks）")
    raise SystemExit(0)

code, out, err = run(["gog", "tasks", "lists", "--json", "--no-input"])
if code != 0:
    msg = (err or out).strip().splitlines()[-1] if (err or out).strip() else "未知錯誤"
    print(f"（讀取 Tasks 清單失敗：{msg}）")
    raise SystemExit(0)

try:
    lists = (json.loads(out).get("tasklists") or [])
except Exception:
    print("（讀取 Tasks 清單失敗：JSON 解析錯誤）")
    raise SystemExit(0)

if not lists:
    print("（目前沒有 Google Tasks 清單）")
    raise SystemExit(0)

printed_any = False
for li in lists:
    lid = li.get("id")
    ltitle = li.get("title") or "(未命名清單)"
    if not lid:
        continue
    code, tout, terr = run(["gog", "tasks", "list", lid, "--json", "--no-input"])
    if code != 0:
        continue
    try:
        tasks = (json.loads(tout).get("tasks") or [])
    except Exception:
        continue
    pending = [t for t in tasks if t.get("status") != "completed"]
    if not pending:
        continue

    print(f"- {ltitle}")
    printed_any = True
    for i, t in enumerate(pending, start=1):
        title = (t.get("title") or "(無標題)").strip()
        due = fmt_due(t.get("due") or "")
        print(f"  {i}. {title}{due}")

if not printed_any:
    print("（所有清單目前都沒有待辦）")
PY
}

if ! raw_7d="$(fetch_json "$TO_TS_7D")"; then
  echo "【06:00 行程預告】$NOW ($TZ_NAME)"
  echo "讀取 Google Calendar 失敗（可能是授權過期），請重新設定 Google OAuth。"
  exit 0
fi

lines_7d="$(to_lines "$raw_7d")"
count_7d="$(echo "$lines_7d" | sed '/^[[:space:]]*$/d' | wc -l | tr -d ' ')"

window_label="接下來 7 天"
lines_to_show="$lines_7d"

if [[ "${count_7d:-0}" -lt 10 ]]; then
  if raw_30d="$(fetch_json "$TO_TS_30D")"; then
    lines_30d="$(to_lines "$raw_30d")"
    window_label="接下來 30 天（7 天內少於 10 筆）"
    lines_to_show="$lines_30d"
  fi
fi

echo "【06:00 行程預告】$NOW ($TZ_NAME)"

weekday_zh() {
  case "$1" in
    1) echo "一" ;;
    2) echo "二" ;;
    3) echo "三" ;;
    4) echo "四" ;;
    5) echo "五" ;;
    6) echo "六" ;;
    7) echo "日" ;;
    *) echo "?" ;;
  esac
}

if [[ -z "${lines_to_show// /}" ]]; then
  echo "$window_label 沒有行程。"
else
  idx=1
  while IFS=$'\t' read -r start end summary; do
    [[ -z "${start// /}" ]] && continue

    if [[ "$start" == *"T"* ]]; then
      day=$(echo "$start" | cut -d'T' -f1)
      st=$(echo "$start" | cut -d'T' -f2 | cut -d'+' -f1 | cut -c1-5)
      et=$(echo "$end" | cut -d'T' -f2 | cut -d'+' -f1 | cut -c1-5)
      wnum=$(TZ=$TZ_NAME date -j -f "%Y-%m-%d" "$day" "+%u" 2>/dev/null || echo 0)
      wzh=$(weekday_zh "$wnum")
      md=$(echo "$day" | awk -F- '{printf "%d/%d", $2+0, $3+0}')
      echo "$idx) $md（$wzh） $st-$et  $summary"
    else
      day="$start"
      wnum=$(TZ=$TZ_NAME date -j -f "%Y-%m-%d" "$day" "+%u" 2>/dev/null || echo 0)
      wzh=$(weekday_zh "$wnum")
      md=$(echo "$day" | awk -F- '{printf "%d/%d", $2+0, $3+0}')
      echo "$idx) $md（$wzh）（整天）  $summary"
    fi
    idx=$((idx+1))
  done <<< "$lines_to_show"
fi

echo
echo "【待辦事項（Google Tasks）】"
fetch_tasks_lines
