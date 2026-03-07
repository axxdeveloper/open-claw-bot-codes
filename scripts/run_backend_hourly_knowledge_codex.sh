#!/usr/bin/env bash
set -euo pipefail

SKILL="/Users/openclaw-user/.openclaw/workspace/skills/backend-hourly-knowledge/SKILL.md"
REPO="/Users/openclaw-user/.openclaw/workspace"

read -r -d '' PROMPT <<EOF || true
先讀取：${SKILL}

依 skill 規範產出一則每小時後端知識摘要。
要求：
- 先看懂名詞（3-6 個）
- 優先近期熱門/重要文章；若沒有就做 evergreen 精煉
- 至少 2 條連結，至少 1 條官方/primary source
- 繁體中文（台灣）
- 最後一行固定輸出：執行設定：model=openai-codex/gpt-5.4｜reasoning=xhigh｜think=xhigh

只輸出最終內容，不要輸出流程說明。
EOF

OUT_FILE="$(mktemp)"
LOG_FILE="$(mktemp)"

cd "$REPO"
if ! codex exec -m gpt-5.4 -c model_reasoning_effort='"xhigh"' -s read-only -o "$OUT_FILE" "$PROMPT" >"$LOG_FILE" 2>&1; then
  echo "backend knowledge 生成失敗"
  tail -n 80 "$LOG_FILE"
  exit 1
fi

cat "$OUT_FILE"
