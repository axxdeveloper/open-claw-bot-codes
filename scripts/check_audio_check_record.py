#!/usr/bin/env python3
"""Validate canonical fields in review/audio-check.txt."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


REQUIRED_NUMERIC_KEYS = (
    "first_spoken_onset_seconds",
    "first_silence_end_seconds",
)
REQUIRED_SPOT_KEYS = (
    "opening_word_spot_check",
    "boundary_spot_check",
)
ALLOWED_SPOT_VALUES = {"PASS", "FAIL"}


def _parse_key_values(text: str) -> dict[str, str]:
    parsed: dict[str, str] = {}

    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("- "):
            line = line[2:].strip()

        match = re.match(r"^([A-Za-z0-9_]+)\s*=\s*(.+)$", line)
        if not match:
            continue

        key = match.group(1).strip().lower()
        value = match.group(2).strip()
        if key not in parsed:
            parsed[key] = value

    return parsed


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate review/audio-check.txt canonical key/value fields."
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    audio_check_path = artifact_dir / "review" / "audio-check.txt"

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {}

    result: dict[str, Any] = {
        "artifact_dir": str(artifact_dir),
        "audio_check_path": str(audio_check_path),
        "status": "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": parsed,
    }

    if not audio_check_path.exists():
        errors.append(
            {
                "code": "missing_audio_check_file",
                "message": "review/audio-check.txt is required.",
            }
        )
    else:
        text = audio_check_path.read_text(encoding="utf-8", errors="replace")
        kv = _parse_key_values(text)

        for key in REQUIRED_NUMERIC_KEYS:
            raw = kv.get(key, "").strip()
            if not raw:
                errors.append(
                    {
                        "code": f"missing_{key}",
                        "message": f"Missing canonical key: {key}=<number>",
                    }
                )
                continue

            try:
                parsed[key] = float(raw)
            except ValueError:
                errors.append(
                    {
                        "code": f"invalid_{key}",
                        "value": raw,
                        "message": f"{key} must be numeric.",
                    }
                )

        for spot_key in REQUIRED_SPOT_KEYS:
            spot_raw = kv.get(spot_key, "").strip().upper()
            if not spot_raw:
                errors.append(
                    {
                        "code": f"missing_{spot_key}",
                        "message": f"Missing canonical key: {spot_key}=PASS|FAIL",
                    }
                )
            elif spot_raw not in ALLOWED_SPOT_VALUES:
                errors.append(
                    {
                        "code": f"invalid_{spot_key}",
                        "value": spot_raw,
                        "message": f"{spot_key} must be PASS or FAIL.",
                    }
                )
            else:
                parsed[spot_key] = spot_raw
                if spot_raw == "FAIL":
                    errors.append(
                        {
                            "code": f"{spot_key}_fail",
                            "message": (
                                "Opening-word spot listening failed; rerender/fix before upload."
                                if spot_key == "opening_word_spot_check"
                                else "Slide-boundary spot listening failed; rerender/fix before upload."
                            ),
                        }
                    )

        onset = parsed.get("first_spoken_onset_seconds")
        if isinstance(onset, float):
            if onset < 1.30:
                errors.append(
                    {
                        "code": "first_spoken_onset_too_early",
                        "value": onset,
                        "message": "first_spoken_onset_seconds < 1.30s has proven too close for the opening word; rerender by inserting more silence before speech.",
                    }
                )
            elif onset > 2.00:
                errors.append(
                    {
                        "code": "first_spoken_onset_too_late",
                        "value": onset,
                        "message": "first_spoken_onset_seconds > 2.00s risks a slow intro before payoff.",
                    }
                )
            elif onset < 1.35:
                warnings.append(
                    {
                        "code": "first_spoken_onset_early_edge",
                        "value": onset,
                        "message": "first_spoken_onset_seconds is inside hard-pass range but earlier than the 1.35-1.80s comfort target; verify the first word by ear.",
                    }
                )
            elif onset > 1.80:
                warnings.append(
                    {
                        "code": "first_spoken_onset_late_edge",
                        "value": onset,
                        "message": "first_spoken_onset_seconds is inside hard-pass range but later than the 1.35-1.80s comfort target; tighten opening pace in the next iteration.",
                    }
                )

        onset = parsed.get("first_spoken_onset_seconds")
        silence_end = parsed.get("first_silence_end_seconds")
        if isinstance(onset, float) and isinstance(silence_end, float):
            delta = abs(onset - silence_end)
            parsed["onset_vs_silence_end_delta"] = round(delta, 6)
            if delta > 0.20:
                warnings.append(
                    {
                        "code": "onset_silence_delta_large",
                        "value": delta,
                        "message": "first_spoken_onset_seconds and first_silence_end_seconds differ by >0.20s; verify measurement method.",
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
