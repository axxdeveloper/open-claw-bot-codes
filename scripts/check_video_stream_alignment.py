#!/usr/bin/env python3
"""Validate that a rendered video has aligned video/audio stream durations."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


def _read_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def _video_from_build_result(artifact_dir: Path) -> Path | None:
    path = artifact_dir / "video" / "build-result.txt"
    if not path.exists():
        return None
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        match = re.match(r"^video=(.+)$", line.strip())
        if match:
            candidate = Path(match.group(1).strip())
            if not candidate.is_absolute():
                candidate = artifact_dir / candidate
            return candidate
    return None


def _video_from_upload_result(artifact_dir: Path) -> Path | None:
    data = _read_json(artifact_dir / "youtube" / "upload-result.json")
    if not data:
        return None
    raw = data.get("upload_file")
    if not isinstance(raw, str) or not raw.strip():
        return None
    candidate = Path(raw.strip())
    if not candidate.is_absolute():
        candidate = artifact_dir / candidate
    return candidate


def resolve_video(artifact_dir: Path, explicit_video: Path | None) -> tuple[Path | None, str]:
    if explicit_video is not None:
        return explicit_video.resolve(), "--video"
    build_result_video = _video_from_build_result(artifact_dir)
    if build_result_video is not None:
        return build_result_video.resolve(), "video/build-result.txt"
    upload_result_video = _video_from_upload_result(artifact_dir)
    if upload_result_video is not None:
        return upload_result_video.resolve(), "youtube/upload-result.json"
    return None, "not_found"


def _duration(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(str(value))
    except (TypeError, ValueError):
        return None


def ffprobe(path: Path) -> dict[str, Any]:
    proc = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-show_entries",
            "stream=index,codec_type,codec_name,duration,sample_rate,channels,channel_layout",
            "-of",
            "json",
            str(path),
        ],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or f"ffprobe exited {proc.returncode}")
    return json.loads(proc.stdout)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--video", type=Path, help="explicit video file to validate")
    parser.add_argument("--max-tail-gap", type=float, default=5.0)
    parser.add_argument("--warn-tail-gap", type=float, default=2.0)
    parser.add_argument("--max-audio-overhang", type=float, default=5.0)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    video_path, video_source = resolve_video(artifact_dir, args.video)
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    parsed: dict[str, Any] = {
        "video_source": video_source,
        "max_tail_gap_seconds": args.max_tail_gap,
        "warn_tail_gap_seconds": args.warn_tail_gap,
        "max_audio_overhang_seconds": args.max_audio_overhang,
    }

    if video_path is None:
        errors.append(
            {
                "code": "video_path_not_found",
                "message": "Could not find a video path from --video, video/build-result.txt, or youtube/upload-result.json.",
            }
        )
    elif not video_path.exists():
        parsed["video"] = str(video_path)
        errors.append(
            {
                "code": "video_file_missing",
                "path": str(video_path),
                "message": "Video file does not exist.",
            }
        )
    else:
        parsed["video"] = str(video_path)
        try:
            probe = ffprobe(video_path)
        except Exception as exc:
            errors.append(
                {
                    "code": "ffprobe_failed",
                    "message": str(exc),
                }
            )
        else:
            format_duration = _duration((probe.get("format") or {}).get("duration"))
            streams = probe.get("streams") if isinstance(probe.get("streams"), list) else []
            video_streams = [s for s in streams if isinstance(s, dict) and s.get("codec_type") == "video"]
            audio_streams = [s for s in streams if isinstance(s, dict) and s.get("codec_type") == "audio"]
            video_duration = _duration(video_streams[0].get("duration")) if video_streams else None
            audio_duration = _duration(audio_streams[0].get("duration")) if audio_streams else None
            if video_duration is None:
                video_duration = format_duration
            parsed.update(
                {
                    "format_duration_seconds": format_duration,
                    "video_duration_seconds": video_duration,
                    "audio_duration_seconds": audio_duration,
                    "video_stream_count": len(video_streams),
                    "audio_stream_count": len(audio_streams),
                }
            )

            if not video_streams:
                errors.append(
                    {
                        "code": "missing_video_stream",
                        "message": "Rendered video must contain a video stream.",
                    }
                )
            if not audio_streams:
                errors.append(
                    {
                        "code": "missing_audio_stream",
                        "message": "Rendered video must contain an audio stream.",
                    }
                )
            if isinstance(video_duration, float) and isinstance(audio_duration, float):
                tail_gap = video_duration - audio_duration
                audio_overhang = audio_duration - video_duration
                parsed["tail_gap_seconds"] = round(tail_gap, 6)
                parsed["audio_overhang_seconds"] = round(audio_overhang, 6)
                if tail_gap > args.max_tail_gap:
                    errors.append(
                        {
                            "code": "audio_ends_too_early",
                            "value": round(tail_gap, 6),
                            "message": (
                                "Audio stream ends too far before the video stream. "
                                "Rerender or remux so the final video does not have a long silent tail."
                            ),
                        }
                    )
                elif tail_gap > args.warn_tail_gap:
                    warnings.append(
                        {
                            "code": "audio_tail_gap_warning",
                            "value": round(tail_gap, 6),
                            "message": "Audio stream ends a few seconds before video; verify intentional final hold.",
                        }
                    )
                if audio_overhang > args.max_audio_overhang:
                    errors.append(
                        {
                            "code": "audio_overhang_too_long",
                            "value": round(audio_overhang, 6),
                            "message": "Audio stream extends too far beyond video stream; remux or trim before upload.",
                        }
                    )

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
    sys.exit(main())
