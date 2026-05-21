#!/usr/bin/env python3

import argparse
import json
import sys
from pathlib import Path
from typing import Optional


DEFAULT_OPENCLAW_CHROME_ROOT = Path("/Users/openclaw-user/.openclaw/browser/openclaw/user-data")
DEFAULT_REAL_CHROME_ROOT = Path("/Users/openclaw-user/Library/Application Support/Google/Chrome")
DEFAULT_ACCOUNT = "zwl9999999@gmail.com"
DEFAULT_PROFILE = "Profile 2"


def load_preferences(chrome_root: Path, profile: str) -> dict:
    preferences_path = chrome_root / profile / "Preferences"
    if not preferences_path.exists():
        raise FileNotFoundError(f"Chrome profile Preferences not found: {preferences_path}")
    return json.loads(preferences_path.read_text(encoding="utf-8"))


def profile_email(preferences: dict) -> Optional[str]:
    for item in preferences.get("account_info") or []:
        email = item.get("email")
        if email:
            return email
    return None


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Verify a Chrome profile is signed in as the required Google account."
    )
    parser.add_argument("--chrome-root", default=str(DEFAULT_OPENCLAW_CHROME_ROOT))
    parser.add_argument("--profile", default=DEFAULT_PROFILE)
    parser.add_argument("--account", default=DEFAULT_ACCOUNT)
    parser.add_argument("--real-chrome", action="store_true", help="Use the normal Google Chrome user-data root.")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    chrome_root = DEFAULT_REAL_CHROME_ROOT if args.real_chrome else Path(args.chrome_root)
    try:
        preferences = load_preferences(chrome_root, args.profile)
        email = profile_email(preferences)
        ok = email == args.account
        result = {
            "ok": ok,
            "chrome_root": str(chrome_root),
            "profile": args.profile,
            "profile_name": (preferences.get("profile") or {}).get("name"),
            "email": email,
            "required_account": args.account,
        }
    except Exception as exc:
        result = {
            "ok": False,
            "chrome_root": str(chrome_root),
            "profile": args.profile,
            "required_account": args.account,
            "error": str(exc),
        }

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif result["ok"]:
        print(f"OK profile={result['profile']} email={result['email']}")
    else:
        detail = result.get("error") or f"email={result.get('email')!r}, required={args.account!r}"
        print(f"PROFILE_MISMATCH profile={args.profile} {detail}", file=sys.stderr)

    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
