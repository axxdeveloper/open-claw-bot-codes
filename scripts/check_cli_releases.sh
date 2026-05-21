#!/usr/bin/env bash
set -euo pipefail

cd /Users/openclaw-user/.openclaw/workspace
exec python3 scripts/check_runtime_upgrades.py "$@"
