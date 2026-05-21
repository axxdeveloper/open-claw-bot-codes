#!/usr/bin/env bash
set -euo pipefail

REPO="/Users/openclaw-user/.openclaw/workspace/shooeugenesea.github.io"
TODAY="$(TZ=Asia/Taipei date +%Y-%m-%d)"
TODAY_COMPACT="$(TZ=Asia/Taipei date +%Y%m%d)"
REPORT_PATH="reports/macro-post-research/${TODAY}.md"
BRANCH_NAME="research/macro-post-${TODAY_COMPACT}"

CODEX_RUNTIME_HOME="${OPENCLAW_CODEX_RUNTIME_HOME:-/Users/openclaw-user}"
export HOME="$CODEX_RUNTIME_HOME"
export CODEX_HOME="${OPENCLAW_CODEX_HOME:-$CODEX_RUNTIME_HOME/.codex}"
OPENCLAW_CODEX_MODEL="${OPENCLAW_CODEX_MODEL:-openai-codex/gpt-5.5}"
OPENCLAW_CODEX_THINKING="${OPENCLAW_CODEX_THINKING:-xhigh}"

run_with_keepalive() {
  local pid="$1"
  local label="$2"

  while kill -0 "$pid" >/dev/null 2>&1; do
    sleep 45
    if kill -0 "$pid" >/dev/null 2>&1; then
      echo "[keepalive] ${label} still running ($(TZ=Asia/Taipei date '+%H:%M:%S'))" >&2
    fi
  done

  wait "$pid"
}

run_codex_cli_with_keepalive() {
  local prompt_file="$1"
  local out_file="$2"
  local log_file="$3"
  local label="$4"

  local codex_model="${OPENCLAW_CODEX_MODEL##*/}"

  CODEX_HOME="$CODEX_HOME" \
  HOME="$HOME" \
  codex exec \
    -m "$codex_model" \
    -c model_reasoning_effort='"xhigh"' \
    --dangerously-bypass-approvals-and-sandbox \
    -o "$out_file" \
    "$(cat "$prompt_file")" >"$log_file" 2>&1 &
  local pid=$!

  run_with_keepalive "$pid" "$label"
}

run_openclaw_agent_with_keepalive() {
  local prompt_file="$1"
  local out_file="$2"
  local log_file="$3"
  local label="$4"
  local safe_label
  safe_label="$(printf '%s' "$label" | tr -cs '[:alnum:]' '-')"
  local session_id="macro-post-${TODAY_COMPACT}-${safe_label}-$$-${RANDOM:-0}"

  openclaw agent \
    --session-id "$session_id" \
    --model "$OPENCLAW_CODEX_MODEL" \
    --thinking "$OPENCLAW_CODEX_THINKING" \
    --timeout "${OPENCLAW_AGENT_TIMEOUT_SECONDS:-3600}" \
    --message "$(cat "$prompt_file")" \
    --json >"$log_file" 2>&1 &
  local pid=$!

  run_with_keepalive "$pid" "$label"

  python3 - "$log_file" "$out_file" <<'PY'
import json
import sys

log_path, out_path = sys.argv[1:3]
raw = open(log_path, encoding="utf-8").read()
decoder = json.JSONDecoder()
objects = []
i = 0

while i < len(raw):
    if raw[i] != "{":
        i += 1
        continue
    try:
        obj, end = decoder.raw_decode(raw[i:])
    except json.JSONDecodeError:
        i += 1
        continue
    objects.append(obj)
    i += end

if not objects:
    raise SystemExit("openclaw agent did not return JSON")

result = objects[-1]
if result.get("status") != "ok":
    raise SystemExit(result.get("summary") or result.get("error") or "openclaw agent failed")

payload = result.get("result") or {}
meta = payload.get("meta") or {}
text = meta.get("finalAssistantVisibleText") or meta.get("finalAssistantRawText") or ""
if not text:
    texts = [
        item.get("text", "")
        for item in payload.get("payloads", [])
        if isinstance(item, dict) and item.get("text")
    ]
    text = "\n".join(texts)

if not text.strip():
    raise SystemExit("openclaw agent returned an empty reply")

with open(out_path, "w", encoding="utf-8") as f:
    f.write(text)
    if not text.endswith("\n"):
        f.write("\n")
PY
}

run_codex_with_keepalive() {
  local prompt_file="$1"
  local out_file="$2"
  local log_file="$3"
  local label="$4"
  local primary_log
  primary_log="$(mktemp)"
  local fallback_log
  fallback_log="$(mktemp)"

  if run_codex_cli_with_keepalive "$prompt_file" "$out_file" "$primary_log" "$label"; then
    cat "$primary_log" >"$log_file"
    rm -f "$primary_log" "$fallback_log"
    return 0
  fi

  cat "$primary_log" >"$log_file"

  if rg -qi '401 Unauthorized|missing bearer/basic authentication header' "$primary_log"; then
    {
      echo
      echo "[fallback] codex exec auth failure detected; retrying with openclaw agent"
    } >>"$log_file"
    if run_openclaw_agent_with_keepalive "$prompt_file" "$out_file" "$fallback_log" "$label"; then
      cat "$fallback_log" >>"$log_file"
      rm -f "$primary_log" "$fallback_log"
      return 0
    fi
    local status=$?
    cat "$fallback_log" >>"$log_file"
    rm -f "$primary_log" "$fallback_log"
    return "$status"
  fi

  rm -f "$primary_log" "$fallback_log"
  return 1
}

