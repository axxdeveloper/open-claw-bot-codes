#!/usr/bin/env bash
set -euo pipefail

TZ_NAME="Asia/Taipei"
ACC="${GOG_ACCOUNT:-shooeugenesea.tw@gmail.com}"
FROM_TS="$(TZ=$TZ_NAME date '+%Y-%m-%dT%H:%M:%S')"
TO_TS="$(TZ=$TZ_NAME date -v+1d '+%Y-%m-%dT%H:%M:%S')"

if ! command -v gog >/dev/null 2>&1; then
  echo "[ALERT] gog 指令不存在，無法檢查 Google Calendar token。"
  exit 0
fi

set +e
OUT="$(gog calendar events primary --account "$ACC" --from "$FROM_TS" --to "$TO_TS" --no-input 2>&1)"
RC=$?
set -e

if [[ $RC -eq 0 ]]; then
  echo "OK"
  exit 0
fi

ERR="$(echo "$OUT" | tr '\n' ' ')"

if echo "$ERR" | grep -qi "invalid_grant"; then
  echo "[ALERT] Google OAuth token 已失效（invalid_grant）。請重新授權 gog auth add ${ACC} --services calendar,tasks"
  exit 0
fi

if echo "$ERR" | grep -qi "KeyUnwrap\|integrity check failed"; then
  echo "[ALERT] gog keyring/token 可能損壞（KeyUnwrap）。建議刪除舊 token 後重新授權。"
  exit 0
fi

if echo "$ERR" | grep -qi "No tokens stored"; then
  echo "[ALERT] gog 無可用 token。請重新授權 gog auth add ${ACC} --services calendar,tasks"
  exit 0
fi

if echo "$ERR" | grep -qi "no TTY available for keyring"; then
  echo "[ALERT] keyring 尚未解鎖（no TTY available for keyring）。請在本機先執行一次 gog auth list 解鎖。"
  exit 0
fi

echo "[ALERT] Google Calendar token healthcheck 失敗：${ERR}"
