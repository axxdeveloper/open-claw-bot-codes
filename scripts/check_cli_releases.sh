#!/usr/bin/env bash
set -euo pipefail

STATE_FILE="/Users/openclaw-user/.openclaw/workspace/memory/cli-release-watch.json"
mkdir -p "$(dirname "$STATE_FILE")"

npm_latest() {
  local pkg="$1"
  npm view "$pkg" version 2>/dev/null || echo "unknown"
}

installed_ver() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "not-installed"
    return
  fi
  case "$cmd" in
    codex)
      codex --version 2>/dev/null | awk '{print $NF}' | head -n1 || echo "unknown"
      ;;
    claude)
      claude --version 2>/dev/null | head -n1 | awk '{print $NF}' || echo "unknown"
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

codex_latest="$(npm_latest "@openai/codex")"
claude_latest="$(npm_latest "@anthropic-ai/claude-code")"

codex_installed="$(installed_ver codex)"
claude_installed="$(installed_ver claude)"

prev_codex=""
prev_claude=""
if [[ -f "$STATE_FILE" ]]; then
  prev_codex="$(sed -n 's/.*"codex_latest"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$STATE_FILE" | head -n1 || true)"
  prev_claude="$(sed -n 's/.*"claude_latest"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$STATE_FILE" | head -n1 || true)"
fi

changed=0
[[ "$codex_latest" != "$prev_codex" ]] && changed=1
[[ "$claude_latest" != "$prev_claude" ]] && changed=1

cat > "$STATE_FILE" <<JSON
{
  "updatedAt": "$(TZ=Asia/Taipei date '+%Y-%m-%dT%H:%M:%S%z')",
  "codex_latest": "$codex_latest",
  "claude_latest": "$claude_latest"
}
JSON

if [[ "$changed" -eq 0 ]]; then
  echo "NO_REPLY"
  exit 0
fi

echo "【CLI Release 更新通知】$(TZ=Asia/Taipei date '+%Y-%m-%d %H:%M')（Asia/Taipei）"
echo "- Codex 最新：${codex_latest}（目前：${codex_installed}）"
echo "- Claude Code 最新：${claude_latest}（目前：${claude_installed}）"
echo ""
echo "建議更新指令："
echo "- Codex：npm -g install @openai/codex@latest"
echo "- Claude Code：npm -g install @anthropic-ai/claude-code@latest"
