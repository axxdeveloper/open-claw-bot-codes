#!/usr/bin/env bash
set -euo pipefail

MAX_ITEMS="${1:-6}"
CUTOFF_DAYS="${CUTOFF_DAYS:-21}"
CUTOFF_DATE="$(date -v-"${CUTOFF_DAYS}"d +%Y-%m-%d)"

# AI/engineering-focused keyword filter
keywords='ai|llm|agent|model|inference|training|gpu|cuda|pytorch|transformer|embedding|retriev|rag|vector|semiconductor|chip|compiler|distributed|serving|ml|machine learning|engineering|infra|platform|recommendation|data center|latency|benchmark'

parse_articles() {
  local mode="$1" # new|all
  local raw

  if [[ "$mode" == "new" ]]; then
    raw="$(blogwatcher articles 2>/dev/null || true)"
    awk '
      BEGIN{ id=""; title=""; blog=""; url=""; pub="" }
      /^  \[[0-9]+\] \[new\] / {
        if (id != "") printf "%s\t%s\t%s\t%s\t%s\n", id, title, blog, url, pub
        line=$0
        sub(/^  \[/, "", line)
        id=line; sub(/\].*$/, "", id)
        title=line; sub(/^[0-9]+\] \[new\] /, "", title)
        blog=""; url=""; pub=""
        next
      }
      /^       Blog: / { blog=substr($0, 14); next }
      /^       URL: / { url=substr($0, 13); next }
      /^       Published: / { pub=substr($0, 19); next }
      END{ if (id != "") printf "%s\t%s\t%s\t%s\t%s\n", id, title, blog, url, pub }
    ' <<< "$raw" | sed '/^[[:space:]]*$/d'
  else
    raw="$(blogwatcher articles --all 2>/dev/null || true)"
    awk '
      BEGIN{ id=""; title=""; blog=""; url=""; pub="" }
      /^  \[[0-9]+\] \[(new|read)\] / {
        if (id != "") printf "%s\t%s\t%s\t%s\t%s\n", id, title, blog, url, pub
        line=$0
        sub(/^  \[/, "", line)
        id=line; sub(/\].*$/, "", id)
        title=line; sub(/^[0-9]+\] \[(new|read)\] /, "", title)
        blog=""; url=""; pub=""
        next
      }
      /^       Blog: / { blog=substr($0, 14); next }
      /^       URL: / { url=substr($0, 13); next }
      /^       Published: / { pub=substr($0, 19); next }
      END{ if (id != "") printf "%s\t%s\t%s\t%s\t%s\n", id, title, blog, url, pub }
    ' <<< "$raw" | sed '/^[[:space:]]*$/d'
  fi
}

filter_ai() {
  awk -F '\t' -v kw="$keywords" -v cutoff="$CUTOFF_DATE" '
    {
      text=tolower($2 " " $3)
      pub=$5
      if (text ~ kw && pub >= cutoff) print $0
    }
  '
}

blogwatcher scan --silent >/dev/null 2>&1 || true

parsed_new="$(parse_articles new)"
filtered_new="$(filter_ai <<< "$parsed_new" | head -n "$MAX_ITEMS")"

if [[ -n "${filtered_new// /}" ]]; then
  echo "【AI 工程晨報】今日新文章（$(TZ=Asia/Taipei date '+%Y-%m-%d %H:%M (Asia/Taipei)')）"
  payload="$filtered_new"
else
  parsed_all="$(parse_articles all)"
  filtered_all="$(filter_ai <<< "$parsed_all" | sort -t$'\t' -k5,5r | head -n "$MAX_ITEMS")"

  if [[ -z "${filtered_all// /}" ]]; then
    echo "【AI 工程晨報】今天沒有符合條件的工程向 AI 文章。"
    exit 0
  fi

  echo "【AI 工程晨報】今天沒有新文，改送近 ${CUTOFF_DAYS} 天精選（$(TZ=Asia/Taipei date '+%Y-%m-%d %H:%M (Asia/Taipei)')）"
  payload="$filtered_all"
fi

i=1
while IFS=$'\t' read -r id title blog url pub; do
  [[ -z "$id" ]] && continue
  echo "$i) $title"
  echo "   - 來源：$blog"
  echo "   - 日期：$pub"
  echo "   - 連結：$url"
  i=$((i+1))
done <<< "$payload"
