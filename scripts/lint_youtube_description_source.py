#!/usr/bin/env python3
"""Lint YouTube metadata descriptions for mobile-visible source URLs."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse


SOURCE_LABEL = "文章來源："
FALLBACK_LABEL = "網址顯示備用："
BANNED_LABEL = "完整網址文字版"


def _load_input(path: Path) -> tuple[str, str | None]:
    text = path.read_text(encoding="utf-8")
    if path.suffix.lower() != ".json":
        return text, None

    data = json.loads(text)
    if not isinstance(data, dict):
        raise ValueError(f"{path}: JSON root must be an object")

    description = data.get("description")
    if not isinstance(description, str):
        raise ValueError(f"{path}: JSON must include string field 'description'")

    source_url = data.get("source_url")
    if not isinstance(source_url, str):
        source_url = data.get("url") if isinstance(data.get("url"), str) else None
    if not isinstance(source_url, str):
        source_url = None

    return description, source_url


def _next_nonempty(lines: list[str], start: int) -> int | None:
    for idx in range(start, len(lines)):
        if lines[idx].strip():
            return idx
    return None


def _source_tail(source_url: str | None) -> tuple[str | None, str | None]:
    if not source_url:
        return None, None

    parsed = urlparse(source_url)
    domain = parsed.netloc or None

    host = parsed.netloc.lower()
    query = parse_qs(parsed.query)
    if "youtube.com" in host and query.get("v"):
        return domain, f"v={query['v'][0]}"

    path_parts = [part for part in parsed.path.split("/") if part]
    if path_parts:
        return domain, path_parts[-1]

    if parsed.query:
        return domain, parsed.query

    return domain, None


def lint_description(
    description: str,
    source_url: str | None,
    *,
    max_fallback_line_chars: int,
) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    lines = [line.rstrip() for line in description.splitlines()]

    inline_source_lines = [
        idx + 1
        for idx, line in enumerate(lines)
        if re.match(r"^\s*文章來源：\s*https?://", line)
    ]
    if inline_source_lines:
        errors.append(
            "Do not put the source label and raw URL on one line "
            f"(line(s): {', '.join(map(str, inline_source_lines))})."
        )

    if BANNED_LABEL in description:
        errors.append(f"Do not add a separate '{BANNED_LABEL}' block.")

    source_label_indexes = [
        idx for idx, line in enumerate(lines) if line.strip() == SOURCE_LABEL
    ]
    if not source_label_indexes:
        errors.append(f"Missing standalone '{SOURCE_LABEL}' line.")
        return {
            "status": "FAIL",
            "errors": errors,
            "warnings": warnings,
            "source_url": source_url,
        }

    if len(source_label_indexes) > 1:
        errors.append(f"Expected one '{SOURCE_LABEL}' block, found {len(source_label_indexes)}.")

    source_label_idx = source_label_indexes[0]
    raw_url_idx = _next_nonempty(lines, source_label_idx + 1)
    raw_url = lines[raw_url_idx].strip() if raw_url_idx is not None else ""
    if not re.match(r"^https?://\S+$", raw_url):
        errors.append(
            f"The first non-empty line after '{SOURCE_LABEL}' must be a raw http(s) URL."
        )
    elif source_url and raw_url != source_url:
        errors.append(
            "Raw URL after source label must match source_url exactly: "
            f"expected {source_url!r}, got {raw_url!r}."
        )

    if raw_url_idx is None:
        fallback_label_idx = None
    else:
        fallback_label_idx = None
        for idx in range(raw_url_idx + 1, min(len(lines), raw_url_idx + 8)):
            if lines[idx].strip() == FALLBACK_LABEL:
                fallback_label_idx = idx
                break

    if fallback_label_idx is None:
        errors.append(
            f"Missing immediate '{FALLBACK_LABEL}' line after the raw URL."
        )
        fallback_lines: list[str] = []
    else:
        fallback_lines = []
        for line in lines[fallback_label_idx + 1 :]:
            stripped = line.strip()
            if not stripped:
                break
            fallback_lines.append(stripped)

        if not fallback_lines:
            errors.append(f"'{FALLBACK_LABEL}' must include readable fallback URL lines.")

    for line in fallback_lines:
        if "..." in line:
            errors.append("Fallback URL lines must not contain '...'.")
        if len(line) > max_fallback_line_chars:
            errors.append(
                "Fallback line is too long for mobile readability "
                f"({len(line)} chars > {max_fallback_line_chars}): {line!r}."
            )

    expected_domain, expected_tail = _source_tail(source_url or raw_url)
    fallback_joined = "".join(fallback_lines)
    fallback_spaced = " ".join(fallback_lines)

    if expected_domain and expected_domain not in fallback_joined and expected_domain not in fallback_spaced:
        errors.append(f"Fallback lines must visibly include domain '{expected_domain}'.")

    tail_visible = False
    if expected_tail:
        tail_visible = expected_tail in fallback_joined or expected_tail in fallback_spaced
        if expected_tail.startswith("v="):
            video_id = expected_tail[2:]
            tail_visible = tail_visible or video_id in fallback_joined or video_id in fallback_spaced

    if expected_tail and not tail_visible:
        errors.append(f"Fallback lines must visibly include final URL tail '{expected_tail}'.")

    if len(description.strip()) < 200:
        warnings.append("Description looks very short; include summary and learning points.")

    return {
        "status": "FAIL" if errors else "PASS",
        "errors": errors,
        "warnings": warnings,
        "source_url": source_url,
        "raw_url": raw_url,
        "fallback_lines": fallback_lines,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fail YouTube metadata descriptions whose source URL will be hidden on mobile."
    )
    parser.add_argument("paths", nargs="+", type=Path, help="metadata.json or plain text files")
    parser.add_argument(
        "--max-fallback-line-chars",
        type=int,
        default=36,
        help="maximum characters allowed on each fallback URL line",
    )
    parser.add_argument("--json-out", type=Path, help="write full lint result JSON")
    args = parser.parse_args()

    results = []
    exit_code = 0
    for path in args.paths:
        try:
            description, source_url = _load_input(path)
            result = lint_description(
                description,
                source_url,
                max_fallback_line_chars=args.max_fallback_line_chars,
            )
        except Exception as exc:  # noqa: BLE001 - command-line lint output should be explicit.
            result = {"status": "FAIL", "errors": [str(exc)], "warnings": []}

        result["path"] = str(path)
        results.append(result)
        if result["status"] != "PASS":
            exit_code = 1

    payload = {"status": "FAIL" if exit_code else "PASS", "results": results}

    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    for result in results:
        print(f"{result['status']} {result['path']}")
        for error in result.get("errors", []):
            print(f"  ERROR: {error}")
        for warning in result.get("warnings", []):
            print(f"  WARN: {warning}")

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
