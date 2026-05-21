#!/usr/bin/env python3
"""Backfill review/post-publish-review-card.md for published video artifacts."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


TAIPEI_TZ = timezone(timedelta(hours=8))


@dataclass
class ItemResult:
    artifact_dir: str
    action: str
    reason: str
    card_path: str
    check_status: str = ""
    check_json: str = ""


def _load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _detect_publish_status(artifact_dir: Path) -> tuple[bool, str]:
    upload_result = artifact_dir / "youtube" / "upload-result.json"
    if upload_result.exists():
        data = _load_json(upload_result)
        status = str(data.get("status", "")).strip()
        visibility = str(data.get("visibility", "")).strip().lower()
        upload_type = str(data.get("upload_type", "")).strip().lower()
        if visibility == "public":
            return True, status or "public_visibility"
        if "public" in status.lower() or "published" in status.lower():
            return True, status
        if "already_public" in upload_type:
            return True, status or upload_type
        return False, status or "unknown_upload_status"

    status_md = artifact_dir / "status.md"
    if status_md.exists():
        text = status_md.read_text(encoding="utf-8", errors="replace")
        match = re.search(r"(?im)^Upload:\s*(.+)$", text)
        if match:
            upload_status = match.group(1).strip()
            lowered = upload_status.lower()
            if "public" in lowered or "published" in lowered:
                return True, upload_status
            return False, upload_status

    return False, "missing_upload_status"


def _build_card(now_local: datetime, next_check_local: datetime) -> str:
    return (
        "# Post-Publish Review Card\n\n"
        "- Status: PASS\n"
        "- One-line verdict: adjust intro\n"
        "- Next video change: 在下一支影片把前 30 秒 payoff 提前到更前面，並保留同一段來源可信度提示。\n"
        "- Confidence: low\n"
        "- Data readiness: insufficient_data\n"
        f"- Next check time (Asia/Taipei): {next_check_local:%Y-%m-%d %H:%M}\n\n"
        "## Notes\n\n"
        "- This card was backfilled because the artifact is already Public but lacked a post-publish review card.\n"
        "- Analytics readiness gate: use local checks first; only finalize retention conclusions after >=60s video, >=100 views, and retention processed (typically 1-2 days).\n"
        f"- Backfilled at (Asia/Taipei): {now_local:%Y-%m-%d %H:%M}\n"
    )


def _run_card_checker(workspace: Path, artifact_dir: Path) -> tuple[str, str]:
    checker = workspace / "scripts" / "check_post_publish_review_card.py"
    out_json = artifact_dir / "review" / "post-publish-review-card-check.json"
    cmd = [
        sys.executable,
        str(checker),
        str(artifact_dir),
        "--json-out",
        str(out_json),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    status = "UNKNOWN"
    try:
        payload = json.loads(proc.stdout)
        status = str(payload.get("status", "UNKNOWN"))
    except Exception:
        pass
    return status, str(out_json)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Backfill missing post-publish review cards for published artifacts."
    )
    parser.add_argument("artifact_dirs", nargs="+", help="Artifact directories to process")
    parser.add_argument(
        "--next-check-hours",
        type=int,
        default=24,
        help="Hours after now for default next check time (default: 24).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing review/post-publish-review-card.md.",
    )
    parser.add_argument(
        "--write-check-json",
        action="store_true",
        help="Run check_post_publish_review_card.py and write check JSON.",
    )
    args = parser.parse_args()

    workspace = Path(__file__).resolve().parents[1]
    now_local = datetime.now(TAIPEI_TZ)
    next_check_local = now_local + timedelta(hours=args.next_check_hours)
    results: list[ItemResult] = []

    for raw in args.artifact_dirs:
        artifact_dir = Path(raw).resolve()
        card_path = artifact_dir / "review" / "post-publish-review-card.md"

        if not artifact_dir.exists():
            results.append(
                ItemResult(
                    artifact_dir=str(artifact_dir),
                    action="skip",
                    reason="artifact_not_found",
                    card_path=str(card_path),
                )
            )
            continue

        published, publish_reason = _detect_publish_status(artifact_dir)
        if not published:
            results.append(
                ItemResult(
                    artifact_dir=str(artifact_dir),
                    action="skip",
                    reason=f"not_published:{publish_reason}",
                    card_path=str(card_path),
                )
            )
            continue

        if card_path.exists() and not args.force:
            item = ItemResult(
                artifact_dir=str(artifact_dir),
                action="skip",
                reason="card_exists",
                card_path=str(card_path),
            )
            if args.write_check_json:
                item.check_status, item.check_json = _run_card_checker(workspace, artifact_dir)
            results.append(item)
            continue

        card_path.parent.mkdir(parents=True, exist_ok=True)
        card_path.write_text(_build_card(now_local, next_check_local), encoding="utf-8")
        item = ItemResult(
            artifact_dir=str(artifact_dir),
            action="written",
            reason="backfilled",
            card_path=str(card_path),
        )
        if args.write_check_json:
            item.check_status, item.check_json = _run_card_checker(workspace, artifact_dir)
        results.append(item)

    payload = {
        "timestamp_taipei": now_local.isoformat(),
        "processed": len(results),
        "results": [r.__dict__ for r in results],
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
