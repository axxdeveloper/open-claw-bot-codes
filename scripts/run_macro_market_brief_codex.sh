#!/usr/bin/env bash
set -euo pipefail

MARKET="${1:-}"
REPO="/Users/openclaw-user/.openclaw/workspace/shooeugenesea.github.io"
DATA_SCRIPT="/Users/openclaw-user/.openclaw/workspace/scripts/market_brief_data.sh"

CODEX_RUNTIME_HOME="${OPENCLAW_CODEX_RUNTIME_HOME:-/Users/openclaw-user}"
export HOME="$CODEX_RUNTIME_HOME"
export CODEX_HOME="${OPENCLAW_CODEX_HOME:-$CODEX_RUNTIME_HOME/.codex}"

if [[ "$MARKET" != "tw" && "$MARKET" != "us" ]]; then
  echo "用法：run_macro_market_brief_codex.sh <tw|us>"
  exit 1
fi

if [[ "$MARKET" == "tw" ]]; then
  HOLDINGS="0050"
else
  HOLDINGS="QQQ、VT、VTI、VGSH、VGIT"
fi

run_with_keepalive() {
  local cmd="$1"
  local out_file="$2"
  local log_file="$3"
  local label="$4"

  bash -lc "$cmd" >"$out_file" 2>"$log_file" &
  local pid=$!

  while kill -0 "$pid" >/dev/null 2>&1; do
    sleep 45
    if kill -0 "$pid" >/dev/null 2>&1; then
      echo "[keepalive] ${label} still running ($(TZ=Asia/Taipei date '+%H:%M:%S'))" >&2
    fi
  done

  wait "$pid"
}

cd "$REPO"

# Phase 1: collect market data outside codex (deterministic step)
DATA_FILE="$(mktemp)"
DATA_LOG="$(mktemp)"
if ! run_with_keepalive "$DATA_SCRIPT $MARKET" "$DATA_FILE" "$DATA_LOG" "market-brief data"; then
  echo "market brief 生成失敗"
  echo "原因：資料蒐集階段失敗"
  tail -n 120 "$DATA_LOG"
  exit 1
fi

# Phase 2: codex drafting with keepalive
PROMPT_FILE="$(mktemp)"
OUT_FILE="$(mktemp)"
LOG_FILE="$(mktemp)"

cat >"$PROMPT_FILE" <<EOF
到 repo 內依照 .codex/skills/macro-post/SKILL.md 的 Market-close brief mode（盤後經濟摘要）產出內容。

先讀取：
1) .codex/skills/macro-post/SKILL.md
2) 下方已提供的市場資料快照（不要再執行 shell）

市場資料快照（來源：$DATA_SCRIPT $MARKET）：
-----DATA-BEGIN-----
$(cat "$DATA_FILE")
-----DATA-END-----

要求：
- 繁體中文（台灣），平鋪直述，條列優先。
- 不得使用技術分析術語（均線、KD、RSI、MACD、布林通道、黃金交叉等）。
- 風格改成「正面表列 + 直白判讀」。
- 開頭 2-4 句先講今天最重要判斷。
- 開頭禁止使用「不是…而是…」反轉句型；改用正向直述句。
- 接著用 3-6 個條列穿插關鍵數字。
- 再寫資金面與槓桿判讀（含 [CAPITAL_FLOW] + [MARGIN_BALANCE]）。
- 再寫持股觀察（固定包含：$HOLDINGS）。
- 最後用 2-3 條「接下來看什麼」收尾。
- 必須至少提出：2 條跨市場因果鏈、1 個反直覺或容易被忽略的重點。
- 若資料不足，明確標示「資料暫缺」，不得臆測。
- 資料口徑/資料暫缺聲明放在文末來源上方，使用引用格式（> 資料口徑：...）。
- 最後附來源連結至少 3 條。
- 最後一行固定輸出：執行設定：model=openai-codex/gpt-5.5｜reasoning=xhigh｜think=xhigh

只輸出最終摘要內容，不要輸出流程說明。
EOF

CODEX_CMD="cd '$REPO' && codex exec -m gpt-5.5 -c model_reasoning_effort='\"xhigh\"' -s read-only -o '$OUT_FILE' \"\$(cat '$PROMPT_FILE')\""
if ! run_with_keepalive "$CODEX_CMD" /dev/null "$LOG_FILE" "market-brief codex"; then
  echo "market brief 生成失敗"
  tail -n 120 "$LOG_FILE"
  exit 1
fi

cat "$OUT_FILE"
