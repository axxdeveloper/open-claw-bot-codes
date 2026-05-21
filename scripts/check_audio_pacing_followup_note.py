#!/usr/bin/env python3
"""Validate pacing follow-up notes and flag legacy onset target drift."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

EDGE_WARNING_CODES = {
    "first_spoken_onset_early_edge",
    "first_spoken_onset_late_edge",
}
ONSET_FAIL_EARLY_CODE = "first_spoken_onset_too_early"
ONSET_FAIL_LATE_CODE = "first_spoken_onset_too_late"
ONSET_HARD_MIN = 1.30
ONSET_HARD_MAX = 2.00
ONSET_COMFORT_MIN = 1.35
ONSET_COMFORT_MAX = 1.80

LEGACY_TARGET_PATTERNS = (
    re.compile(r"0\.9\d*\s*[-~到]\s*1\.0\d*", re.IGNORECASE),
    re.compile(r"0\.95\s*[-~到]\s*1\.00", re.IGNORECASE),
    re.compile(r"0\.90\s*[-~到]\s*1\.00", re.IGNORECASE),
)


def _contains_legacy_onset_target(fix_text: str) -> bool:
    text = fix_text.strip()
    if not text:
        return False
    for pattern in LEGACY_TARGET_PATTERNS:
        if pattern.search(text):
            return True

    # Fallback for free-form phrasing without explicit range separators.
    if re.search(r"0\.9[0-9]?\s*(?:秒|s)\b", text, re.IGNORECASE) and re.search(
        r"1\.0[0-9]?\s*(?:秒|s)\b", text, re.IGNORECASE
    ):
        return True
    return False


def _parse_audio_onset_seconds(audio_check_path: Path) -> float | None:
    if not audio_check_path.exists():
        return None

    text = audio_check_path.read_text(encoding="utf-8", errors="replace")
    match = re.search(
        r"(?im)^\s*(?:-\s*)?first_spoken_onset_seconds\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*$",
        text,
    )
    if not match:
        return None

    try:
        return float(match.group(1))
    except ValueError:
        return None


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Validate `audio_pacing_next_fix` in review/improvement-notes.md. "
            "When `audio-check-gate` has onset-edge warnings, the fix line is required; "
            "legacy onset target wording is flagged as warning-level drift."
        )
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument(
        "--audio-check-gate",
        type=Path,
        help=(
            "Optional path to a fresh audio-check-gate JSON. "
            "When omitted, defaults to <artifact_dir>/review/audio-check-gate.json."
        ),
    )
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    notes_path = artifact_dir / "review" / "improvement-notes.md"
    audio_check_path = artifact_dir / "review" / "audio-check.txt"
    gate_path = (
        args.audio_check_gate.resolve()
        if args.audio_check_gate
        else (artifact_dir / "review" / "audio-check-gate.json").resolve()
    )

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {}

    result: dict[str, Any] = {
        "artifact_dir": str(artifact_dir),
        "notes_path": str(notes_path),
        "audio_check_path": str(audio_check_path),
        "audio_check_gate_path": str(gate_path),
        "status": "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": parsed,
    }

    notes_text = ""
    if not notes_path.exists():
        errors.append(
            {
                "code": "missing_improvement_notes",
                "message": "review/improvement-notes.md is required.",
            }
        )
    else:
        notes_text = notes_path.read_text(encoding="utf-8", errors="replace")

    gate_payload: dict[str, Any] = {}
    if not gate_path.exists():
        errors.append(
            {
                "code": "missing_audio_check_gate",
                "message": "review/audio-check-gate.json is required.",
            }
        )
    else:
        try:
            gate_payload = json.loads(gate_path.read_text(encoding="utf-8", errors="replace"))
        except Exception as exc:
            errors.append(
                {
                    "code": "invalid_audio_check_gate_json",
                    "message": f"Cannot parse review/audio-check-gate.json: {exc}",
                }
            )

    warning_codes: list[str] = []
    for warning in gate_payload.get("warnings", []):
        if isinstance(warning, dict):
            code = warning.get("code")
            if isinstance(code, str):
                warning_codes.append(code)
    error_codes: list[str] = []
    for error in gate_payload.get("errors", []):
        if isinstance(error, dict):
            code = error.get("code")
            if isinstance(code, str):
                error_codes.append(code)

    parsed["audio_check_warning_codes"] = warning_codes
    parsed["audio_check_error_codes"] = error_codes

    onset_edge_codes = [code for code in warning_codes if code in EDGE_WARNING_CODES]
    parsed["onset_edge_warning_codes"] = onset_edge_codes

    onset_seconds = _parse_audio_onset_seconds(audio_check_path)
    parsed["audio_check_onset_seconds"] = onset_seconds

    if isinstance(onset_seconds, float):
        expects_fail_early = onset_seconds < ONSET_HARD_MIN
        expects_fail_late = onset_seconds > ONSET_HARD_MAX
        expects_edge_warn = (
            ONSET_HARD_MIN <= onset_seconds < ONSET_COMFORT_MIN
            or ONSET_COMFORT_MAX < onset_seconds <= ONSET_HARD_MAX
        )
        has_fail_early = ONSET_FAIL_EARLY_CODE in error_codes
        has_fail_late = ONSET_FAIL_LATE_CODE in error_codes
        has_edge_warn = any(code in EDGE_WARNING_CODES for code in warning_codes)

        if expects_fail_early and not has_fail_early:
            warnings.append(
                {
                    "code": "audio_gate_onset_policy_drift",
                    "value": onset_seconds,
                    "message": (
                        "audio-check.txt shows first_spoken_onset_seconds below 1.30s, "
                        "but audio-check-gate.json does not contain first_spoken_onset_too_early. "
                        "Refresh gate output with the latest checker before using this artifact in learning audits."
                    ),
                }
            )
        elif expects_fail_late and not has_fail_late:
            warnings.append(
                {
                    "code": "audio_gate_onset_policy_drift",
                    "value": onset_seconds,
                    "message": (
                        "audio-check.txt shows first_spoken_onset_seconds above 2.00s, "
                        "but audio-check-gate.json does not contain first_spoken_onset_too_late. "
                        "Refresh gate output with the latest checker before using this artifact in learning audits."
                    ),
                }
            )
        elif expects_edge_warn and not has_edge_warn and not (has_fail_early or has_fail_late):
            warnings.append(
                {
                    "code": "audio_gate_missing_onset_edge_warning",
                    "value": onset_seconds,
                    "message": (
                        "audio-check.txt onset is inside hard-pass but outside the 1.35-1.80s comfort target, "
                        "yet audio-check-gate.json has no onset-edge warning. Refresh the gate output before trend counting."
                    ),
                }
            )

    fix_match = re.search(
        r"(?im)^\s*(?:-\s*)?audio_pacing_next_fix\s*:\s*(.+)$",
        notes_text,
    )
    if fix_match:
        parsed["audio_pacing_next_fix"] = fix_match.group(1).strip()

    fix_text = str(parsed.get("audio_pacing_next_fix", "")).strip()
    if fix_text and _contains_legacy_onset_target(fix_text):
        warnings.append(
            {
                "code": "legacy_onset_target_range_in_fix",
                "value": fix_text,
                "message": (
                    "audio_pacing_next_fix still points to legacy onset targets around 0.90-1.00s. "
                    "Align follow-up to the current policy: hard-pass 1.30-2.00s, comfort target 1.35-1.80s."
                ),
            }
        )

    if onset_edge_codes:
        if not fix_text:
            errors.append(
                {
                    "code": "missing_audio_pacing_next_fix",
                    "message": (
                        "audio-check-gate has onset edge warnings; add canonical line "
                        "`audio_pacing_next_fix: <one concrete next-run pacing action>` "
                        "to review/improvement-notes.md."
                    ),
                }
            )
        elif len(fix_text) < 8:
            errors.append(
                {
                    "code": "audio_pacing_next_fix_too_short",
                    "value": fix_text,
                    "message": "audio_pacing_next_fix should be concrete, not a short placeholder.",
                }
            )

    result["status"] = "FAIL" if errors else "PASS"

    payload = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(payload, encoding="utf-8")
    else:
        print(payload)

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
