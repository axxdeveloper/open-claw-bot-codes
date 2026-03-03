#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_FILE="$ROOT_DIR/.claude/skills/macro-post/SKILL.md"
CODEX_HOME_DIR="$ROOT_DIR/.codex"
DEST_DIR="$CODEX_HOME_DIR/skills/macro-post"
DEST_FILE="$DEST_DIR/SKILL.md"

if [[ ! -f "$SRC_FILE" ]]; then
  echo "Source skill file not found: $SRC_FILE" >&2
  exit 1
fi

mkdir -p "$CODEX_HOME_DIR/skills"
rm -rf "$DEST_DIR"
mkdir -p "$DEST_DIR"
cp "$SRC_FILE" "$DEST_FILE"

# Keep document body identical to source and only normalize top frontmatter.
tmp="$(mktemp)"
awk '
NR==1 && $0=="---" {
  print
  print "name: macro-post"
  in_fm=1
  next
}
in_fm {
  if ($0=="---") {
    print
    in_fm=0
    next
  }
  if ($0 ~ /^name:[[:space:]]*/) next
  if ($0 ~ /^description:[[:space:]]*/) {
    desc=$0
    sub(/^description:[[:space:]]*/, "", desc)
    gsub(/\\/, "\\\\", desc)
    gsub(/"/, "\\\"", desc)
    print "description: \"" desc "\""
    next
  }
  print
  next
}
{ print }
' "$DEST_FILE" > "$tmp"
mv "$tmp" "$DEST_FILE"

echo "Synced macro-post skill to: $DEST_FILE"
