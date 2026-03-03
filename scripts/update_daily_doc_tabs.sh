#!/usr/bin/env bash
set -euo pipefail

DOC_ID="1mzXODGSERSuNMUPDeLhleoTNYgOZitpJpLYkUklb9YM"
TZ_NAME="Asia/Taipei"
BASE="/Users/openclaw-user/.openclaw/workspace"
NEW_REPO="$BASE/open-claw-bot-codes"

TMP_DIR="${TMPDIR:-/tmp}/doc_tabs_update"
mkdir -p "$TMP_DIR"

FROM="$(TZ=$TZ_NAME date '+%Y-%m-%dT00:00:00+08:00')"
TO="$(TZ=$TZ_NAME date -v+30d '+%Y-%m-%dT23:59:59+08:00')"
NOW="$(TZ=$TZ_NAME date '+%Y-%m-%d %H:%M (%Z)')"

# 1) 最近行程（未來30天）
CAL_JSON="$TMP_DIR/recent_calendar_30d_future.json"
gog calendar events primary --from "$FROM" --to "$TO" --json --no-input > "$CAL_JSON"

python3 - "$CAL_JSON" <<'PY' > "$TMP_DIR/doc_recent_schedule.txt"
import json
import sys

p = sys.argv[1]
with open(p, "r", encoding="utf-8") as f:
    j = json.load(f)
items = j.get('events') or j.get('items') or []

def key(ev):
    s = ev.get('start') or {}
    return s.get('dateTime') or s.get('date') or ''

items = sorted(items, key=key)
print('【最近行程（未來 30 天）】')
print('資料來源：Google Calendar（primary）')
print(f'共 {len(items)} 筆')
print()
for i, e in enumerate(items[:20], 1):
    s = (e.get('start') or {}).get('dateTime') or (e.get('start') or {}).get('date') or ''
    t = e.get('summary') or '(無標題)'
    print(f'{i}) {s}｜{t}')
PY

# 2) AI 新聞（沿用既有輸出）
"$BASE/scripts/ai_blog_digest.sh" 10 > "$TMP_DIR/ai_raw.txt"
cat > "$TMP_DIR/doc_ai_news.txt" <<TXT
【AI 新聞（精選）】
更新時間：$NOW

$(sed -n '1,260p' "$TMP_DIR/ai_raw.txt")
TXT

# 3) 市場資料
"$BASE/scripts/market_brief_data.sh" us > "$TMP_DIR/us_raw.txt"
"$BASE/scripts/market_brief_data.sh" tw > "$TMP_DIR/tw_raw.txt"
cat > "$TMP_DIR/doc_us_stock.txt" <<TXT
【美股晨報（基本面導向）】
資料時間：$NOW
資料來源主體：scripts/market_brief_data.sh us

$(sed -n '1,260p' "$TMP_DIR/us_raw.txt")
TXT
cat > "$TMP_DIR/doc_tw_stock.txt" <<TXT
【台股晨報（基本面導向）】
資料時間：$NOW
資料來源主體：scripts/market_brief_data.sh tw

$(sed -n '1,260p' "$TMP_DIR/tw_raw.txt")
TXT

# 4) 呼叫新 repo 腳本更新四 tab
python3 "$NEW_REPO/scripts/google_docs_update_four_tabs.py" \
  --doc-id "$DOC_ID" \
  --recent-file "$TMP_DIR/doc_recent_schedule.txt" \
  --ai-news-file "$TMP_DIR/doc_ai_news.txt" \
  --us-stock-file "$TMP_DIR/doc_us_stock.txt" \
  --tw-stock-file "$TMP_DIR/doc_tw_stock.txt" \
  --mode replace > "$TMP_DIR/update_result.json"

cat "$TMP_DIR/update_result.json"
