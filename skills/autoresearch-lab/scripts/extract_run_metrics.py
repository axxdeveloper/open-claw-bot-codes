#!/usr/bin/env python3
"""Extract autoresearch run metrics from run.log.

Usage:
  python3 extract_run_metrics.py run.log
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

PATTERNS = {
    "val_bpb": re.compile(r"^val_bpb:\s*([0-9.]+)", re.MULTILINE),
    "peak_vram_mb": re.compile(r"^peak_vram_mb:\s*([0-9.]+)", re.MULTILINE),
    "training_seconds": re.compile(r"^training_seconds:\s*([0-9.]+)", re.MULTILINE),
    "total_seconds": re.compile(r"^total_seconds:\s*([0-9.]+)", re.MULTILINE),
}


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: extract_run_metrics.py <run.log>", file=sys.stderr)
        return 2

    log_path = Path(sys.argv[1])
    if not log_path.exists():
        print(json.dumps({"ok": False, "error": f"missing file: {log_path}"}))
        return 1

    text = log_path.read_text(encoding="utf-8", errors="replace")
    out = {"ok": True, "path": str(log_path)}

    for key, pat in PATTERNS.items():
        m = pat.search(text)
        out[key] = float(m.group(1)) if m else None

    if out["peak_vram_mb"] is not None:
        out["memory_gb"] = round(out["peak_vram_mb"] / 1024.0, 1)
    else:
        out["memory_gb"] = None

    out["status_hint"] = "crash" if out["val_bpb"] is None else "ok"
    print(json.dumps(out, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
