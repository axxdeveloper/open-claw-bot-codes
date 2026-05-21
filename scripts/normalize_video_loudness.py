#!/usr/bin/env python3
"""Normalize a finished video's audio to a speech-friendly loudness target."""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import subprocess
import sys
from typing import Any


def parse_loudnorm_json(text: str) -> dict[str, Any]:
    match = re.search(r"\{\s*\"input_i\".*?\n\}", text, flags=re.S)
    if not match:
        raise ValueError("ffmpeg loudnorm JSON block not found")
    return json.loads(match.group(0))


def run(cmd: list[str], *, capture: bool = False) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        cmd,
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
        check=True,
    )


def measure(path: pathlib.Path, target_i: float, target_lra: float, target_tp: float) -> dict[str, Any]:
    filt = f"loudnorm=I={target_i}:LRA={target_lra}:TP={target_tp}:print_format=json"
    proc = run(
        [
            "ffmpeg",
            "-hide_banner",
            "-nostats",
            "-i",
            str(path),
            "-af",
            filt,
            "-f",
            "null",
            "-",
        ],
        capture=True,
    )
    return parse_loudnorm_json((proc.stderr or "") + "\n" + (proc.stdout or ""))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=pathlib.Path)
    parser.add_argument("output", type=pathlib.Path)
    parser.add_argument("--target-i", type=float, default=-16.0)
    parser.add_argument("--target-lra", type=float, default=7.0)
    parser.add_argument("--target-tp", type=float, default=-1.5)
    parser.add_argument("--audio-bitrate", default="192k")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    if args.output.exists() and not args.force:
        raise SystemExit(f"output exists, pass --force to overwrite: {args.output}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    first = measure(args.input, args.target_i, args.target_lra, args.target_tp)
    loudnorm = (
        f"loudnorm=I={args.target_i}:LRA={args.target_lra}:TP={args.target_tp}:"
        f"measured_I={first['input_i']}:"
        f"measured_TP={first['input_tp']}:"
        f"measured_LRA={first['input_lra']}:"
        f"measured_thresh={first['input_thresh']}:"
        f"offset={first['target_offset']}:linear=true:print_format=summary"
    )
    run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(args.input),
            "-map",
            "0:v:0",
            "-map",
            "0:a:0",
            "-c:v",
            "copy",
            "-af",
            loudnorm,
            "-ar",
            "48000",
            "-ac",
            "2",
            "-c:a",
            "aac",
            "-b:a",
            args.audio_bitrate,
            "-movflags",
            "+faststart",
            str(args.output),
        ]
    )
    second = measure(args.output, args.target_i, args.target_lra, args.target_tp)
    print(
        json.dumps(
            {
                "input": str(args.input),
                "output": str(args.output),
                "target_i": args.target_i,
                "target_lra": args.target_lra,
                "target_tp": args.target_tp,
                "before": first,
                "after": second,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
