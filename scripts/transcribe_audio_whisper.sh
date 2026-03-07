#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "用法：transcribe_audio_whisper.sh <audio_file> [language=zh]"
  exit 1
fi

AUDIO_FILE="$1"
LANG="${2:-zh}"
MODEL_PATH="${WHISPER_MODEL_PATH:-/Users/openclaw-user/.openclaw/models/whisper/ggml-small.bin}"

if [[ ! -f "$AUDIO_FILE" ]]; then
  echo "找不到音訊檔：$AUDIO_FILE"
  exit 1
fi

if [[ ! -f "$MODEL_PATH" ]]; then
  echo "找不到模型：$MODEL_PATH"
  exit 1
fi

TMP_WAV="$(mktemp /tmp/whisper_input.XXXXXX.wav)"
trap 'rm -f "$TMP_WAV"' EXIT

# 先轉成 16k mono wav，避免不同編碼造成讀取失敗
ffmpeg -y -i "$AUDIO_FILE" -ar 16000 -ac 1 -c:a pcm_s16le "$TMP_WAV" >/dev/null 2>&1

/usr/local/opt/whisper-cpp/bin/whisper-cli \
  -m "$MODEL_PATH" \
  -f "$TMP_WAV" \
  -l "$LANG" \
  --no-prints \
  --no-timestamps
