#!/usr/bin/env python3
"""Check narration speed and risky whole-video compression for article videos."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path
from typing import Any


WARN_CHARS_PER_SECOND = 5.2
HARD_CHARS_PER_SECOND = 5.6
WARN_WHOLE_VIDEO_COMPRESSION = 1.08
HARD_WHOLE_VIDEO_COMPRESSION = 1.12
LONG_FORM_SECONDS = 300.0


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def ffprobe_duration(path: Path) -> float | None:
    if not path.exists():
        return None
    try:
        output = subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(path),
            ],
            text=True,
            stderr=subprocess.DEVNULL,
            timeout=20,
        ).strip()
        return float(output)
    except Exception:
        return None


def parse_duration_from_text(path: Path) -> float | None:
    if not path.exists():
        return None
    text = path.read_text(encoding="utf-8", errors="replace")
    patterns = [
        r"(?im)^\s*duration\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*s?\b",
        r"(?im)^\s*-\s*Duration:\s*([0-9]+(?:\.[0-9]+)?)\s*s\b",
        r"(?im)\bduration_seconds\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return float(match.group(1))
    return None


def find_video(artifact_dir: Path) -> tuple[Path | None, float | None, str | None]:
    metadata = load_json(artifact_dir / "youtube" / "metadata.json")
    for key in ("video_path", "video", "file"):
        value = metadata.get(key)
        if isinstance(value, str) and value.strip():
            path = Path(value)
            duration = ffprobe_duration(path)
            if duration is not None:
                return path, duration, f"ffprobe:youtube/metadata.json:{key}"

    build_result = artifact_dir / "video" / "build-result.txt"
    duration = parse_duration_from_text(build_result)
    if duration is not None:
        video_path: Path | None = None
        for line in build_result.read_text(encoding="utf-8", errors="replace").splitlines():
            if line.startswith("video="):
                video_path = Path(line.split("=", 1)[1].strip())
                break
        return video_path, duration, "video/build-result.txt"

    return None, None, None


def narration_text(artifact_dir: Path) -> tuple[str, str]:
    text_dir = artifact_dir / "video" / "build" / "text"
    if text_dir.exists():
        files = sorted(text_dir.glob("*.txt"))
        if files:
            return "\n".join(
                path.read_text(encoding="utf-8", errors="replace") for path in files
            ), "video/build/text/*.txt"

    plan = load_json(artifact_dir / "plan_payload.json")
    narration = plan.get("narration")
    if isinstance(narration, list):
        return "\n".join(str(item) for item in narration), "plan_payload.json:narration"
    nested = plan.get("plan")
    if isinstance(nested, dict) and isinstance(nested.get("narration"), list):
        return "\n".join(str(item) for item in nested["narration"]), "plan_payload.json:plan.narration"

    narration_file = artifact_dir / "video" / "narration.md"
    if narration_file.exists():
        return narration_file.read_text(encoding="utf-8", errors="replace"), "video/narration.md"

    return "", "missing"


def count_nonspace(text: str) -> tuple[int, int]:
    nonspace = sum(1 for char in text if not char.isspace())
    cjk = sum(1 for char in text if "\u4e00" <= char <= "\u9fff")
    return nonspace, cjk


def mp4_durations(video_dir: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not video_dir.exists():
        return rows
    for path in sorted(video_dir.glob("*.mp4")):
        duration = ffprobe_duration(path)
        if duration is not None:
            rows.append({"path": str(path), "name": path.name, "duration_seconds": duration})
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check final narration speed and whole-video compression risk."
    )
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []

    video_path, duration, duration_source = find_video(artifact_dir)
    text, text_source = narration_text(artifact_dir)
    nonspace_chars, cjk_chars = count_nonspace(text)

    chars_per_second: float | None = None
    if duration and nonspace_chars:
        chars_per_second = nonspace_chars / duration

    rows = mp4_durations(artifact_dir / "video")
    final_resolved = video_path.resolve() if video_path else None
    comparable = []
    for row in rows:
        row_path = Path(row["path"]).resolve()
        if final_resolved is not None and row_path == final_resolved:
            continue
        comparable.append(row)

    longest = max(comparable, key=lambda row: row["duration_seconds"], default=None)
    compression_factor: float | None = None
    if duration and longest and longest["duration_seconds"] > duration:
        compression_factor = longest["duration_seconds"] / duration

    final_name = video_path.name.lower() if video_path else ""
    compression_name_hint = bool(re.search(r"(under15|trim|speed|tempo|fast)", final_name))

    if duration is None:
        errors.append(
            {
                "code": "missing_video_duration",
                "message": "Could not determine final video duration for narration speed check.",
            }
        )
    if not nonspace_chars:
        errors.append(
            {
                "code": "missing_narration_text",
                "message": "Could not find narration text for narration speed check.",
            }
        )

    if duration and duration >= LONG_FORM_SECONDS and chars_per_second is not None:
        if chars_per_second > HARD_CHARS_PER_SECOND:
            errors.append(
                {
                    "code": "narration_text_rate_too_fast",
                    "chars_per_second": round(chars_per_second, 3),
                    "hard_limit": HARD_CHARS_PER_SECOND,
                    "message": (
                        "Narration text density is too high for a long-form explainer. "
                        "Slow down, reduce text, split the topic, or add real pauses instead of speeding up."
                    ),
                }
            )
        elif chars_per_second > WARN_CHARS_PER_SECOND:
            warnings.append(
                {
                    "code": "narration_text_rate_fast_warning",
                    "chars_per_second": round(chars_per_second, 3),
                    "warn_limit": WARN_CHARS_PER_SECOND,
                    "message": "Narration text density is above the comfort target for long-form explainers.",
                }
            )

    if compression_factor is not None:
        issue = {
            "code": "whole_video_compression_risk",
            "compression_factor": round(compression_factor, 3),
            "final_video": str(video_path) if video_path else None,
            "longest_comparison_video": longest,
            "message": (
                "Final video is materially shorter than another rendered candidate. "
                "Do not solve the current long-video limit by globally speeding up narration."
            ),
        }
        if compression_factor >= HARD_WHOLE_VIDEO_COMPRESSION or (
            compression_factor >= WARN_WHOLE_VIDEO_COMPRESSION and compression_name_hint
        ):
            errors.append(issue)
        elif compression_factor >= WARN_WHOLE_VIDEO_COMPRESSION:
            warnings.append(issue)

    parsed = {
        "video": str(video_path) if video_path else None,
        "duration_seconds": duration,
        "duration_source": duration_source,
        "text_source": text_source,
        "nonspace_chars": nonspace_chars,
        "cjk_chars": cjk_chars,
        "chars_per_second": round(chars_per_second, 3) if chars_per_second is not None else None,
        "warn_chars_per_second": WARN_CHARS_PER_SECOND,
        "hard_chars_per_second": HARD_CHARS_PER_SECOND,
        "mp4_durations": rows,
        "compression_factor_vs_longest_other_candidate": (
            round(compression_factor, 3) if compression_factor is not None else None
        ),
        "whole_video_compression_warn_factor": WARN_WHOLE_VIDEO_COMPRESSION,
        "whole_video_compression_hard_factor": HARD_WHOLE_VIDEO_COMPRESSION,
    }

    result = {
        "artifact_dir": str(artifact_dir),
        "status": "FAIL" if errors else "PASS",
        "errors": errors,
        "warnings": warnings,
        "parsed": parsed,
    }
    output = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(output, encoding="utf-8")
    else:
        print(output, end="")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
