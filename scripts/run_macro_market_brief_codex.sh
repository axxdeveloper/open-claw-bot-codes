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
- 繁體中文（台灣），平鋪直述，條列優先。
- 不得使用技術分析術語（均線、KD、RSI、MACD、布林通道、黃金交叉等）。
- 風格改成「正面表列 + 直白判讀」：
  - 少模板腔，不要用「核心概念/問題背景/運作模型/關鍵取捨」這種固定章節名。
  - 先講結論，再列數字與驗證點。
  - 每段用短句，避免大段抽象名詞堆疊。
- 不要使用「1) 今日結論 / 2) 關鍵數字」這種報告式標籤。
- 改用自然段落 + 少量條列：
  - 開頭 2-4 句先講今天最重要判斷（像主編口吻，不像模板）。
  - 開頭禁止使用「不是…而是…」反轉句型；改用正向直述句（例：『今天主軸是…』『市場現在在交易…』）。
  - 接著用 3-6 個條列穿插關鍵數字（前值/現值或預期/實際對比）
  - 再寫資金面與槓桿判讀（含 [CAPITAL_FLOW] + [MARGIN_BALANCE]）
  - 再寫持股觀察（固定包含：${HOLDINGS}）
  - 最後用 2-3 條「接下來看什麼」收尾
- [MARGIN_BALANCE] 使用規則：
  - 台股：引用融資餘額交易單位 + 融資餘額金額
  - 美股：引用 FINRA 客戶融資借款最近月份 + MoM
- [CAPITAL_FLOW] 使用規則：
  - 台股：外資/投信/自營商/三大法人買賣差額
  - 美股：SPY/QQQ/IWM/XLK/XLE/XLF 的日漲跌與成交量變化 proxy
  - 若資料不足，明確標示「資料暫缺」，不得臆測
- 必須至少提出：
  - 2 條跨市場因果鏈
  - 1 個反直覺或容易被忽略的重點
- 最後附來源連結至少 3 條。
- 資料口徑/資料暫缺聲明不要放開頭；統一放在文末來源上方，使用引用格式（> 資料口徑：...）。
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
