#!/usr/bin/env python3
"""Check canonical opening-related keys in pre-analytics quality scorecard."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


REQUIRED_PATTERNS = {
    "one_second_promise_test": r"(?im)^\s*-\s*One-second promise test:\s*(PASS|WARN|FAIL)\b",
    "first_30_second_clarity": r"(?im)^\s*-\s*First-30-second clarity:\s*(PASS|WARN|FAIL)\b",
}

OPTIONAL_SCORECARD_PATTERNS = {
    "comprehension_load": r"(?im)^\s*-\s*Comprehension load:\s*(PASS|WARN|FAIL)\b",
}

LEGACY_PATTERNS = {
    "legacy_one_second_promise": r"(?im)^\s*-\s*One-second promise:\s*(PASS|WARN|FAIL)\b",
    "legacy_first_30_seconds": r"(?im)^\s*-\s*First 30 seconds:\s*(PASS|WARN|FAIL)\b",
    "legacy_viewer_payoff_first30": r"(?im)^\s*-\s*Viewer payoff clarity \(first 30s\):\s*(PASS|WARN|FAIL)\b",
}

IMPROVEMENT_PATTERNS = {
    "first_60s_density": r"(?im)^\s*(?:-\s*)?first_60s_density:\s*(low|medium|high)\b",
    "opening_new_labels_before_30s": r"(?im)^\s*(?:-\s*)?opening_new_labels_before_30s:\s*(\d+)\b",
    "opening_slide2_points_count": r"(?im)^\s*(?:-\s*)?opening_slide2_points_count:\s*(\d+)\b",
    "opening_failure_signal_before_seconds": (
        r"(?im)^\s*(?:-\s*)?opening_failure_signal_before_seconds:\s*([0-9]+(?:\.[0-9]+)?)\b"
    ),
}


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate canonical opening keys in review/pre-analytics-quality-scorecard.md."
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    scorecard_path = artifact_dir / "review" / "pre-analytics-quality-scorecard.md"

    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {}

    result: dict[str, Any] = {
        "artifact_dir": str(artifact_dir),
        "scorecard_path": str(scorecard_path),
        "status": "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": parsed,
    }

    if not scorecard_path.exists():
        errors.append(
            {
                "code": "missing_preanalytics_scorecard",
                "message": "review/pre-analytics-quality-scorecard.md is required.",
            }
        )
    else:
        text = scorecard_path.read_text(encoding="utf-8", errors="replace")

        for key, pattern in REQUIRED_PATTERNS.items():
            match = re.search(pattern, text)
            if not match:
                errors.append(
                    {
                        "code": f"missing_{key}",
                        "message": f"Missing canonical line for {key}.",
                    }
                )
            else:
                parsed[key] = match.group(1).upper()

        for key, pattern in OPTIONAL_SCORECARD_PATTERNS.items():
            match = re.search(pattern, text)
            if match:
                parsed[key] = match.group(1).upper()

        for code, pattern in LEGACY_PATTERNS.items():
            match = re.search(pattern, text)
            if match:
                warnings.append(
                    {
                        "code": code,
                        "value": match.group(1).upper(),
                        "message": "Legacy alias detected; normalize to canonical label before upload.",
                    }
                )

    improvement_notes_path = artifact_dir / "review" / "improvement-notes.md"
    if improvement_notes_path.exists():
        improvement_text = improvement_notes_path.read_text(encoding="utf-8", errors="replace")
        density_match = re.search(IMPROVEMENT_PATTERNS["first_60s_density"], improvement_text)
        if density_match:
            parsed["first_60s_density"] = density_match.group(1).lower()

        for key in ("opening_new_labels_before_30s", "opening_slide2_points_count"):
            match = re.search(IMPROVEMENT_PATTERNS[key], improvement_text)
            if match:
                parsed[key] = int(match.group(1))
        failure_signal_match = re.search(
            IMPROVEMENT_PATTERNS["opening_failure_signal_before_seconds"],
            improvement_text,
        )
        if failure_signal_match:
            parsed["opening_failure_signal_before_seconds"] = float(failure_signal_match.group(1))
    else:
        warnings.append(
            {
                "code": "missing_improvement_notes_for_opening_followup",
                "message": "review/improvement-notes.md is missing; cannot track opening de-noise follow-up keys.",
            }
        )

    first30 = parsed.get("first_30_second_clarity")
    comprehension = parsed.get("comprehension_load")
    density = parsed.get("first_60s_density")

    if first30 == "PASS" and comprehension in {"WARN", "FAIL"}:
        warnings.append(
            {
                "code": "first30_comprehension_gap",
                "first_30_second_clarity": first30,
                "comprehension_load": comprehension,
                "message": (
                    "Opening promise is clear, but comprehension load is still high. "
                    "Keep upload eligibility and add one concrete opening de-noise fix "
                    "(for example: <=2 new labels before 0:30 and <=2 points on slide 2)."
                ),
            }
        )

    should_track_opening_budget = (
        first30 == "WARN" or comprehension == "WARN" or density in {"medium", "high"}
    )

    if should_track_opening_budget:
        missing_keys: list[str] = []
        if "opening_new_labels_before_30s" not in parsed:
            missing_keys.append("opening_new_labels_before_30s")
        if "opening_slide2_points_count" not in parsed:
            missing_keys.append("opening_slide2_points_count")

        if missing_keys:
            warnings.append(
                {
                    "code": "missing_opening_de_noise_budget_keys",
                    "missing_keys": missing_keys,
                    "message": (
                        "Opening de-noise tracking keys are missing in review/improvement-notes.md. "
                        "Add opening_new_labels_before_30s and opening_slide2_points_count."
                    ),
                }
            )
        else:
            labels = int(parsed["opening_new_labels_before_30s"])
            points = int(parsed["opening_slide2_points_count"])
            if labels > 2 or points > 2:
                warnings.append(
                    {
                        "code": "opening_de_noise_budget_over_target",
                        "opening_new_labels_before_30s": labels,
                        "opening_slide2_points_count": points,
                        "target": {"opening_new_labels_before_30s_max": 2, "opening_slide2_points_count_max": 2},
                        "message": (
                            "Opening de-noise pilot budget is above target; keep new labels and slide-2 point count to about two."
                        ),
                    }
                )

        if "opening_failure_signal_before_seconds" not in parsed:
            warnings.append(
                {
                    "code": "missing_opening_failure_signal_before_seconds",
                    "message": (
                        "Opening de-noise tracking is active, but `opening_failure_signal_before_seconds` "
                        "is missing in review/improvement-notes.md. Add one numeric target "
                        "(recommended <=12 seconds)."
                    ),
                }
            )
        else:
            failure_signal_seconds = float(parsed["opening_failure_signal_before_seconds"])
            if failure_signal_seconds <= 0:
                warnings.append(
                    {
                        "code": "invalid_opening_failure_signal_before_seconds",
                        "opening_failure_signal_before_seconds": failure_signal_seconds,
                        "message": (
                            "`opening_failure_signal_before_seconds` must be >0 to represent a real "
                            "on-video timestamp."
                        ),
                    }
                )
            elif failure_signal_seconds > 12.0:
                warnings.append(
                    {
                        "code": "opening_failure_signal_too_late",
                        "opening_failure_signal_before_seconds": failure_signal_seconds,
                        "target": {"opening_failure_signal_before_seconds_max": 12.0},
                        "message": (
                            "Opening failure signal lands too late. Keep upload eligibility, but move the "
                            "first concrete failure signal to <=12 seconds in the next opening pilot."
                        ),
                    }
                )

    audio_gate_candidates = [
        artifact_dir / "review" / "audio-check-gate-fresh.json",
        artifact_dir / "review" / "audio-check-gate.json",
    ]
    audio_gate_path = next((p for p in audio_gate_candidates if p.exists()), None)
    if audio_gate_path:
        try:
            audio_gate = json.loads(audio_gate_path.read_text(encoding="utf-8", errors="replace"))
        except json.JSONDecodeError:
            warnings.append(
                {
                    "code": "invalid_audio_check_gate_json",
                    "message": "review/audio-check-gate.json is not valid JSON; cannot verify opening-audio alignment.",
                }
            )
        else:
            parsed["audio_check_gate_status"] = audio_gate.get("status")
            audio_error_codes: set[str] = set()
            audio_warning_codes: set[str] = set()
            for item in audio_gate.get("errors", []):
                if isinstance(item, dict):
                    code = item.get("code")
                    if isinstance(code, str) and code:
                        audio_error_codes.add(code)
                elif isinstance(item, str) and item:
                    audio_error_codes.add(item)
            for item in audio_gate.get("warnings", []):
                if isinstance(item, dict):
                    code = item.get("code")
                    if isinstance(code, str) and code:
                        audio_warning_codes.add(code)
                elif isinstance(item, str) and item:
                    audio_warning_codes.add(item)

            conflict_codes = {
                "missing_opening_word_spot_check",
                "first_spoken_onset_too_early",
            }
            matched_conflicts = sorted(audio_error_codes.intersection(conflict_codes))
            parsed["audio_check_gate_conflict_codes"] = matched_conflicts
            if first30 == "PASS" and matched_conflicts:
                warnings.append(
                    {
                        "code": "first30_audio_gate_conflict",
                        "audio_error_codes": matched_conflicts,
                        "message": (
                            "First-30-second clarity is PASS while opening audio gate reports "
                            "first-word/onset hard errors. Downgrade opening clarity to WARN/FAIL "
                            "and add a concrete opening-audio fix."
                        ),
                    }
                )

            edge_codes = {
                "first_spoken_onset_early_edge",
                "first_spoken_onset_late_edge",
            }
            matched_edges = sorted(audio_warning_codes.intersection(edge_codes))
            parsed["audio_check_gate_edge_warning_codes"] = matched_edges
            if first30 == "PASS" and matched_edges:
                warnings.append(
                    {
                        "code": "first30_audio_edge_warning_alignment",
                        "audio_warning_codes": matched_edges,
                        "message": (
                            "First-30-second clarity is PASS but opening audio has onset-edge warnings. "
                            "Keep upload eligibility, and add/refresh one concrete `audio_pacing_next_fix` "
                            "to move toward the 1.35-1.80s comfort range."
                        ),
                    }
                )
    elif first30 == "PASS":
        warnings.append(
            {
                "code": "missing_audio_check_gate_for_opening_alignment",
                "message": (
                    "review/audio-check-gate-fresh.json and review/audio-check-gate.json are missing; "
                    "cannot cross-check opening clarity against opening-audio gate."
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
