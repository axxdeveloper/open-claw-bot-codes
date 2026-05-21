#!/usr/bin/env bash
set -euo pipefail

MODEL="gemma4"
NUM_PREDICT="180"
TEMPERATURE="0.2"
TIMEOUT_SEC="600"
SHOW_META="0"

usage() {
  cat <<'EOF'
Usage:
  gemma4-safe.sh [options] "your prompt"
  echo "your prompt" | gemma4-safe.sh [options]

Options:
  -m, --model <name>         Model name (default: gemma4)
  -n, --num-predict <int>    Max output tokens (default: 180)
  -t, --temperature <float>  Temperature (default: 0.2)
  --timeout <sec>            HTTP timeout seconds (default: 600)
  --meta                     Print metadata to stderr
  -h, --help                 Show this help

Examples:
  gemma4-safe.sh "請只回覆：PASS"
  gemma4-safe.sh -n 80 "用三點說明台股風險"
  echo "整理成JSON" | gemma4-safe.sh -n 220 -t 0
EOF
}

PROMPT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--model)
      MODEL="$2"; shift 2 ;;
    -n|--num-predict)
      NUM_PREDICT="$2"; shift 2 ;;
    -t|--temperature)
      TEMPERATURE="$2"; shift 2 ;;
    --timeout)
      TIMEOUT_SEC="$2"; shift 2 ;;
    --meta)
      SHOW_META="1"; shift ;;
    -h|--help)
      usage; exit 0 ;;
    --)
      shift; break ;;
    *)
      if [[ -z "$PROMPT" ]]; then
        PROMPT="$1"
      else
        PROMPT+=$' '\"$1\"
      fi
      shift ;;
  esac
done

if [[ -z "$PROMPT" ]]; then
  if [ -t 0 ]; then
    echo "Error: prompt is required." >&2
    usage
    exit 1
  fi
  PROMPT="$(cat)"
fi

MODEL="$MODEL" NUM_PREDICT="$NUM_PREDICT" TEMPERATURE="$TEMPERATURE" TIMEOUT_SEC="$TIMEOUT_SEC" SHOW_META="$SHOW_META" PROMPT="$PROMPT" python3 - <<'PY'
import json, os, sys, urllib.request

model = os.environ['MODEL']
num_predict = int(float(os.environ['NUM_PREDICT']))
temperature = float(os.environ['TEMPERATURE'])
timeout_sec = int(float(os.environ['TIMEOUT_SEC']))
show_meta = os.environ['SHOW_META'] == '1'
prompt = os.environ['PROMPT']

payload = {
    "model": model,
    "prompt": prompt,
    "stream": False,
    "options": {
        "num_predict": num_predict,
        "temperature": temperature,
    },
}

req = urllib.request.Request(
    "http://127.0.0.1:11434/api/generate",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
)

try:
    with urllib.request.urlopen(req, timeout=timeout_sec) as r:
        obj = json.loads(r.read().decode("utf-8"))
except Exception as e:
    print(f"gemma4-safe request failed: {e}", file=sys.stderr)
    sys.exit(2)

print(obj.get("response", "").rstrip())
if show_meta:
    print(
        f"[meta] done={obj.get('done')} reason={obj.get('done_reason')} eval_count={obj.get('eval_count')} total_ms={int(obj.get('total_duration',0)/1e6)}",
        file=sys.stderr,
    )
PY
