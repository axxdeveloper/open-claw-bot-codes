#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

# Legacy note: Isaac now wants all new OpenClaw audio/video narration to use
# OpenAI Text-to-Speech via OPENAI_TEXT_TO_SPEECH_API_KEY. This NotebookLM audio
# submitter is blocked by default so old automations cannot silently bypass that
# rule. Set OPENCLAW_ALLOW_NOTEBOOKLM_AUDIO=1 only for an explicit manual
# exception.
#
# OpenClaw cron runs with HOME pointed at the agent sandbox, while this package
# is installed in the real user's Python site-packages.
USER_SITE = "/Users/openclaw-user/Library/Python/3.9/lib/python/site-packages"
if USER_SITE not in sys.path:
    sys.path.insert(0, USER_SITE)

from notebooklm import AudioFormat, AudioLength, NotebookLMClient


WORKSPACE = Path("/Users/openclaw-user/.openclaw/workspace")
TMP_DIR = WORKSPACE / ".tmp"
DEFAULT_NOTEBOOK_TITLE = "notebooklm-daily-deep-audio"
DEFAULT_EXPORT_SCRIPT = WORKSPACE / "scripts" / "export_notebooklm_storage_state.js"
DEFAULT_STORAGE = TMP_DIR / "nblm_storage_state.json"
LEGACY_STORAGE = TMP_DIR / "nblm_storage_state_2026-04-18.json"
NOTEBOOK_URL_PREFIX = "https://notebooklm.google.com/notebook/"
DEFAULT_CHROME_ROOT = Path("/Users/openclaw-user/Library/Application Support/Google/Chrome")
REQUIRED_GOOGLE_ACCOUNT = os.environ.get("OPENCLAW_REQUIRED_GOOGLE_ACCOUNT", "zwl9999999@gmail.com")
PREFERRED_CHROME_PROFILE = os.environ.get("OPENCLAW_GOOGLE_CHROME_PROFILE", "Profile 2")

FOCUS_PROMPT = (
    "請用繁體中文製作語音摘要，優先採用台灣用語與台灣口音。"
    "這是深度版每日音檔，請深度優先、長篇輸出、越長越好。"
    "請依序講：今日總覽、AI/Backend 重點、HN 深度議題、可執行建議與後續觀察。"
    "每一段都要清楚交代背景脈絡、機制、取捨、實作影響、下一步。"
    "只建立語音摘要，不要影片。"
)


def today_taipei() -> str:
    return datetime.now(ZoneInfo("Asia/Taipei")).strftime("%Y-%m-%d")


def default_source_path(date: str) -> Path:
    return WORKSPACE / "reports" / "daily-audio-pack" / f"{date}.md"


def extract_topic(text: str, fallback: str) -> str:
    preferred_patterns = [
        r"^今日主題[:：]\s*(.+)$",
        r"^主題[:：]\s*(.+)$",
        r"每日深度音檔[-：:]\s*(.+)$",
    ]
    heading_pattern = r"^#\s+(.+)$"
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        for pattern in preferred_patterns:
            match = re.search(pattern, stripped)
            if match:
                return match.group(1).strip(" `#")
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        match = re.search(heading_pattern, stripped)
        if match:
            return match.group(1).strip(" `#")
    for line in text.splitlines():
        stripped = line.strip(" #`")
        if stripped:
            return stripped[:120]
    return fallback


def profile_candidates(raw_profiles: list[str]) -> list[str]:
    if raw_profiles:
        candidates = raw_profiles
    else:
        env_profile = os.environ.get("NBLM_CHROME_PROFILE")
        if env_profile:
            candidates = [env_profile]
        else:
            candidates = [PREFERRED_CHROME_PROFILE]

    seen = set()
    out = []
    for profile in candidates:
        if not profile or profile in seen:
            continue
        seen.add(profile)
        out.append(profile)
    return out


