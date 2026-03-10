#!/usr/bin/env bash
set -euo pipefail

SKILL="/Users/openclaw-user/.openclaw/workspace/skills/backend-hourly-knowledge/SKILL.md"
REPO="/Users/openclaw-user/.openclaw/workspace"
STATE_FILE="/Users/openclaw-user/.openclaw/workspace/memory/backend-hourly-knowledge-state.tsv"
mkdir -p "$(dirname "$STATE_FILE")"

RECENT_TOPICS=""
RECENT_SHORT=""
RECENT_24H_TOPICS=""
BAN_HINTS=""
if [[ -f "$STATE_FILE" ]]; then
  RECENT_TOPICS="$(tail -n 6 "$STATE_FILE" | awk -F'\t' '{print "- "$2}' | sed '/^- $/d')"
  RECENT_SHORT="$(tail -n 3 "$STATE_FILE" | awk -F'\t' '{print tolower($2)}')"
  RECENT_24H_TOPICS="$(python3 - <<'PY'
from datetime import datetime, timedelta
p='/Users/openclaw-user/.openclaw/workspace/memory/backend-hourly-knowledge-state.tsv'
cut=datetime.now()-timedelta(hours=24)
out=[]
try:
    with open(p,'r',encoding='utf-8') as f:
        for line in f:
            if '\t' not in line: continue
            ts,topic=line.rstrip('\n').split('\t',1)
            try:
                t=datetime.strptime(ts,'%Y-%m-%d %H:%M:%S')
            except Exception:
                continue
            if t>=cut:
                out.append(topic)
except FileNotFoundError:
    pass
print('\n'.join(f'- {x}' for x in out[-20:]))
PY
)"
fi

# 如果最近 3 則重複同類主題，強制換題材
if echo "$RECENT_SHORT" | grep -q "postgresql"; then
  BAN_HINTS+="\n- 這一輪禁止再選 PostgreSQL。"
fi
if echo "$RECENT_SHORT" | grep -q "kafka"; then
  BAN_HINTS+="\n- 這一輪禁止再選 Kafka。"
fi
if echo "$RECENT_SHORT" | grep -q "vllm\|llm\|ai"; then
  BAN_HINTS+="\n- 若最近已有 AI 推理主題，這一輪優先非 AI 基礎設施主題。"
fi

read -r -d '' PROMPT <<EOF || true
先讀取：${SKILL}

依 skill 規範產出一則每小時後端知識摘要。
要求：
- 先看懂名詞（3-6 個）
- 優先近期熱門/重要文章；若沒有就做 evergreen 精煉
- 至少 2 條連結，至少 1 條官方/primary source
- 繁體中文（台灣）
- 盡量避免重複最近主題，最近主題如下：
${RECENT_TOPICS:-- 無}
- 最近 24 小時主題如下（禁止重複同核心題）：
${RECENT_24H_TOPICS:-- 無}
- 硬性規則：不要再選與最近 24 小時相同核心主題（例如 Kafka Share Groups / PostgreSQL 18.3 回歸）。
- 若主題相近，必須改成不同角度，且至少 2 條新連結。
- 額外去重限制：${BAN_HINTS:-\n- 無}
- 必須包含「語音稿（TypeScript，30-60秒，可直接朗讀）」
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

TOPIC="$(grep -E '^主題：' "$OUT_FILE" | head -n1 | sed 's/^主題：[[:space:]]*//')"
if [[ -n "$TOPIC" ]]; then
  printf '%s\t%s\n' "$(TZ=Asia/Taipei date '+%Y-%m-%d %H:%M:%S')" "$TOPIC" >> "$STATE_FILE"
  tail -n 40 "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
fi

cat "$OUT_FILE"
