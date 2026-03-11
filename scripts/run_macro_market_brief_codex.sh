#!/usr/bin/env bash
set -euo pipefail

MARKET="${1:-}"
REPO="/Users/openclaw-user/.openclaw/workspace/shooeugenesea.github.io"

if [[ "$MARKET" != "tw" && "$MARKET" != "us" ]]; then
  echo "用法：run_macro_market_brief_codex.sh <tw|us>"
  exit 1
fi

if [[ "$MARKET" == "tw" ]]; then
  HOLDINGS="0050、中鋼"
else
  HOLDINGS="QQQ、VT、VTI、VGSH、VGIT"
fi

read -r -d '' PROMPT <<EOF || true
到 repo 內依照 .codex/skills/macro-post/SKILL.md 的 Market-close brief mode（盤後經濟摘要）產出內容。

必要步驟：
1) 先讀取 .codex/skills/macro-post/SKILL.md
2) 先執行 /Users/openclaw-user/.openclaw/workspace/scripts/market_brief_data.sh ${MARKET}

要求：
- 繁體中文（台灣）
- 不得使用技術分析術語
- 持股觀察固定包含：${HOLDINGS}
- 必須新增「融資餘額觀察」段落：
  - 台股：引用 market_brief_data.sh 的 [MARGIN_BALANCE]（融資餘額交易單位 + 融資餘額金額）
  - 美股：引用 market_brief_data.sh 的 [MARGIN_BALANCE]（FINRA 客戶融資借款最近月份 + MoM）
- 最後附來源連結至少 3 條
- 必須包含「先看懂名詞（3-6 個）」放在開頭
- 最後一行固定輸出：執行設定：model=openai-codex/gpt-5.4｜reasoning=xhigh｜think=xhigh

只輸出最終摘要內容，不要輸出流程說明。
EOF

OUT_FILE="$(mktemp)"
LOG_FILE="$(mktemp)"

cd "$REPO"
if ! codex exec -m gpt-5.4 -c model_reasoning_effort='"xhigh"' -s read-only -o "$OUT_FILE" "$PROMPT" >"$LOG_FILE" 2>&1; then
  echo "market brief 生成失敗"
  tail -n 80 "$LOG_FILE"
  exit 1
fi

cat "$OUT_FILE"
