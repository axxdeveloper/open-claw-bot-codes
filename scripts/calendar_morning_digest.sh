#!/usr/bin/env bash
set -euo pipefail

TZ_NAME="Asia/Taipei"
ACC="${GOG_ACCOUNT:-shooeugenesea.tw@gmail.com}"
FROM_TS="$(TZ=$TZ_NAME date '+%Y-%m-%dT00:00:00+08:00')"
TO_TS_7D="$(TZ=$TZ_NAME date -v+7d '+%Y-%m-%dT23:59:59+08:00')"
TO_TS_30D="$(TZ=$TZ_NAME date -v+30d '+%Y-%m-%dT23:59:59+08:00')"
NOW="$(TZ=$TZ_NAME date '+%Y-%m-%d %H:%M')"

if ! command -v gog >/dev/null 2>&1; then
  echo "【06:00 行程預告】$NOW ($TZ_NAME)"
  echo "找不到 gog 指令，無法讀取 Google Calendar。"
  exit 0
fi

fetch_raw() {
  local to_ts="$1"
  gog calendar events primary --account "$ACC" --from "$FROM_TS" --to "$to_ts" --no-input 2>/dev/null || true
}

extract_lines() {
  local raw="$1"
  echo "$raw" | tail -n +2 | sed '/^[[:space:]]*$/d'
}

raw_7d="$(fetch_raw "$TO_TS_7D")"
lines_7d="$(extract_lines "$raw_7d")"
count_7d="$(echo "$lines_7d" | sed '/^[[:space:]]*$/d' | wc -l | tr -d ' ')"

window_label="接下來 7 天"
lines_to_show="$lines_7d"

if [[ "${count_7d:-0}" -lt 10 ]]; then
  raw_30d="$(fetch_raw "$TO_TS_30D")"
  lines_30d="$(extract_lines "$raw_30d")"
  window_label="接下來 30 天（7 天內少於 10 筆）"
  lines_to_show="$lines_30d"
fi

echo "【06:00 行程預告】$NOW ($TZ_NAME)"

if [[ -z "${lines_to_show// /}" ]]; then
  echo "$window_label 沒有行程。"
  exit 0
fi

idx=1
while IFS= read -r line; do
  [[ -z "${line// /}" ]] && continue

  # split fixed columns: ID START END SUMMARY
  start=$(echo "$line" | awk '{print $2}')
  end=$(echo "$line" | awk '{print $3}')
  summary=$(echo "$line" | awk '{$1=$2=$3=""; sub(/^   */,""); print}')

  # all-day event if no 'T' in start
  if [[ "$start" == *"T"* ]]; then
    day=$(echo "$start" | cut -d'T' -f1)
    st=$(echo "$start" | cut -d'T' -f2 | cut -d'+' -f1 | cut -c1-5)
    et=$(echo "$end" | cut -d'T' -f2 | cut -d'+' -f1 | cut -c1-5)
    echo "$idx) $day $st-$et  $summary"
  else
    echo "$idx) $start（整天）  $summary"
  fi
  idx=$((idx+1))
done <<< "$lines_to_show"
