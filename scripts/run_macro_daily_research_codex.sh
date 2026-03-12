#!/usr/bin/env bash
set -euo pipefail

REPO="/Users/openclaw-user/.openclaw/workspace/shooeugenesea.github.io"

read -r -d '' PROMPT <<'EOF' || true
到 repo 內執行每日 macro-post 深度研究（使用 .codex/skills/macro-post/SKILL.md 為規範），並完成：

1) 讀取 .codex/skills/macro-post/SKILL.md
2) 讀取 .codex/skills/macro-post-improvement/SKILL.md（若存在）
3) 產生深入選題與研究報告，寫入 reports/macro-post-research/$(TZ=Asia/Taipei date +%Y-%m-%d).md
4) 依研究結論另外產出一篇「可直接發佈」的 macro 文章到 _posts/（檔名與 front matter 需符合 Jekyll 與 macro-post 規範）
5) 建立分支 research/macro-post-$(TZ=Asia/Taipei date +%Y%m%d)
6) git add/commit/push
7) 用 gh pr create 建 PR（title: "macro-post research+publish $(TZ=Asia/Taipei date +%Y-%m-%d)"）
8) 將報告全文同步寫入 Google Doc：
   - script: /Users/openclaw-user/.openclaw/workspace/open-claw-bot-codes/scripts/google_docs_tab_write.py
   - doc id: 1mzXODGSERSuNMUPDeLhleoTNYgOZitpJpLYkUklb9YM
   - tab title: 研究報告
   - mode: replace

新增研究要求：
- 加入「macro-post 改進建議（風格/來源/結構）」至少 3 點
- 加入「重大事件覆蓋檢查」小節（地緣衝突、金融事故與取捨）

文章產出要求（新增）：
- 必須是可上站版本（完整 front matter + 內文 + 來源）
- 寫入 _posts/ 後要一起納入同一個 commit 與 PR
- 若當日最適合修正文，則產出修正文（macro_kind: correction）

最終輸出格式：
【macro-post 每日研究完成】
- PR 連結：<url 或 N/A>
- 報告檔案：<path>
- 發佈文章檔案：<path>
- Google Doc：tab「研究報告」已更新（doc: 1mzXODGSERSuNMUPDeLhleoTNYgOZitpJpLYkUklb9YM, mode=replace）
- 今日可用結論（3~5 點、人話）

最後一行固定輸出：執行設定：model=openai-codex/gpt-5.4｜reasoning=xhigh｜think=xhigh

只輸出最終結果，不要輸出流程中間訊息。
EOF

OUT_FILE="$(mktemp)"
LOG_FILE="$(mktemp)"

cd "$REPO"
if ! codex exec -m gpt-5.4 -c model_reasoning_effort='"xhigh"' --dangerously-bypass-approvals-and-sandbox -o "$OUT_FILE" "$PROMPT" >"$LOG_FILE" 2>&1; then
  echo "macro-post 每日研究執行失敗"
  tail -n 120 "$LOG_FILE"
  exit 1
fi

cat "$OUT_FILE"
