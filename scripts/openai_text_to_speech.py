#!/usr/bin/env python3
"""Generate narration audio with OpenAI Text-to-Speech.

Reads the API key from OPENAI_TEXT_TO_SPEECH_API_KEY. This script intentionally
does not fall back to OPENAI_API_KEY so OpenClaw TTS billing/auth stays isolated
from Codex or other OpenAI API usage.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


DEFAULT_MODEL = "gpt-4o-mini-tts"
DEFAULT_VOICE = "random"
DEFAULT_VOICE_POOL = ("coral", "nova", "shimmer", "sage")
DEFAULT_FORMAT = "wav"
DEFAULT_INSTRUCTIONS = (
    "Speak in natural Taiwan Mandarin for a Taiwan audience. "
    "Avoid mainland China Mandarin accent, Beijing-style erhua, heavy retroflex sounds, "
    "PRC broadcast diction, and China-local vocabulary. "
    "Prefer Taiwan-local pronunciation, rhythm, wording, and technical explainer phrasing. "
    "Use a lively, bright, female-sounding technical-explainer voice. "
    "Keep the pacing energetic but not rushed, with crisp terminology and short pauses between ideas. "
    "Sound friendly and engaged, not dramatic, salesy, or like a variety show host."
)
RETRYABLE_STATUS = {408, 409, 429, 500, 502, 503, 504}


def fail(message: str, code: int = 1) -> None:
    print(f"openai_text_to_speech: {message}", file=sys.stderr)
    raise SystemExit(code)


def read_text(path: Path) -> str:
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        fail(f"input text is empty: {path}")
    return text


def response_format_for_output(output: Path, explicit: str | None) -> str:
    if explicit:
        return explicit
    suffix = output.suffix.lower().lstrip(".")
    if suffix in {"mp3", "opus", "aac", "flac", "wav", "pcm"}:
        return suffix
    return DEFAULT_FORMAT


def build_payload(args: argparse.Namespace, text: str, response_format: str) -> dict[str, str]:
    payload = {
        "model": args.model,
        "voice": args.voice,
        "input": text,
        "instructions": args.instructions,
        "response_format": response_format,
    }
    return {k: v for k, v in payload.items() if v}


def parse_voice_pool(value: str) -> list[str]:
    voices = [voice.strip() for voice in value.split(",") if voice.strip()]
    if not voices:
        fail("voice pool is empty")
    return voices


def inferred_voice_seed(output: Path) -> str:
    explicit = os.environ.get("OPENAI_TEXT_TO_SPEECH_VOICE_SEED")
    if explicit:
        return explicit
    try:
        resolved = output.resolve()
    except OSError:
        resolved = output.absolute()
    return str(resolved.parent)


def resolve_voice(args: argparse.Namespace) -> str:
    if args.voice != "random":
        return args.voice

    voice_pool = parse_voice_pool(args.voice_pool)
    seed = inferred_voice_seed(args.output)
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    rng = random.Random(int(digest[:16], 16))
    return rng.choice(voice_pool)


def request_speech(api_key: str, payload: dict[str, str], timeout: float) -> bytes:
    base_url = os.environ.get("OPENAI_TEXT_TO_SPEECH_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    url = f"{base_url}/audio/speech"
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    last_error = ""
    for attempt in range(1, 4):
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")[:1000]
            last_error = f"HTTP {exc.code}: {body}"
            if exc.code not in RETRYABLE_STATUS or attempt == 3:
                break
        except urllib.error.URLError as exc:
            last_error = str(exc.reason)
            if attempt == 3:
                break
        time.sleep(2**attempt)

    fail(f"speech request failed ({last_error})")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate OpenAI TTS audio from a UTF-8 text file.")
    parser.add_argument("--input", required=True, type=Path, help="UTF-8 text file to speak")
    parser.add_argument("--output", required=True, type=Path, help="Output audio path")
    parser.add_argument(
        "--model",
        default=os.environ.get("OPENAI_TEXT_TO_SPEECH_MODEL", DEFAULT_MODEL),
        help=f"TTS model (default: {DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--voice",
        default=os.environ.get("OPENAI_TEXT_TO_SPEECH_VOICE", DEFAULT_VOICE),
        help=f"OpenAI built-in/custom voice id, or 'random' (default: {DEFAULT_VOICE})",
    )
    parser.add_argument(
        "--voice-pool",
        default=os.environ.get("OPENAI_TEXT_TO_SPEECH_VOICE_POOL", ",".join(DEFAULT_VOICE_POOL)),
        help="Comma-separated voices used when --voice=random",
    )
    parser.add_argument(
        "--response-format",
        choices=["mp3", "opus", "aac", "flac", "wav", "pcm"],
        default=os.environ.get("OPENAI_TEXT_TO_SPEECH_FORMAT"),
        help=f"Audio response format (default: inferred from output, then {DEFAULT_FORMAT})",
    )
    parser.add_argument(
        "--instructions",
        default=os.environ.get("OPENAI_TEXT_TO_SPEECH_INSTRUCTIONS", DEFAULT_INSTRUCTIONS),
        help="Voice style instructions",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=float(os.environ.get("OPENAI_TEXT_TO_SPEECH_TIMEOUT", "180")),
        help="HTTP timeout seconds",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    api_key = os.environ.get("OPENAI_TEXT_TO_SPEECH_API_KEY")
    if not api_key:
        fail("OPENAI_TEXT_TO_SPEECH_API_KEY is not set", code=78)

    args.voice = resolve_voice(args)
    response_format = response_format_for_output(args.output, args.response_format)
    text = read_text(args.input)
    payload = build_payload(args, text, response_format)
    audio = request_speech(api_key, payload, args.timeout)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(audio)
    print(
        json.dumps(
            {
                "output": str(args.output),
                "model": args.model,
                "voice": args.voice,
                "response_format": response_format,
                "bytes": len(audio),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
