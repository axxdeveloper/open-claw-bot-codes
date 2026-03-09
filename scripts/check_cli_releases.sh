#!/usr/bin/env bash
set -euo pipefail

STATE_FILE="/Users/openclaw-user/.openclaw/workspace/memory/cli-release-watch.json"
mkdir -p "$(dirname "$STATE_FILE")"

npm_tag_version() {
  local pkg="$1"
  local tag="$2"
  local v
  v="$(npm view "$pkg" "dist-tags.${tag}" 2>/dev/null || true)"
  if [[ -z "${v}" ]]; then
    echo "unknown"
  else
    echo "$v"
  fi
}

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

codex_stable="$(npm_tag_version "@openai/codex" latest)"
claude_stable="$(npm_tag_version "@anthropic-ai/claude-code" latest)"
codex_next="$(npm_tag_version "@openai/codex" next)"
claude_next="$(npm_tag_version "@anthropic-ai/claude-code" next)"

codex_installed="$(installed_ver codex)"
claude_installed="$(installed_ver claude)"

prev_codex_stable=""
prev_claude_stable=""
if [[ -f "$STATE_FILE" ]]; then
  prev_codex_stable="$(sed -n 's/.*"codex_stable"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$STATE_FILE" | head -n1 || true)"
  prev_claude_stable="$(sed -n 's/.*"claude_stable"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$STATE_FILE" | head -n1 || true)"
fi

changed=0
[[ "$codex_stable" != "$prev_codex_stable" ]] && changed=1
[[ "$claude_stable" != "$prev_claude_stable" ]] && changed=1

cat > "$STATE_FILE" <<JSON
{
  "updatedAt": "$(TZ=Asia/Taipei date '+%Y-%m-%dT%H:%M:%S%z')",
  "codex_stable": "$codex_stable",
  "claude_stable": "$claude_stable",
  "codex_next": "$codex_next",
  "claude_next": "$claude_next"
}
JSON

if [[ "$changed" -eq 0 ]]; then
  echo "NO_REPLY"
  exit 0
fi

echo "【CLI Release 更新通知（Stable）】$(TZ=Asia/Taipei date '+%Y-%m-%d %H:%M')（Asia/Taipei）"
echo "- Codex stable：${codex_stable}（目前：${codex_installed}）"
echo "- Claude Code stable：${claude_stable}（目前：${claude_installed}）"
if [[ "$codex_next" != "unknown" || "$claude_next" != "unknown" ]]; then
  echo ""
  echo "參考（preview/next）："
  [[ "$codex_next" != "unknown" ]] && echo "- Codex next：${codex_next}"
  [[ "$claude_next" != "unknown" ]] && echo "- Claude Code next：${claude_next}"
fi

echo ""
echo "建議更新指令（stable）："
echo "- Codex：npm -g install @openai/codex@latest"
echo "- Claude Code：npm -g install @anthropic-ai/claude-code@latest"
