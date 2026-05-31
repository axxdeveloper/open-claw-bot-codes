#!/usr/bin/env python3
"""Check review/music-license.md completeness and canonical key format."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


ALLOWED_DECISIONS = {"no_background_music", "bgm_used"}
RIGHTS_CLEAR_SOURCES = {
    "audio library",
    "creator music",
    "original",
}
BGM_REQUIRED_KEYS = [
    "track_name",
    "source",
    "license_or_attribution",
    "rights_check",
    "usage_range",
    "mix_level",
]
NO_BGM_INTRO_OUTRO_STATUS_KEY = "intro_outro_cue_status"
CANONICAL_NO_CUE_STATUSES = {
    "no_safe_audio_library_cue_due_to_intelligibility_drop",
    "no_safe_audio_library_cue_not_found_in_window",
    "no_safe_creator_music_eligibility_or_license",
    "no_cue_short_or_low_density_exception",
}
GENERIC_NO_BGM_REASONS = {
    "voice-first technical explainer; no background music used to protect clarity and avoid content id risk.",
    "voice-first technical explainer; no background music used to protect clarity and avoid copyright risk.",
}
GENERIC_SOURCE_PRIORITY_NO_BGM = {
    "p0 local audio-comfort rule",
    "p0 local audio comfort rule",
    "p0 local audio comfort",
}
GENERIC_NO_BGM_REASON_TOKEN_GROUPS = [
    # Repeated placeholder text seen in local artifacts (multilingual variants).
    ("constraint/eval/triage", "voice-first", "通勤"),
    ("voice-first technical explainer", "no background music used", "protect clarity"),
]


def _parse_key_values(text: str) -> tuple[dict[str, str], list[int], list[int]]:
    kv: dict[str, str] = {}
    equals_lines: list[int] = []
    malformed_lines: list[int] = []

    for lineno, raw in enumerate(text.splitlines(), start=1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue

        normalized = line[2:].strip() if line.startswith("- ") else line

        equals_match = re.match(r"^([A-Za-z0-9_]+)\s*=\s*(.+)$", normalized)
        if equals_match:
            equals_lines.append(lineno)
            key = equals_match.group(1).strip().lower()
            value = equals_match.group(2).strip()
            if key not in kv:
                kv[key] = value
            continue

        match = re.match(r"^([A-Za-z0-9_]+)\s*:\s*(.+)$", normalized)
        if not match:
            malformed_lines.append(lineno)
            continue

        key = match.group(1).strip().lower()
        value = match.group(2).strip()
        if key not in kv:
            kv[key] = value

    return kv, equals_lines, malformed_lines


def _is_rights_clear_source(source: str) -> bool:
    norm = source.strip().lower()
    return any(token in norm for token in RIGHTS_CLEAR_SOURCES)


def _normalize_reason(reason: str) -> str:
    return " ".join(reason.strip().lower().split())


def _is_generic_no_bgm_reason(normalized_reason: str) -> bool:
    if re.search(r"前半段包含\s*本題前半段(?:含|包含)", normalized_reason):
        return True
    if normalized_reason in GENERIC_NO_BGM_REASONS:
        return True
    for tokens in GENERIC_NO_BGM_REASON_TOKEN_GROUPS:
        if all(token in normalized_reason for token in tokens):
            return True
    return False


def _is_generic_no_bgm_source_priority(source_priority: str) -> bool:
    normalized = _normalize_reason(source_priority)
    return normalized in GENERIC_SOURCE_PRIORITY_NO_BGM


def _status_head(value: str) -> str:
    return value.split("|", 1)[0].strip().lower()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate review/music-license.md for deterministic parsing and safety checks."
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact = args.artifact_dir.resolve()
    record_path = artifact / "review" / "music-license.md"

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []

    result: dict[str, Any] = {
        "artifact_dir": str(artifact),
        "record_path": str(record_path),
        "status": "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": {},
    }

    if not record_path.exists():
        errors.append(
            {
                "code": "missing_music_license_file",
                "message": "review/music-license.md is required even when no background music is used.",
            }
        )
    else:
        text = record_path.read_text(encoding="utf-8", errors="replace")
        parsed, equals_lines, malformed_lines = _parse_key_values(text)
        result["parsed"] = parsed

        if equals_lines:
            errors.append(
                {
                    "code": "key_value_separator_equals",
                    "lines": equals_lines,
                    "message": "Use canonical 'key: value' format, not 'key=value'.",
                }
            )

        if malformed_lines:
            warnings.append(
                {
                    "code": "non_key_lines_present",
                    "lines": malformed_lines,
                    "message": "Some non-empty lines are not parseable key/value pairs.",
                }
            )

        decision = parsed.get("decision", "").strip().lower()
        reason = parsed.get("reason", "").strip()

        if not decision:
            errors.append(
                {
                    "code": "missing_decision",
                    "message": "music-license record must include decision.",
                }
            )
        elif decision not in ALLOWED_DECISIONS:
            errors.append(
                {
                    "code": "invalid_decision",
                    "value": decision,
                    "message": "decision must be no_background_music or bgm_used.",
                }
            )

        if not reason:
            errors.append(
                {
                    "code": "missing_reason",
                    "message": "music-license record must include a one-line reason.",
                }
            )

        source_priority = parsed.get("source_priority", "").strip()
        if not source_priority:
            errors.append(
                {
                    "code": "missing_source_priority",
                    "message": "source_priority is required (P0-P4) for traceable learning evidence.",
                }
            )
        else:
            priority_prefix = source_priority.split()[0].upper()
            if priority_prefix not in {"P0", "P1", "P2", "P3", "P4"}:
                errors.append(
                    {
                        "code": "invalid_source_priority",
                        "value": source_priority,
                        "message": "source_priority must start with P0, P1, P2, P3, or P4.",
                    }
                )

        if decision == "no_background_music" and reason:
            cue_status = parsed.get(NO_BGM_INTRO_OUTRO_STATUS_KEY, "").strip()
            cue_trial = parsed.get("cue_trial", "").strip()
            if not cue_status:
                warnings.append(
                    {
                        "code": "missing_intro_outro_cue_status",
                        "message": (
                            "New long-form videos should normally have intro/outro cues; "
                            f"add {NO_BGM_INTRO_OUTRO_STATUS_KEY}: <why no safe cue was used>."
                        ),
                    }
                )
            else:
                status_head = _status_head(cue_status)
                if status_head.startswith("skipped_"):
                    warnings.append(
                        {
                            "code": "noncanonical_intro_outro_cue_status",
                            "message": (
                                "intro_outro_cue_status should use a canonical no-cue label "
                                "(`no_safe_audio_library_cue_due_to_intelligibility_drop`, "
                                "`no_safe_audio_library_cue_not_found_in_window`, "
                                "`no_safe_creator_music_eligibility_or_license`, "
                                "`no_cue_short_or_low_density_exception`) before optional details."
                            ),
                            "value": cue_status,
                        }
                    )
                elif status_head.startswith("no_safe_") and status_head not in CANONICAL_NO_CUE_STATUSES:
                    warnings.append(
                        {
                            "code": "noncanonical_intro_outro_cue_status",
                            "message": (
                                "intro_outro_cue_status uses a no_safe_* form but not a canonical label. "
                                "Use a canonical label, then append run-specific detail after ` | `."
                            ),
                            "value": cue_status,
                        }
                    )

                if status_head in CANONICAL_NO_CUE_STATUSES and status_head.startswith("no_safe_") and not cue_trial:
                    warnings.append(
                        {
                            "code": "missing_cue_trial_for_no_safe_status",
                            "message": (
                                "When intro_outro_cue_status uses a machine-like no_safe_* state, "
                                "add cue_trial: <track/source/mix/failure signal> for reproducible audits."
                            ),
                        }
                    )
                elif (
                    status_head.startswith("no_safe_")
                    and status_head not in CANONICAL_NO_CUE_STATUSES
                    and not cue_trial
                ):
                    warnings.append(
                        {
                            "code": "missing_cue_trial_for_no_safe_status",
                            "message": (
                                "When intro_outro_cue_status uses a machine-like no_safe_* state, "
                                "add cue_trial: <track/source/mix/failure signal> for reproducible audits."
                            ),
                        }
                    )

                if re.search(r"^(skipped|deferred|no-cue run)", cue_trial.strip(), re.IGNORECASE):
                    warnings.append(
                        {
                            "code": "cue_trial_placeholder",
                            "message": (
                                "cue_trial should include one concrete track/source/mix/rejection note, "
                                "not a skipped/deferred placeholder."
                            ),
                            "value": cue_trial,
                        }
                    )

            normalized_reason = _normalize_reason(reason)
            if _is_generic_no_bgm_reason(normalized_reason):
                warnings.append(
                    {
                        "code": "generic_no_bgm_reason",
                        "message": "Reason is boilerplate; add one video-specific clarity goal.",
                    }
                )
            if source_priority and _is_generic_no_bgm_source_priority(source_priority):
                warnings.append(
                    {
                        "code": "generic_no_bgm_source_priority",
                        "message": (
                            "source_priority is too generic for no-music decisions; "
                            "name one concrete local evidence signal."
                        ),
                    }
                )

            priority_upper = source_priority.upper()
            if (
                ("content id" in normalized_reason or "copyright" in normalized_reason)
                and "P1" not in priority_upper
            ):
                warnings.append(
                    {
                        "code": "missing_p1_policy_anchor_for_copyright_claim",
                        "message": (
                            "Reason references copyright/Content ID risk, but source_priority has no P1 anchor."
                        ),
                    }
                )

        if decision == "bgm_used":
            missing = [key for key in BGM_REQUIRED_KEYS if not parsed.get(key, "").strip()]
            if missing:
                errors.append(
                    {
                        "code": "missing_bgm_fields",
                        "fields": missing,
                        "message": "bgm_used requires track/source/license/usage/mix fields.",
                    }
                )

            source_value = parsed.get("source", "")
            if source_value and not _is_rights_clear_source(source_value):
                errors.append(
                    {
                        "code": "source_not_rights_clear",
                        "value": source_value,
                        "message": "BGM source must be Audio Library, Creator Music, or original.",
                    }
                )

            usage_range = _normalize_reason(parsed.get("usage_range", ""))
            if usage_range and (
                "intro" not in usage_range
                or ("outro" not in usage_range and "ending" not in usage_range and "結尾" not in usage_range)
            ):
                warnings.append(
                    {
                        "code": "missing_intro_outro_usage_range",
                        "message": (
                            "For the current default cue policy, usage_range should explicitly "
                            "include both intro cue and outro cue timestamps."
                        ),
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
