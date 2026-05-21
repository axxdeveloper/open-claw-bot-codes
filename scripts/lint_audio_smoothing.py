#!/usr/bin/env python3
"""Lint article-video audio smoothing implementation for speech clipping risks."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(errors="replace")


def numeric_assignment(text: str, name: str) -> float | None:
    match = re.search(
        rf"^\s*{re.escape(name)}\s*=\s*(?P<value>\d+(?:\.\d+)?)\s*$",
        text,
        flags=re.MULTILINE,
    )
    if not match:
        return None
    return float(match.group("value"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact = args.artifact_dir
    errors: list[dict[str, str]] = []
    warnings: list[dict[str, str]] = []

    scripts = sorted(artifact.glob("*.py")) + sorted((artifact / "scripts").glob("*.py"))
    if not scripts:
        warnings.append({
            "code": "no_build_script_found",
            "message": "No local build script found to inspect for audio smoothing filter order.",
        })

    for script in scripts:
        text = read_text(script)
        rel = str(script.relative_to(artifact))

        preroll = numeric_assignment(text, "AUDIO_PREROLL_SECONDS")
        if preroll is not None and preroll < 0.40:
            errors.append({
                "code": "audio_preroll_too_short",
                "path": rel,
                "message": "AUDIO_PREROLL_SECONDS must be at least 0.40s. Insert silence before speech instead of trying to cut/fade the TTS edge precisely.",
            })

        tail = numeric_assignment(text, "AUDIO_TAIL_SECONDS")
        if tail is not None and tail < 0.30:
            errors.append({
                "code": "audio_tail_too_short",
                "path": rel,
                "message": "AUDIO_TAIL_SECONDS must be at least 0.30s to avoid hard slide-boundary voice cuts.",
            })

        raw_buffer = numeric_assignment(text, "RAW_TTS_LEADING_BUFFER_SECONDS")
        if raw_buffer is not None and raw_buffer < 0.35:
            errors.append({
                "code": "raw_tts_leading_buffer_too_small_constant",
                "path": rel,
                "message": "RAW_TTS_LEADING_BUFFER_SECONDS is below 0.35s. Do not cut close to the first phoneme.",
            })

        if re.search(r"(?<!no_)silenceremove", text):
            errors.append({
                "code": "aggressive_silenceremove",
                "path": rel,
                "message": "Build script uses silenceremove; this can trim consonants unless explicitly justified.",
            })

        if re.search(r"\[1:a\][^\"']*atrim\s*=\s*start\s*=", text):
            errors.append({
                "code": "raw_tts_atrim_used",
                "path": rel,
                "message": "Build script trims raw TTS with atrim=start. Keep the TTS edge intact and insert silence with anullsrc/adelay/apad.",
            })

        if re.search(r"afade\s*=\s*t\s*=\s*in", text):
            errors.append({
                "code": "voice_fade_in_used",
                "path": rel,
                "message": "Build script applies voice fade-in. Opening smoothing should be inserted silence, not fading the speech onset.",
            })

        if re.search(r"preroll_ms\s*=\s*0\s+if\s+idx\s*==\s*1", text):
            errors.append({
                "code": "first_segment_preroll_zero",
                "path": rel,
                "message": "Slide 1 narration has zero pre-roll while later slides have pre-roll.",
            })

        for match in re.finditer(r"([\"'])(?P<filter>[^\"']*(?:afade|adelay)[^\"']*)\1", text):
            filt = match.group("filter")
            fade_pos = filt.find("afade=t=in:st=0")
            delay_pos = filt.find("adelay")
            if fade_pos != -1 and (delay_pos == -1 or fade_pos < delay_pos):
                errors.append({
                    "code": "fade_raw_tts_before_preroll",
                    "path": rel,
                    "message": "Filter fades raw TTS at t=0 before inserted pre-roll; this can attenuate the first phoneme.",
                })

    build_result = artifact / "video" / "build-result.txt"
    if build_result.exists():
        build_text = read_text(build_result)
        lead_in_match = re.search(r"^video_lead_in_seconds=(?P<seconds>\d+(?:\.\d+)?)$", build_text, flags=re.MULTILINE)
        if lead_in_match and float(lead_in_match.group("seconds")) < 0.80:
            errors.append({
                "code": "video_lead_in_too_short",
                "path": str(build_result.relative_to(artifact)),
                "message": "video_lead_in_seconds is below the 0.80s minimum for opening-word comfort.",
            })
        expected_onset_match = re.search(
            r"^expected_first_spoken_onset_seconds=(?P<seconds>\d+(?:\.\d+)?)$",
            build_text,
            flags=re.MULTILINE,
        )
        if expected_onset_match and float(expected_onset_match.group("seconds")) < 1.30:
            errors.append({
                "code": "expected_first_onset_too_close",
                "path": str(build_result.relative_to(artifact)),
                "message": "expected_first_spoken_onset_seconds is below 1.30s; opening speech can sound clipped even with a nominal lead-in.",
            })
        preserve_match = re.search(
            r"preserve_(?P<seconds>\d+(?:\.\d+)?)s_raw_tts_buffer",
            build_text,
        )
        if preserve_match and float(preserve_match.group("seconds")) < 0.35:
            errors.append({
                "code": "raw_tts_leading_buffer_too_small",
                "path": str(build_result.relative_to(artifact)),
                "message": "Raw TTS leading buffer is below 0.35s; this has produced cut-sounding first words.",
            })
        if re.search(r"(?:first_segment|slide0?1)_pre_roll_0(?:\.0+)?s", build_text):
            errors.append({
                "code": "first_segment_preroll_zero_build_result",
                "path": str(build_result.relative_to(artifact)),
                "message": "build-result records zero pre-roll for the first narration segment (slide 1).",
            })
        smoothing_match = re.search(r"^audio_smoothing=(?P<smoothing>.+)$", build_text, flags=re.MULTILINE)
        if smoothing_match and re.search(r"(?:^|_)pre_roll_0(?:\.0+)?s(?:_|$)", smoothing_match.group("smoothing")):
            errors.append({
                "code": "audio_smoothing_preroll_zero",
                "path": str(build_result.relative_to(artifact)),
                "message": "audio_smoothing indicates zero pre-roll, which can cause clipped or abrupt speech starts.",
            })
        if smoothing_match:
            smoothing = smoothing_match.group("smoothing")
            smoothing_preroll_match = re.search(r"pre_roll_(?P<seconds>0\.\d+)s", smoothing)
            if smoothing_preroll_match and float(smoothing_preroll_match.group("seconds")) < 0.40:
                errors.append({
                    "code": "audio_smoothing_preroll_too_short",
                    "path": str(build_result.relative_to(artifact)),
                    "message": "audio_smoothing records pre-roll below 0.40s. Insert more silence before speech.",
                })
            if "measured_leading_silence_trim" in smoothing:
                errors.append({
                    "code": "audio_smoothing_uses_raw_tts_trim",
                    "path": str(build_result.relative_to(artifact)),
                    "message": "audio_smoothing records raw TTS trimming. Current policy is no raw TTS edge trimming; insert silence for timing instead.",
                })
        if (
            "fade_in" in build_text
            and "no_speech_fade" not in build_text
            and "fade_after_preroll" not in build_text
        ):
            errors.append({
                "code": "build_result_claims_voice_fade",
                "path": str(build_result.relative_to(artifact)),
                "message": "build-result records fade-in smoothing but does not record whether fade happens after the inserted pre-roll.",
            })
        if "audio_smoothing=" not in build_text:
            warnings.append({
                "code": "missing_audio_smoothing_record",
                "path": str(build_result.relative_to(artifact)),
                "message": "build-result.txt does not record audio_smoothing.",
            })
    else:
        warnings.append({
            "code": "missing_build_result",
            "message": "video/build-result.txt was not found.",
        })

    result = {
        "status": "FAIL" if errors else "PASS",
        "artifact_dir": str(artifact),
        "errors": errors,
        "warnings": warnings,
    }

    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
