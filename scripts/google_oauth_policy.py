#!/usr/bin/env python3
"""Shared helpers for Google OAuth account restriction."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict

DEFAULT_OAUTH_FILE = Path.home() / ".config" / "openclaw" / "google-oauth.json"
DEFAULT_POLICY_FILE = Path.home() / ".config" / "openclaw" / "google-access-policy.json"


def _load_json_file(path: Path) -> Dict[str, object]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def load_allowed_account() -> str:
    allowed = os.getenv("OPENCLAW_GOOGLE_ALLOWED_ACCOUNT", "").strip().lower()
    if allowed:
        return allowed

    policy_path = Path(
        os.getenv("OPENCLAW_GOOGLE_ACCESS_POLICY_FILE", "") or DEFAULT_POLICY_FILE
    )
    policy = _load_json_file(policy_path)
    return str(policy.get("allowed_account", "")).strip().lower()


def load_google_oauth_config(oauth_file: str | None) -> Dict[str, str]:
    cfg = {
        "client_id": os.getenv("GOOGLE_OAUTH_CLIENT_ID", ""),
        "client_secret": os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", ""),
        "refresh_token": os.getenv("GOOGLE_OAUTH_REFRESH_TOKEN", ""),
    }
    oauth_path = Path(
        oauth_file or os.getenv("OPENCLAW_GOOGLE_OAUTH_FILE", "") or DEFAULT_OAUTH_FILE
    )
    file_cfg = _load_json_file(oauth_path)

    for key in ("client_id", "client_secret", "refresh_token"):
        if not cfg[key]:
            cfg[key] = str(file_cfg.get(key, ""))

    account = str(
        os.getenv("OPENCLAW_GOOGLE_ACCOUNT", "") or file_cfg.get("account", "")
    ).strip().lower()
    allowed_account = load_allowed_account()
    if allowed_account:
        if not account:
            raise RuntimeError(
                f"Google OAuth file {oauth_path} is missing account; expected {allowed_account}"
            )
        if account != allowed_account:
            raise RuntimeError(
                f"Google OAuth account {account} is not allowed; expected {allowed_account}"
            )

    missing = [key for key, value in cfg.items() if not value]
    if missing:
        raise RuntimeError(
            "Missing Google OAuth config: "
            + ", ".join(missing)
            + ". Set env vars or create "
            + str(oauth_path)
        )

    cfg["account"] = account
    cfg["oauth_path"] = str(oauth_path)
    return cfg
