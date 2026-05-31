#!/usr/bin/env python3
"""Create a contact-sheet PNG from rendered article-video slides."""

from __future__ import annotations

import argparse
import json
import math
import re
import shutil
import subprocess
import tempfile
from pathlib import Path


def natural_key(path: Path) -> list[object]:
    parts: list[object] = []
    for part in re.split(r"(\d+)", path.name):
        if part.isdigit():
            parts.append(int(part))
        else:
            parts.append(part.lower())
    return parts


def discover_slide_images(artifact_dir: Path) -> list[Path]:
    candidates = [
        artifact_dir / "slides" / "attributed",
        artifact_dir / "slides",
        artifact_dir / "homepage",
    ]
    for directory in candidates:
        if not directory.exists():
            continue
        images = sorted(directory.glob("*.png"), key=natural_key)
        if images:
            return images
    return []


def link_or_copy(src: Path, dst: Path) -> None:
    try:
        dst.symlink_to(src)
    except OSError:
        shutil.copy2(src, dst)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a slide contact sheet with ffmpeg.")
    parser.add_argument("artifact_dir", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--json-out", type=Path)
    parser.add_argument("--cols", type=int, default=4)
    parser.add_argument("--thumb-width", type=int, default=480)
    parser.add_argument("--thumb-height", type=int, default=270)
    parser.add_argument("--max-slides", type=int, default=40)
    args = parser.parse_args()

    artifact_dir = args.artifact_dir.resolve()
    output = args.output or artifact_dir / "review" / "slide-contact-sheet.png"
    json_out = args.json_out or output.with_suffix(".json")
    images = discover_slide_images(artifact_dir)[: max(1, args.max_slides)]

    result = {
        "artifact_dir": str(artifact_dir),
        "output": str(output),
        "slide_count": len(images),
        "slides": [str(path.relative_to(artifact_dir)) for path in images],
        "status": "PASS",
        "errors": [],
    }

    if not images:
        result["status"] = "FAIL"
        result["errors"].append(
            {
                "code": "missing_slide_images",
                "message": "No rendered slide PNGs found under slides/attributed, slides, or homepage.",
            }
        )
    elif not shutil.which("ffmpeg"):
        result["status"] = "FAIL"
        result["errors"].append(
            {
                "code": "ffmpeg_missing",
                "message": "ffmpeg is required to build the contact sheet.",
            }
        )
    else:
        output.parent.mkdir(parents=True, exist_ok=True)
        rows = max(1, math.ceil(len(images) / max(1, args.cols)))
        with tempfile.TemporaryDirectory(prefix="openclaw-slide-contact-") as tmp:
            tmp_dir = Path(tmp)
            for idx, image in enumerate(images, start=1):
                link_or_copy(image, tmp_dir / f"slide-{idx:03d}.png")

            vf = (
                f"scale={args.thumb_width}:{args.thumb_height}:force_original_aspect_ratio=decrease,"
                f"pad={args.thumb_width}:{args.thumb_height}:(ow-iw)/2:(oh-ih)/2:white,"
                f"tile={args.cols}x{rows}:padding=12:margin=12:color=white"
            )
            command = [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-framerate",
                "1",
                "-i",
                str(tmp_dir / "slide-%03d.png"),
                "-vf",
                vf,
                "-frames:v",
                "1",
                str(output),
            ]
            result["command"] = command
            proc = subprocess.run(command, text=True, capture_output=True)
            if proc.returncode != 0:
                result["status"] = "FAIL"
                result["errors"].append(
                    {
                        "code": "ffmpeg_failed",
                        "message": proc.stderr.strip() or "ffmpeg contact sheet command failed.",
                    }
                )

    payload = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    json_out.parent.mkdir(parents=True, exist_ok=True)
    json_out.write_text(payload, encoding="utf-8")
    print(payload, end="")
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