def profile_account_email(profile: str, chrome_root: Path = DEFAULT_CHROME_ROOT) -> str | None:
    preferences = chrome_root / profile / "Preferences"
    if not preferences.exists():
        return None
    try:
        data = json.loads(preferences.read_text(encoding="utf-8"))
    except Exception:
        return None
    for item in data.get("account_info") or []:
        email = item.get("email")
        if email:
            return email
    return None


def assert_allowed_google_profile(profile: str) -> None:
    email = profile_account_email(profile)
    if email != REQUIRED_GOOGLE_ACCOUNT:
        got = email or "no signed-in Google account"
        raise RuntimeError(
            f"Refusing Chrome profile {profile}: {got}; required {REQUIRED_GOOGLE_ACCOUNT}"
        )


def storage_candidates(extra: list[Path]) -> list[Path]:
    candidates = []
    candidates.extend(extra)
    candidates.extend([
        DEFAULT_STORAGE,
        LEGACY_STORAGE,
        Path.home() / ".notebooklm" / "storage_state.json",
    ])

    seen = set()
    out = []
    for path in candidates:
        resolved = str(path)
        if resolved not in seen:
            seen.add(resolved)
            out.append(path)
    return out


async def list_notebooks(storage_path: Path):
    client = await NotebookLMClient.from_storage(str(storage_path), timeout=60.0)
    async with client:
        return await client.notebooks.list()


async def find_working_storage(candidates: list[Path]):
    errors = []
    for path in candidates:
        if not path.exists():
            errors.append(f"{path}: missing")
            continue
        try:
            notebooks = await list_notebooks(path)
            return path, notebooks
        except Exception as exc:
            errors.append(f"{path}: {exc}")
    raise RuntimeError("No usable NotebookLM storage state. " + " | ".join(errors))


def export_storage(profile: str, output: Path, timeout_ms: int) -> dict:
    assert_allowed_google_profile(profile)
    proc = subprocess.run(
        [
            "node",
            str(DEFAULT_EXPORT_SCRIPT),
            "--profile",
            profile,
            "--out",
            str(output),
            "--timeout-ms",
            str(timeout_ms),
        ],
        cwd=str(WORKSPACE),
        text=True,
        capture_output=True,
        timeout=(timeout_ms / 1000) + 30,
    )
    if proc.returncode != 0:
        raise RuntimeError((proc.stderr or proc.stdout).strip()[-3000:])
    return json.loads(proc.stdout)


async def ensure_storage(args):
    candidates = storage_candidates([Path(path) for path in args.storage])
    try:
        return await find_working_storage(candidates)
    except Exception as first_error:
        export_errors = [str(first_error)]

    for profile in profile_candidates(args.profile):
        try:
            export_storage(profile, DEFAULT_STORAGE, args.export_timeout_ms)
            return await find_working_storage([DEFAULT_STORAGE])
        except Exception as exc:
            export_errors.append(f"{profile}: {exc}")

    raise RuntimeError("NotebookLM login is not usable. " + " | ".join(export_errors))


