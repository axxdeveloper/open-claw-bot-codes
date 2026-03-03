#!/usr/bin/env bash
set -euo pipefail

TODO_FILE="/Users/openclaw-user/.openclaw/workspace/TODO.md"
NOW="$(TZ=Asia/Taipei date '+%Y-%m-%d %H:%M')"

if [[ ! -f "$TODO_FILE" ]]; then
  echo "【待辦提醒】找不到 TODO.md。"
  exit 0
fi

echo "【06:00 行程預告】$NOW (Asia/Taipei)"

awk '
BEGIN { in_active=0; idx=0; task=""; due="" }

function flush_task() {
  if (task != "") {
    idx++
    printf "%d) %s\n", idx, task
    if (due != "") printf "   - %s\n", due
  }
  task=""; due=""
}

/^## Active/ { in_active=1; next }
/^## Waiting/ { if (in_active) { flush_task(); in_active=0 } }

in_active {
  if ($0 ~ /^- \[ \] /) {
    flush_task()
    task=$0
    sub(/^- \[ \] /, "", task)
    next
  }
  if ($0 ~ /^  - 截止：/) {
    due=$0
    sub(/^  - /, "", due)
    next
  }

}

END {
  if (in_active) flush_task()
  if (idx==0) print "今天沒有待辦。"
}
' "$TODO_FILE"
