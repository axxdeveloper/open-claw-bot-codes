#!/usr/bin/env python3
"""Prepare or publish Threads posts through the signed-in OpenClaw browser."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import textwrap
import time
from pathlib import Path
from typing import Any, Dict


DEFAULT_PROFILE = "openclaw"
DEFAULT_HOME_URL = "https://www.threads.com/"
DEFAULT_EXPECTED_USERNAME = "todayshipthreads"
DEFAULT_MAX_CHARS = 500
OPENCLAW_BIN_CANDIDATES = [
    Path.home() / ".npm-global" / "bin" / "openclaw",
    Path("/Users/openclaw-user/.npm-global/bin/openclaw"),
]
OPENCLAW_CLI_HOME = "/Users/openclaw-user"


class ThreadsBrowserError(RuntimeError):
    """Raised when Threads browser automation cannot continue safely."""


def run_openclaw(args: list[str], *, timeout: int = 90) -> str:
    openclaw_bin = shutil.which("openclaw")
    if not openclaw_bin:
        openclaw_bin = next((str(path) for path in OPENCLAW_BIN_CANDIDATES if path.exists()), "openclaw")
    cmd = [
        openclaw_bin,
        "browser",
        "--browser-profile",
        args[0],
        "--timeout",
        str(max(timeout * 1000, 30000)),
        *args[1:],
    ]
    try:
        env = os.environ.copy()
        env["HOME"] = OPENCLAW_CLI_HOME
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env,
        )
    except subprocess.CalledProcessError as exc:
        detail = (exc.stderr or exc.stdout or "").strip()
        raise ThreadsBrowserError(f"Command failed: {' '.join(cmd)}\n{detail}") from exc
    except subprocess.TimeoutExpired as exc:
        raise ThreadsBrowserError(f"Command timed out: {' '.join(cmd)}") from exc
    return result.stdout.strip()


def browser(profile: str, *args: str, timeout: int = 90) -> str:
    return run_openclaw([profile, *args], timeout=timeout)


def js_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def evaluate(profile: str, body: str, *, timeout: int = 90) -> Any:
    fn = "() => {\n" + textwrap.indent(body.strip(), "  ") + "\n}"
    out = browser(profile, "evaluate", "--fn", fn, timeout=timeout)
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        return out


def wait_until(
    profile: str,
    body: str,
    *,
    timeout_s: int = 30,
    interval_s: float = 1.0,
) -> Any:
    deadline = time.time() + timeout_s
    last: Any = None
    while time.time() < deadline:
        last = evaluate(profile, body, timeout=30)
        if isinstance(last, dict) and last.get("ok"):
            return last
        if last is True:
            return last
        time.sleep(interval_s)
    raise ThreadsBrowserError(f"Timed out waiting for Threads page state. Last state: {last}")


def normalize_username(username: str) -> str:
    return username.strip().lstrip("@").lower()


def read_post_text(args: argparse.Namespace) -> str:
    if args.text_file:
        return Path(args.text_file).read_text(encoding="utf-8").strip()
    if args.text:
        return args.text.strip()
    raise ThreadsBrowserError("Provide --text or --text-file.")


def normalize_post_text_for_threads(text: str) -> str:
    """Keep single-post Threads text stable in the web composer.

    Threads' Lexical editor may collapse pasted/newline-inserted paragraphs when
    driven through CDP. Normalizing to one line avoids source URLs being joined
    without visible separation and makes post verification deterministic.
    """

    normalized = re.sub(r"[ \t]*\r?\n[ \t]*", " ", text.strip())
    normalized = re.sub(r"[ \t]{2,}", " ", normalized)
    return normalized.strip()


def open_home(profile: str) -> None:
    browser(profile, "navigate", DEFAULT_HOME_URL, timeout=90)
    wait_until(
        profile,
        """
        return {
          ok: location.hostname.includes("threads.com") && document.body && document.body.innerText.length > 0,
          url: location.href,
          title: document.title,
          textLength: document.body ? document.body.innerText.length : 0
        };
        """,
        timeout_s=45,
    )


def page_state(profile: str, expected_username: str = "") -> Dict[str, Any]:
    return evaluate(
        profile,
        f"""
        const text = document.body ? document.body.innerText : "";
        const expected = {js_string(normalize_username(expected_username))};

        function label(el) {{
          return (el.getAttribute("aria-label") || el.innerText || el.textContent || "").trim();
        }}

        const controls = Array.from(document.querySelectorAll("button, [role=button], a"));
        const labels = controls.map(label).filter(Boolean);
        const hasComposerEntry = labels.some(t =>
          /^(New thread|Create|What's new\\?|Post|新增串文|建立串文|發佈串文|發布串文|有什麼新鮮事\\?)$/i.test(t)
        );
        const hasLoginPrompt = /Log in or sign up|Continue with Instagram|Log in with username|Join Threads|登入|加入 Threads/i.test(text);
        const profileMatch = location.pathname.match(/^\\/@([^/?#]+)/);
        const ownProfileUsername = (() => {{
          const profile = controls.find(el => {{
            const t = label(el);
            if (!/^(Profile|個人檔案|個人資料)$/i.test(t)) return false;
            try {{
              return /^\\/@[^/]+/.test(new URL(el.href || el.getAttribute("href") || "", location.href).pathname);
            }} catch (_) {{
              return false;
            }}
          }});
          if (!profile) return "";
          try {{
            return new URL(profile.href || profile.getAttribute("href") || "", location.href).pathname.match(/^\\/@([^/]+)/)?.[1] || "";
          }} catch (_) {{
            return "";
          }}
        }})();
        const hrefUsernames = Array.from(document.querySelectorAll('a[href*="/@"]'))
          .map(a => {{
            try {{
              return new URL(a.href).pathname.match(/^\\/@([^/]+)/)?.[1] || "";
            }} catch (_) {{
              return "";
            }}
          }})
          .filter(Boolean);
        const uniqueUsernames = Array.from(new Set(hrefUsernames)).slice(0, 25);
        const currentUsername = profileMatch ? profileMatch[1] : "";

        return {{
          url: location.href,
          title: document.title,
          currentUsername,
          ownProfileUsername,
          expectedUsername: expected,
          expectedUsernameSeen: expected ? uniqueUsernames.map(u => u.toLowerCase()).includes(expected) || currentUsername.toLowerCase() === expected || ownProfileUsername.toLowerCase() === expected : false,
          hasComposerEntry,
          hasLoginPrompt,
          looksLoggedIn: hasComposerEntry && !/Log in or sign up|Log in with username|Join Threads|加入 Threads/i.test(text),
          visibleLabels: labels.slice(0, 30),
          usernames: uniqueUsernames,
          textSample: text.slice(0, 500)
        }};
        """,
    )


def discover_current_username(profile: str) -> str:
    state = page_state(profile)
    current = str(state.get("currentUsername") or "")
    if current:
        return current

    clicked = evaluate(
        profile,
        """
        function label(el) {
          return (el.getAttribute("aria-label") || el.innerText || el.textContent || "").trim();
        }
        const controls = Array.from(document.querySelectorAll("button, [role=button], a"));
        const profile = controls.find(el => /^(Profile|個人檔案|個人資料)$/i.test(label(el)));
        if (!profile) return { ok: false, error: "profile button not found", labels: controls.map(label).filter(Boolean).slice(0, 30) };
        profile.click();
        return { ok: true, clicked: label(profile) };
        """,
        timeout=30,
    )
    if not isinstance(clicked, dict) or not clicked.get("ok"):
        return ""

    try:
        result = wait_until(
            profile,
            """
            const match = location.pathname.match(/^\\/@([^/?#]+)/);
            return { ok: !!match, url: location.href, username: match ? match[1] : "" };
            """,
            timeout_s=20,
        )
    except ThreadsBrowserError:
        return ""
    if isinstance(result, dict):
        return str(result.get("username") or "")
    return ""


def location_is_home_like(state: Dict[str, Any]) -> bool:
    url = str(state.get("url") or "")
    return url.rstrip("/") in {"https://www.threads.com", "https://www.threads.com/for_you"}


def ensure_logged_in(profile: str, expected_username: str) -> Dict[str, Any]:
    open_home(profile)
    state = page_state(profile, expected_username)
    if state.get("hasLoginPrompt") and not state.get("hasComposerEntry"):
        raise ThreadsBrowserError(
            "Threads is not fully signed in or is still on onboarding. "
            f"Current state: {json.dumps(state, ensure_ascii=False)}"
        )

    if expected_username:
        actual = str(state.get("ownProfileUsername") or state.get("currentUsername") or "")
        if not actual:
            actual = discover_current_username(profile)
        if actual and normalize_username(actual) != normalize_username(expected_username):
            raise ThreadsBrowserError(
                f"Threads is signed in as @{actual}, expected @{normalize_username(expected_username)}."
            )
        if not location_is_home_like(state):
            browser(profile, "navigate", DEFAULT_HOME_URL, timeout=60)
            wait_until(
                profile,
                """
                const text = document.body ? document.body.innerText : "";
                return {
                  ok: location.hostname.includes("threads.com") && /New thread|What's new\\?|Create|Post|新增串文|建立串文|有什麼新鮮事\\?/i.test(text),
                  url: location.href,
                  textSample: text.slice(0, 300)
                };
                """,
                timeout_s=30,
            )
        state = page_state(profile, expected_username)

    if not state.get("hasComposerEntry"):
        raise ThreadsBrowserError(
            "Could not find the Threads composer entry. "
            f"Current state: {json.dumps(state, ensure_ascii=False)}"
        )
    return state


def open_composer(profile: str) -> Dict[str, Any]:
    result = evaluate(
        profile,
        """
        function label(el) {
          return (el.getAttribute("aria-label") || el.getAttribute("aria-placeholder") || el.getAttribute("placeholder") || el.innerText || el.textContent || "").trim();
        }
        function visible(el) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
        }
        function isPostEditor(el) {
          const tag = el.tagName;
          const text = label(el);
          const type = (el.getAttribute("type") || "").toLowerCase();
          if (type === "search" || /Add a topic|Search|搜尋|主題/i.test(text)) return false;
          return el.isContentEditable || tag === "TEXTAREA" || el.getAttribute("role") === "textbox";
        }
        const existing = Array.from(document.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]'))
          .find(el => visible(el) && isPostEditor(el));
        if (existing) {
          return { ok: true, alreadyOpen: true, editorLabel: label(existing) };
        }

        const controls = Array.from(document.querySelectorAll("button, [role=button], a")).filter(visible);
        const candidates = [
          /^(New thread|新增串文|建立串文)$/i,
          /^(Create|建立|新增)$/i,
          /^(What's new\\?|有什麼新鮮事\\?)$/i
        ];
        for (const pattern of candidates) {
          const button = controls.find(el => pattern.test(label(el)));
          if (button) {
            button.click();
            return { ok: true, clicked: label(button) };
          }
        }
        return {
          ok: false,
          error: "composer entry not found",
          visibleLabels: controls.map(label).filter(Boolean).slice(0, 40)
        };
        """,
        timeout=30,
    )
    if not isinstance(result, dict) or not result.get("ok"):
        raise ThreadsBrowserError(f"Could not open Threads composer: {result}")

    return wait_until(
        profile,
        """
        function label(el) {
          return (el.getAttribute("aria-label") || el.getAttribute("aria-placeholder") || el.getAttribute("placeholder") || el.innerText || el.textContent || "").trim();
        }
        function visible(el) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
        }
        function isPostEditor(el) {
          const tag = el.tagName;
          const text = label(el);
          const type = (el.getAttribute("type") || "").toLowerCase();
          if (type === "search" || /Add a topic|Search|搜尋|主題/i.test(text)) return false;
          return el.isContentEditable || tag === "TEXTAREA" || el.getAttribute("role") === "textbox";
        }
        const editors = Array.from(document.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]'))
          .filter(el => visible(el) && isPostEditor(el));
        const buttons = Array.from(document.querySelectorAll("button, [role=button]"))
          .filter(visible)
          .map(label)
          .filter(Boolean)
          .slice(0, 30);
        return {
          ok: editors.length > 0,
          url: location.href,
          editorCount: editors.length,
          editorLabels: editors.map(label).slice(0, 10),
          visibleButtons: buttons
        };
        """,
        timeout_s=30,
    )


def fill_composer(profile: str, text: str) -> Dict[str, Any]:
    result = evaluate(
        profile,
        f"""
        const postText = {js_string(text)};

        function label(el) {{
          return (el.getAttribute("aria-label") || el.getAttribute("aria-placeholder") || el.getAttribute("placeholder") || el.innerText || el.textContent || "").trim();
        }}
        function visible(el) {{
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
        }}
        function isPostEditor(el) {{
          const tag = el.tagName;
          const text = label(el);
          const type = (el.getAttribute("type") || "").toLowerCase();
          if (type === "search" || /Add a topic|Search|搜尋|主題/i.test(text)) return false;
          return el.isContentEditable || tag === "TEXTAREA" || el.getAttribute("role") === "textbox";
        }}
        function editorText(el) {{
          return (el.value || el.innerText || el.textContent || "").trim();
        }}
        function hasPostButton(root) {{
          return Array.from(root.querySelectorAll("button, [role=button]"))
            .filter(visible)
            .some(el => /^(Post|發佈|發布)$/i.test(label(el)));
        }}
        function dispatchChanged(el) {{
          el.dispatchEvent(new Event("input", {{ bubbles: true, composed: true }}));
          el.dispatchEvent(new Event("change", {{ bubbles: true }}));
        }}

        const editors = Array.from(document.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]'))
          .filter(el => visible(el) && isPostEditor(el));
        const alreadyFilled = editors.find(el => editorText(el) === postText);
        if (alreadyFilled) {{
          return {{
            ok: true,
            alreadyFilled: true,
            url: location.href,
            requestedLength: postText.length,
            editorLength: editorText(alreadyFilled).length,
            editorTextSample: editorText(alreadyFilled).slice(0, 120),
            editorCount: editors.length
          }};
        }}

        const dialogEditors = editors.filter(el => {{
          const dialog = el.closest('[role="dialog"]');
          return dialog && hasPostButton(dialog);
        }});
        const editor = [...dialogEditors].reverse().find(el => !editorText(el))
          || dialogEditors[dialogEditors.length - 1]
          || editors.find(el => el.isContentEditable)
          || editors[0];
        if (!editor) {{
          return {{ ok: false, error: "composer editor not found" }};
        }}

        editor.focus();
        if (editor.tagName === "TEXTAREA" || editor.tagName === "INPUT") {{
          editor.value = postText;
          dispatchChanged(editor);
        }} else {{
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(editor);
          selection.removeAllRanges();
          selection.addRange(range);
          const inserted = document.execCommand("insertText", false, postText);
          if (!inserted && !((editor.innerText || editor.textContent || "").trim())) {{
            editor.textContent = postText;
          }}
          dispatchChanged(editor);
        }}

        const currentEditors = Array.from(document.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]'))
          .filter(el => visible(el) && isPostEditor(el));
        const editorTexts = currentEditors.map(editorText);
        const matchedEditor = currentEditors.find(el => editorText(el) === postText);
        const editorTextValue = matchedEditor ? editorText(matchedEditor) : editorText(editor);
        const postButtons = Array.from(document.querySelectorAll("button, [role=button]"))
          .filter(visible)
          .map(el => ({{
            label: label(el),
            disabled: !!el.disabled || el.getAttribute("aria-disabled") === "true"
          }}))
          .filter(item => /^(Post|發佈|發布)$/i.test(item.label));

        return {{
          ok: !!matchedEditor,
          url: location.href,
          requestedLength: postText.length,
          editorLength: editorTextValue.length,
          editorTextSample: editorTextValue.slice(0, 120),
          editorCount: currentEditors.length,
          matchingEditorCount: currentEditors.filter(el => editorText(el) === postText).length,
          postButtons
        }};
        """,
        timeout=60,
    )
    if isinstance(result, dict) and result.get("ok"):
        return result

    try:
        settled = wait_until(
            profile,
            f"""
            const postText = {js_string(text)};
            function label(el) {{
              return (el.getAttribute("aria-label") || el.getAttribute("aria-placeholder") || el.getAttribute("placeholder") || el.innerText || el.textContent || "").trim();
            }}
            function visible(el) {{
              const rect = el.getBoundingClientRect();
              const style = window.getComputedStyle(el);
              return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
            }}
            function isPostEditor(el) {{
              const tag = el.tagName;
              const text = label(el);
              const type = (el.getAttribute("type") || "").toLowerCase();
              if (type === "search" || /Add a topic|Search|搜尋|主題/i.test(text)) return false;
              return el.isContentEditable || tag === "TEXTAREA" || el.getAttribute("role") === "textbox";
            }}
            function editorText(el) {{
              return (el.value || el.innerText || el.textContent || "").trim();
            }}
            const editors = Array.from(document.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]'))
              .filter(el => visible(el) && isPostEditor(el));
            const matchedEditor = editors.find(el => editorText(el) === postText);
            const editor = matchedEditor || editors.find(el => el.isContentEditable) || editors[0];
            const editorTextValue = editor ? editorText(editor) : "";
            const postButtons = Array.from(document.querySelectorAll("button, [role=button]"))
              .filter(visible)
              .map(el => ({{
                label: label(el),
                disabled: !!el.disabled || el.getAttribute("aria-disabled") === "true"
              }}))
              .filter(item => /^(Post|發佈|發布)$/i.test(item.label));
            return {{
              ok: !!matchedEditor,
              url: location.href,
              requestedLength: postText.length,
              editorLength: editorTextValue.length,
              editorTextSample: editorTextValue.slice(0, 120),
              editorCount: editors.length,
              matchingEditorCount: editors.filter(el => editorText(el) === postText).length,
              postButtons,
              initialResult: {js_string(json.dumps(result, ensure_ascii=False))}
            }};
            """,
            timeout_s=8,
            interval_s=0.25,
        )
        if isinstance(settled, dict):
            return settled
    except ThreadsBrowserError:
        pass
    return result


def click_post(profile: str, post_text: str = "") -> Dict[str, Any]:
    script = """
        const postText = __POST_TEXT__;
        const prefix = postText.slice(0, Math.min(40, postText.length)).trim();

        function label(el) {
          return (el.getAttribute("aria-label") || el.innerText || el.textContent || "").trim();
        }
        function visible(el) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
        }
        function rootText(root) {
          return (root.innerText || root.textContent || "").trim();
        }
        function hasNonEmptyEditor(root) {
          return Array.from(root.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]'))
            .filter(visible)
            .some(el => ((el.value || el.innerText || el.textContent || "").trim()).length > 0);
        }

        const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')).filter(visible);
        const roots = [];
        if (prefix) {
          const matchingDialog = dialogs.find(root => rootText(root).includes(postText) || rootText(root).includes(prefix));
          if (matchingDialog) roots.push(matchingDialog);
        }
        roots.push(...dialogs.filter(hasNonEmptyEditor));
        roots.push(...dialogs);
        roots.push(document);

        const seen = new Set();
        for (const root of roots) {
          if (!root || seen.has(root)) continue;
          seen.add(root);
          const buttons = Array.from(root.querySelectorAll("button, [role=button]"))
            .filter(visible)
            .filter(el => /^(Post|發佈|發布)$/i.test(label(el)));
          const button = buttons.find(el => !el.disabled && el.getAttribute("aria-disabled") !== "true");
          if (button) {
            button.click();
            return {
              ok: true,
              clicked: label(button),
              matchedByText: !!prefix && (rootText(root).includes(postText) || rootText(root).includes(prefix)),
              url: location.href
            };
          }
        }
        return {
          ok: false,
          error: "enabled Post button not found",
          visibleButtons: Array.from(document.querySelectorAll("button, [role=button]"))
            .filter(visible)
            .map(label)
            .filter(Boolean)
            .slice(0, 40)
        };
        """.replace("__POST_TEXT__", js_string(post_text))
    result = evaluate(
        profile,
        script,
        timeout=30,
    )
    if not isinstance(result, dict) or not result.get("ok"):
        raise ThreadsBrowserError(f"Could not click Threads Post button: {result}")
    time.sleep(4)
    return page_state(profile)


def discover_latest_post_url(profile: str, username: str, post_text: str) -> Dict[str, Any]:
    normalized_username = normalize_username(username)
    profile_url = f"https://www.threads.com/@{normalized_username}"
    browser(profile, "navigate", profile_url, timeout=60)
    try:
        wait_until(
            profile,
            f"""
            const expectedPath = "/@{normalized_username}";
            const links = Array.from(document.querySelectorAll('a[href*="/@{normalized_username}/post/"]'));
            return {{
              ok: location.pathname.toLowerCase().startsWith(expectedPath.toLowerCase()) && document.body && document.body.innerText.length > 0,
              url: location.href,
              postLinkCount: links.length
            }};
            """,
            timeout_s=20,
            interval_s=1.0,
        )
    except ThreadsBrowserError:
        pass

    return evaluate(
        profile,
        f"""
        const username = {js_string(normalized_username)};
        const postText = {js_string(post_text)};
        const prefix = postText.slice(0, Math.min(40, postText.length)).trim();

        function absolute(href) {{
          try {{
            return new URL(href, location.href).href.split('?')[0];
          }} catch (_) {{
            return "";
          }}
        }}

        const links = Array.from(document.querySelectorAll('a[href*="/@' + username + '/post/"]'))
          .map(a => {{
            const url = absolute(a.getAttribute("href") || a.href || "");
            const container = a.closest('article, [role="article"], [data-pressable-container="true"], div') || a;
            const text = (container.innerText || a.innerText || a.textContent || "").trim();
            return {{ url, text }};
          }})
          .filter(item => item.url);

        const unique = [];
        const seen = new Set();
        for (const item of links) {{
          if (seen.has(item.url)) continue;
          seen.add(item.url);
          unique.push(item);
        }}

        const match = prefix
          ? unique.find(item => item.text.includes(prefix)) || unique[0]
          : unique[0];

        return {{
          ok: !!match,
          url: location.href,
          post_url: match ? match.url : null,
          matched_by_text: !!(match && prefix && match.text.includes(prefix)),
          candidate_count: unique.length,
          text_prefix: prefix,
          candidates: unique.slice(0, 5)
        }};
        """,
        timeout=60,
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Prepare or publish Threads posts through OpenClaw's signed-in browser."
    )
    parser.add_argument("--profile", default=DEFAULT_PROFILE, help="OpenClaw browser profile name.")
    parser.add_argument("--expected-username", default=DEFAULT_EXPECTED_USERNAME)
    parser.add_argument("--text")
    parser.add_argument("--text-file")
    parser.add_argument("--max-chars", type=int, default=DEFAULT_MAX_CHARS)
    parser.add_argument("--allow-long", action="store_true", help="Allow text longer than --max-chars.")
    parser.add_argument("--publish", action="store_true", help="Click Threads' public Post button.")
    parser.add_argument("--dry-run", action="store_true", help="Only check the signed-in Threads page.")
    args = parser.parse_args()

    try:
        if args.dry_run:
            state = ensure_logged_in(args.profile, args.expected_username)
            print(json.dumps({"ok": True, "mode": "dry-run", "state": state}, ensure_ascii=False, indent=2))
            return 0

        raw_post_text = read_post_text(args)
        post_text = normalize_post_text_for_threads(raw_post_text)
        if not post_text:
            raise ThreadsBrowserError("Post text is empty.")
        if len(post_text) > args.max_chars and not args.allow_long:
            raise ThreadsBrowserError(
                f"Post text is {len(post_text)} characters; the configured single-post limit is {args.max_chars}. "
                "Shorten it or pass --allow-long after checking the Threads UI."
            )

        state = ensure_logged_in(args.profile, args.expected_username)
        composer = open_composer(args.profile)
        filled = fill_composer(args.profile, post_text)
        if not isinstance(filled, dict) or not filled.get("ok"):
            raise ThreadsBrowserError(f"Could not fill Threads composer: {filled}")

        result: Dict[str, Any] = {
            "ok": True,
            "username": args.expected_username,
            "publish_requested": args.publish,
            "status": "composer-filled",
            "text_length": len(post_text),
            "text_normalized_for_threads": post_text != raw_post_text,
            "state": state,
            "composer": composer,
            "filled": filled,
        }
        if args.publish:
            result["publish_result"] = click_post(args.profile, post_text)
            result["post_lookup"] = discover_latest_post_url(args.profile, args.expected_username, post_text)
            if isinstance(result["post_lookup"], dict) and result["post_lookup"].get("post_url"):
                result["post_url"] = result["post_lookup"].get("post_url")
            else:
                result["post_url_warning"] = "post_url_unavailable"
            result["status"] = "post-clicked"

        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except ThreadsBrowserError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