async def submit_audio(args) -> dict:
    source_path = Path(args.source) if args.source else default_source_path(args.date)
    if not source_path.exists():
        raise FileNotFoundError(f"Daily audio source not found: {source_path}")

    source_text = source_path.read_text(encoding="utf-8")
    topic = args.topic or extract_topic(source_text, f"{args.date} daily audio")
    source_title = args.source_title or f"{args.date} 每日深度音檔：{topic}"

    storage_path, _ = await ensure_storage(args)
    client = await NotebookLMClient.from_storage(str(storage_path), timeout=90.0)
    async with client:
        notebooks = await client.notebooks.list()
        notebook = next((item for item in notebooks if item.title == args.notebook_title), None)
        created_notebook = False
        if notebook is None:
            if args.dry_run and args.create_notebook:
                return {
                    "success": True,
                    "dry_run": True,
                    "would_create_notebook": True,
                    "topic": topic,
                    "storage_path": str(storage_path),
                    "notebook_title": args.notebook_title,
                    "source_path": str(source_path),
                    "source_title": source_title,
                }
            if not args.create_notebook:
                raise RuntimeError(f"Notebook not found: {args.notebook_title}")
            notebook = await client.notebooks.create(args.notebook_title)
            created_notebook = True

        if args.dry_run:
            return {
                "success": True,
                "dry_run": True,
                "topic": topic,
                "storage_path": str(storage_path),
                "notebook_id": notebook.id,
                "notebook_url": NOTEBOOK_URL_PREFIX + notebook.id,
                "created_notebook": created_notebook,
                "source_path": str(source_path),
                "source_title": source_title,
            }

        sources = await client.sources.list(notebook.id)
        source = next((item for item in sources if item.title == source_title), None)
        if source is None:
            source = await client.sources.add_text(
                notebook.id,
                source_title,
                source_text,
                wait=True,
                wait_timeout=args.source_wait_seconds,
            )

        status = await client.artifacts.generate_audio(
            notebook.id,
            source_ids=[source.id],
            language="zh-TW",
            instructions=args.instructions,
            audio_format=AudioFormat.DEEP_DIVE,
            audio_length=AudioLength.LONG,
        )

    success = status.status in {"pending", "in_progress", "completed"}
    return {
        "success": success,
        "topic": topic,
        "storage_path": str(storage_path),
        "notebook_id": notebook.id,
        "notebook_url": NOTEBOOK_URL_PREFIX + notebook.id,
        "created_notebook": created_notebook,
        "source_path": str(source_path),
        "source_title": source_title,
        "source_id": source.id,
        "audio_task_id": status.task_id,
        "audio_status": status.status,
        "audio_error": status.error,
        "audio_error_code": status.error_code,
    }


def parse_args():
    parser = argparse.ArgumentParser(description="Submit the daily deep audio source to NotebookLM.")
    parser.add_argument("--date", default=today_taipei())
    parser.add_argument("--source")
    parser.add_argument("--topic")
    parser.add_argument("--source-title")
    parser.add_argument("--notebook-title", default=DEFAULT_NOTEBOOK_TITLE)
    parser.add_argument("--storage", action="append", default=[])
    parser.add_argument("--profile", action="append", default=[])
    parser.add_argument("--instructions", default=FOCUS_PROMPT)
    parser.add_argument("--source-wait-seconds", type=float, default=180.0)
    parser.add_argument("--export-timeout-ms", type=int, default=120000)
    parser.add_argument("--create-notebook", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--format", choices=["json", "text"], default="json")
    return parser.parse_args()


def format_text_result(result: dict) -> str:
    if result.get("dry_run"):
        return (
            f"今日主題：{result.get('topic')}\n"
            "狀態：dry-run 已通過\n"
            f"Notebook 連結：{result.get('notebook_url', result.get('notebook_title'))}\n"
            f"使用來源：{result.get('source_path')}"
        )
    return (
        f"今日主題：{result.get('topic')}\n"
        "狀態：已送出 NotebookLM 音檔生成\n"
        f"Notebook 連結：{result.get('notebook_url')}\n"
        f"使用來源：{result.get('source_path')}\n"
        f"來源標題：{result.get('source_title')}\n"
        f"audio task：{result.get('audio_task_id')}（{result.get('audio_status')}）"
    )


def main():
    if os.environ.get("OPENCLAW_ALLOW_NOTEBOOKLM_AUDIO") != "1":
        print(
            "ERROR: NotebookLM audio generation is disabled. "
            "Use scripts/openai_text_to_speech.py with OPENAI_TEXT_TO_SPEECH_API_KEY instead.",
            file=sys.stderr,
        )
        return 78
    args = parse_args()
    try:
        result = asyncio.run(submit_audio(args))
        if args.format == "text":
            print(format_text_result(result))
        else:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        if not result.get("success"):
            return 1
        return 0
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