cd "$REPO"

PHASE1_PROMPT_FILE="$(mktemp)"
PHASE1_OUT="$(mktemp)"
PHASE1_LOG="$(mktemp)"

cat >"$PHASE1_PROMPT_FILE" <<EOF
到 $REPO 內執行每日 macro-post 深度研究（使用 .codex/skills/macro-post/SKILL.md 為規範）。

這一階段只做內容，不做 git/pr：
1) 讀取 .codex/skills/macro-post/SKILL.md
2) 讀取 .codex/skills/macro-post-improvement/SKILL.md（若存在）
3) 產生深入選題與研究報告，寫入 reports/macro-post-research/$(TZ=Asia/Taipei date +%Y-%m-%d).md
4) 依研究結論產出一篇可發佈 macro 文章到 _posts/

語氣硬限制（必須遵守）：
- 全文使用正面直述句（主詞 + 動詞 + 結果）。
- 禁用流程旁白與模板語。
- 禁用反面敘述句型。
- 直接進內容，不描述作者接下來要做什麼。

禁用句型（任一出現即重寫）：
- 這篇要講… / 本文將… / 我會先… / 接下來… / 下圖只回答一件事… / 分水嶺 / 重點在… / 這段重點… / 關鍵是… / 最重要的是…
- 不是…而是… / 不只…更… / 同一…不同…
- 以反問句重述主題（例如「…嗎？」但未提供新資訊）

完成後只輸出以下格式：
REPORT_PATH=<path>
POST_PATH=<path>
SUMMARY:
- <人話結論1>
- <人話結論2>
- <人話結論3>
EOF

if ! run_codex_with_keepalive "$PHASE1_PROMPT_FILE" "$PHASE1_OUT" "$PHASE1_LOG" "macro-post phase1"; then
  echo "macro-post 每日研究執行失敗"
  tail -n 120 "$PHASE1_LOG"
  exit 1
fi

REPORT_PATH_FROM_PHASE1="$(grep '^REPORT_PATH=' "$PHASE1_OUT" | tail -n1 | cut -d'=' -f2-)"
POST_PATH_FROM_PHASE1="$(grep '^POST_PATH=' "$PHASE1_OUT" | tail -n1 | cut -d'=' -f2-)"

if [[ -z "${REPORT_PATH_FROM_PHASE1:-}" ]]; then
  REPORT_PATH_FROM_PHASE1="$REPORT_PATH"
fi

if [[ -z "${POST_PATH_FROM_PHASE1:-}" ]]; then
  POST_PATH_FROM_PHASE1="$(ls -1t _posts/${TODAY}-*.md 2>/dev/null | head -n1 || true)"
fi

if [[ -z "${POST_PATH_FROM_PHASE1:-}" || ! -f "$POST_PATH_FROM_PHASE1" ]]; then
  echo "macro-post 每日研究執行失敗"
  echo "原因：phase1 未產出可用文章檔案"
  tail -n 120 "$PHASE1_OUT"
  exit 1
fi

if [[ ! -f "$REPORT_PATH_FROM_PHASE1" ]]; then
  echo "macro-post 每日研究執行失敗"
  echo "原因：phase1 未產出可用報告檔案"
  tail -n 120 "$PHASE1_OUT"
  exit 1
fi

PHASE2_PROMPT_FILE="$(mktemp)"
PHASE2_OUT="$(mktemp)"
PHASE2_LOG="$(mktemp)"

cat >"$PHASE2_PROMPT_FILE" <<EOF
到 ${REPO} 內執行 macro-post 發佈收斂流程（不重做研究）：

已存在檔案：
- 報告：${REPORT_PATH_FROM_PHASE1}
- 文章：${POST_PATH_FROM_PHASE1}

請完成：
1) fetch origin_https，並從 origin_https/master 建立/重建分支：${BRANCH_NAME}
2) git add/commit/push；只包含上述兩個檔案，不要加入其他未追蹤檔案
3) 用 gh pr create 建 PR（base: master，head: ${BRANCH_NAME}，title: "macro-post research+publish ${TODAY}"）

最終輸出格式：
【macro-post 每日研究完成】
- PR 連結：<url 或 N/A>
- 報告檔案：${REPORT_PATH_FROM_PHASE1}
- 發佈文章檔案：${POST_PATH_FROM_PHASE1}
- 今日可用結論（3~5 點、人話）

最後一行固定輸出：執行設定：model=openai-codex/gpt-5.5｜reasoning=xhigh｜think=xhigh

只輸出最終結果，不要輸出流程中間訊息。
EOF

if ! run_codex_with_keepalive "$PHASE2_PROMPT_FILE" "$PHASE2_OUT" "$PHASE2_LOG" "macro-post phase2"; then
  echo "macro-post 每日研究執行失敗"
  echo "原因：phase2 發佈流程失敗（phase1 已完成）"
  echo "- 報告檔案：$REPORT_PATH_FROM_PHASE1"
  echo "- 發佈文章檔案：$POST_PATH_FROM_PHASE1"
  tail -n 120 "$PHASE2_LOG"
  exit 1
fi

cat "$PHASE2_OUT"
