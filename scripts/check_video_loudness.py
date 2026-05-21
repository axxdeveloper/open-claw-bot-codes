#!/usr/bin/env python3
"""Check final video loudness with ffmpeg loudnorm measurement."""

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


def measure(path: pathlib.Path, target_i: float, target_lra: float, target_tp: float) -> dict[str, Any]:
    filt = f"loudnorm=I={target_i}:LRA={target_lra}:TP={target_tp}:print_format=json"
    proc = subprocess.run(
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
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or f"ffmpeg exited {proc.returncode}")
    return parse_loudnorm_json(proc.stderr + "\n" + proc.stdout)


def as_float(data: dict[str, Any], key: str) -> float:
    return float(str(data[key]).strip())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("videos", nargs="+", type=pathlib.Path)
    parser.add_argument("--target-i", type=float, default=-16.0, help="loudnorm target integrated LUFS")
    parser.add_argument("--target-lra", type=float, default=7.0, help="loudnorm target loudness range")
    parser.add_argument("--target-tp", type=float, default=-1.5, help="loudnorm target true peak dBTP")
    parser.add_argument("--min-i", type=float, default=-18.0, help="fail below this integrated LUFS")
    parser.add_argument("--max-i", type=float, default=-14.0, help="fail above this integrated LUFS")
    parser.add_argument("--max-tp", type=float, default=-1.0, help="fail above this true peak dBTP")
    parser.add_argument("--max-lra", type=float, default=10.0, help="fail above this loudness range")
    parser.add_argument("--json-out", type=pathlib.Path, help="optional JSON report path")
    parser.add_argument("--warn-only", action="store_true", help="always exit 0 after printing findings")
    args = parser.parse_args()

    results: list[dict[str, Any]] = []
    failed = False

    for video in args.videos:
        data = measure(video, args.target_i, args.target_lra, args.target_tp)
        input_i = as_float(data, "input_i")
        input_tp = as_float(data, "input_tp")
        input_lra = as_float(data, "input_lra")
        checks = {
            "too_quiet": input_i < args.min_i,
            "too_loud": input_i > args.max_i,
            "true_peak_too_hot": input_tp > args.max_tp,
            "lra_too_wide": input_lra > args.max_lra,
        }
        status = "PASS" if not any(checks.values()) else "FAIL"
        failed = failed or status == "FAIL"
        result = {
            "video": str(video),
            "status": status,
            "input_i_lufs": input_i,
            "input_tp_dbtp": input_tp,
            "input_lra": input_lra,
            "input_thresh": as_float(data, "input_thresh"),
            "target_offset": as_float(data, "target_offset"),
            "checks": checks,
        }
        results.append(result)
        print(
            f"{status} {video}: "
            f"I={input_i:.2f} LUFS, TP={input_tp:.2f} dBTP, LRA={input_lra:.2f}"
        )

    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n")

    return 0 if args.warn_only or not failed else 1


if __name__ == "__main__":
    sys.exit(main())
