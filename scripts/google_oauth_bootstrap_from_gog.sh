#!/usr/bin/env bash
set -euo pipefail

ACCOUNT="${1:-${GOG_ACCOUNT:-}}"
OUT_FILE="${OPENCLAW_GOOGLE_OAUTH_FILE:-$HOME/.config/openclaw/google-oauth.json}"

if ! command -v gog >/dev/null 2>&1; then
  echo "找不到 gog 指令，無法從 gog 匯入 OAuth。" >&2
  exit 1
fi

if [[ -z "$ACCOUNT" ]]; then
  ACCOUNT="$(gog auth status --json | python3 - <<'PY'
import json,sys
j=json.load(sys.stdin)
print(((j.get('account') or {}).get('email') or '').strip())
PY
)"
fi

if [[ -z "$ACCOUNT" ]]; then
  echo "找不到 gog account email。請傳入：scripts/google_oauth_bootstrap_from_gog.sh you@gmail.com" >&2
  exit 1
fi

STATUS_JSON="$(gog auth status --json)"
CRED_PATH="$(python3 - <<'PY' "$STATUS_JSON"
import json,sys
j=json.loads(sys.argv[1])
print(((j.get('account') or {}).get('credentials_path') or '').strip())
PY
)"

if [[ -z "$CRED_PATH" || ! -f "$CRED_PATH" ]]; then
  echo "找不到 credentials_path：$CRED_PATH" >&2
  exit 1
fi

TMP_TOKEN="$(mktemp)"
gog auth tokens export "$ACCOUNT" --out "$TMP_TOKEN" --overwrite >/dev/null

mkdir -p "$(dirname "$OUT_FILE")"
python3 - <<'PY' "$CRED_PATH" "$TMP_TOKEN" "$OUT_FILE" "$ACCOUNT"
import json,sys,pathlib
cred_path,token_path,out_path,email = sys.argv[1:5]
creds=json.loads(pathlib.Path(cred_path).read_text(encoding='utf-8'))
tok=json.loads(pathlib.Path(token_path).read_text(encoding='utf-8'))
out={
  'account': email,
  'client_id': creds.get('client_id',''),
  'client_secret': creds.get('client_secret',''),
  'refresh_token': tok.get('refresh_token',''),
}
missing=[k for k in ('client_id','client_secret','refresh_token') if not out.get(k)]
if missing:
  raise SystemExit(f'缺少必要欄位: {", ".join(missing)}')
path=pathlib.Path(out_path)
path.write_text(json.dumps(out, ensure_ascii=False, indent=2)+"\n", encoding='utf-8')
print(str(path))
PY

rm -f "$TMP_TOKEN"
chmod 600 "$OUT_FILE"

echo "已產生 OAuth 設定：$OUT_FILE"
echo "之後腳本將自動 refresh access token（不再依賴 gog runtime）。"
