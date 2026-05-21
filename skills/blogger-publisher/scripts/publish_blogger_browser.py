#!/usr/bin/env python3
"""Create Blogger drafts or publish posts through the signed-in OpenClaw browser."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import textwrap
import time
from pathlib import Path
from typing import Any, Dict, Optional


DEFAULT_BLOG_ID = "746790007201931785"
DEFAULT_PROFILE = "openclaw"
DEFAULT_ACCOUNT = "zwl9999999@gmail.com"
OPENCLAW_BIN_CANDIDATES = [
    Path.home() / ".npm-global" / "bin" / "openclaw",
    Path("/Users/openclaw-user/.npm-global/bin/openclaw"),
]
OPENCLAW_CLI_HOME = "/Users/openclaw-user"


class BloggerBrowserError(RuntimeError):
    """Raised when Blogger browser automation cannot continue safely."""


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
        raise BloggerBrowserError(f"Command failed: {' '.join(cmd)}\n{detail}") from exc
    except subprocess.TimeoutExpired as exc:
        raise BloggerBrowserError(f"Command timed out: {' '.join(cmd)}") from exc
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
    raise BloggerBrowserError(f"Timed out waiting for Blogger page state. Last state: {last}")


def read_html(args: argparse.Namespace) -> str:
    if args.html_file:
        return Path(args.html_file).read_text(encoding="utf-8")
    if args.html:
        return args.html
    raise BloggerBrowserError("Provide --html or --html-file.")


def account_and_page_state(profile: str, blog_id: str) -> Dict[str, Any]:
    return evaluate(
        profile,
        f"""
        const text = document.body ? document.body.innerText : "";
        const account = Array.from(document.querySelectorAll("button, a"))
          .map(el => (el.getAttribute("aria-label") || el.textContent || "").trim())
          .find(t => t.includes("Google 帳戶") || t.includes("Google Account")) || "";
        const selectedBlog = Array.from(document.querySelectorAll("option"))
          .find(el => el.selected)?.textContent?.trim() || "";
        const createButton = Array.from(document.querySelectorAll("button, [role=button], a"))
          .some(el => /新文章|建立新文章|New post/i.test((el.textContent || el.getAttribute("aria-label") || "").trim()));
        const editor = location.href.includes("/blog/post/edit/{blog_id}/");
        return {{
          url: location.href,
          title: document.title,
          account,
          selectedBlog,
          hasExpectedAccount: account.includes({js_string(DEFAULT_ACCOUNT)}),
          hasCreateButton: createButton,
          isEditor: editor,
          textSample: text.slice(0, 300)
        }};
        """,
    )


def ensure_account(profile: str, blog_id: str, expected_account: str) -> Dict[str, Any]:
    state = account_and_page_state(profile, blog_id)
    account = str(state.get("account", ""))
    if expected_account and expected_account not in account:
        raise BloggerBrowserError(
            f"Blogger is not signed in as {expected_account}. Current account label: {account!r}"
        )
    return state


def open_posts_page(profile: str, blog_id: str) -> None:
    browser(profile, "navigate", f"https://www.blogger.com/blog/posts/{blog_id}", timeout=90)
    wait_until(
        profile,
        f"""
        const hasBlog = location.href.includes("/blog/posts/{blog_id}");
        const hasNewPost = Array.from(document.querySelectorAll("button, [role=button], a"))
          .some(el => /新文章|建立新文章|New post/i.test((el.textContent || el.getAttribute("aria-label") || "").trim()));
        return {{ ok: hasBlog && hasNewPost, url: location.href, hasNewPost }};
        """,
        timeout_s=45,
    )


def click_new_post(profile: str) -> None:
    result = evaluate(
        profile,
        """
        const candidates = Array.from(document.querySelectorAll("button, [role=button], a"));
        const button = candidates.find(el => /新文章|建立新文章|New post/i.test((el.textContent || el.getAttribute("aria-label") || "").trim()));
        if (!button) return { ok: false, error: "new post button not found" };
        button.click();
        return { ok: true, text: (button.textContent || button.getAttribute("aria-label") || "").trim() };
        """,
    )
    if not isinstance(result, dict) or not result.get("ok"):
        raise BloggerBrowserError(f"Could not click Blogger new-post button: {result}")


def wait_for_editor(profile: str, blog_id: str) -> Dict[str, Any]:
    return wait_until(
        profile,
        f"""
        const titleInput = Array.from(document.querySelectorAll("input"))
          .find(el => /標題|Title/i.test(el.getAttribute("aria-label") || ""));
        const editorFrame = Array.from(document.querySelectorAll("iframe"))
          .find(f => {{
            try {{
              return !!(f.contentDocument && f.contentDocument.body && f.contentDocument.body.isContentEditable);
            }} catch (_) {{
              return false;
            }}
          }});
        return {{
          ok: location.href.includes("/blog/post/edit/{blog_id}/") && !!titleInput && !!editorFrame,
          url: location.href,
          hasTitle: !!titleInput,
          hasEditorFrame: !!editorFrame
        }};
        """,
        timeout_s=45,
    )


def fill_editor(
    profile: str,
    *,
    title: str,
    html: str,
    labels: str,
) -> Dict[str, Any]:
    return evaluate(
        profile,
        f"""
        const title = {js_string(title)};
        const html = {js_string(html)};
        const labels = {js_string(labels)};

        function fire(el) {{
          for (const name of ["input", "change", "keyup", "blur"]) {{
            el.dispatchEvent(new Event(name, {{ bubbles: true }}));
          }}
        }}

        const titleInput = Array.from(document.querySelectorAll("input"))
          .find(el => /標題|Title/i.test(el.getAttribute("aria-label") || ""));
        if (!titleInput) return {{ ok: false, error: "title input not found" }};
        titleInput.focus();
        titleInput.value = title;
        fire(titleInput);

        const frame = Array.from(document.querySelectorAll("iframe"))
          .find(f => {{
            try {{
              return !!(f.contentDocument && f.contentDocument.body && f.contentDocument.body.isContentEditable);
            }} catch (_) {{
              return false;
            }}
          }});
        if (!frame) return {{ ok: false, error: "editor iframe not found" }};
        const doc = frame.contentDocument;
        const body = doc.body;
        body.focus();
        body.innerHTML = html || "<p>&nbsp;</p>";
        body.dispatchEvent(new InputEvent("input", {{
          bubbles: true,
          composed: true,
          inputType: "insertHTML",
          data: null
        }}));
        body.dispatchEvent(new Event("change", {{ bubbles: true }}));
        body.dispatchEvent(new Event("blur", {{ bubbles: true }}));

        if (labels) {{
          const labelBox = Array.from(document.querySelectorAll("textarea, input"))
            .find(el => /標籤|Labels/i.test(el.getAttribute("aria-label") || ""));
          if (labelBox) {{
            labelBox.focus();
            labelBox.value = labels;
            fire(labelBox);
          }}
        }}

        return {{
          ok: true,
          url: location.href,
          title,
          labels,
          bodyLength: body.innerText.length,
          htmlLength: body.innerHTML.length
        }};
        """,
        timeout=90,
    )


def click_publish(profile: str, blog_id: str) -> Dict[str, Any]:
    first = evaluate(
        profile,
        """
        function visible(el) {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return rect.width > 0
            && rect.height > 0
            && rect.bottom > 0
            && rect.right > 0
            && rect.top < innerHeight
            && rect.left < innerWidth
            && style.visibility !== "hidden"
            && style.display !== "none"
            && style.opacity !== "0";
        }
        const buttons = Array.from(document.querySelectorAll("button, [role=button]"))
          .filter(el => !el.disabled && el.getAttribute("aria-disabled") !== "true" && visible(el));
        const publish = buttons.find(el => {
          const aria = (el.getAttribute("aria-label") || "").trim();
          const title = (el.getAttribute("title") || "").trim();
          const text = (el.textContent || "").trim();
          return /^(發布|Publish)$/.test(aria)
            || /^(發布|Publish)$/.test(title)
            || /^(發布|Publish)$/.test(text)
            || /^.+(發布|Publish)$/.test(text);
        });
        if (!publish) return { ok: false, error: "publish button not found" };
        publish.click();
        return { ok: true, clicked: (publish.textContent || publish.getAttribute("aria-label") || "").trim() };
        """,
        timeout=30,
    )
    if not isinstance(first, dict) or not first.get("ok"):
        raise BloggerBrowserError(f"Could not click publish button: {first}")

    time.sleep(1.5)
    confirm = evaluate(
        profile,
        """
        function visible(el) {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return rect.width > 0
            && rect.height > 0
            && rect.bottom > 0
            && rect.right > 0
            && rect.top < innerHeight
            && rect.left < innerWidth
            && style.visibility !== "hidden"
            && style.display !== "none"
            && style.opacity !== "0";
        }
        const visibleDialogs = Array.from(document.querySelectorAll('[role="alertdialog"], [role="dialog"], [aria-modal="true"]'))
          .filter(visible);
        const dialog = visibleDialogs[0] || document.body;
        const buttons = Array.from(dialog.querySelectorAll("button, [role=button]"))
          .filter(el => !el.disabled && el.getAttribute("aria-disabled") !== "true" && visible(el));
        const confirmButton = buttons.find(el => {
          const aria = (el.getAttribute("aria-label") || "").trim();
          const title = (el.getAttribute("title") || "").trim();
          const text = (el.textContent || "").trim();
          return /^(確認|發布|Publish|Confirm)$/.test(aria)
            || /^(確認|發布|Publish|Confirm)$/.test(title)
            || /^(確認|發布|Publish|Confirm)$/.test(text)
            || /^.+(確認|發布|Publish|Confirm)$/.test(text);
        });
        if (!confirmButton) {
          return {
            ok: false,
            needsManualConfirm: true,
            visibleButtons: buttons.map(el => (el.textContent || el.getAttribute("aria-label") || "").trim()).filter(Boolean).slice(0, 20)
          };
        }
        confirmButton.click();
        return { ok: true, clicked: (confirmButton.textContent || confirmButton.getAttribute("aria-label") || "").trim() };
        """,
        timeout=30,
    )
    if not isinstance(confirm, dict) or not confirm.get("ok"):
        raise BloggerBrowserError(
            "Publish confirmation needs manual handling or Blogger changed the dialog: "
            + json.dumps(confirm, ensure_ascii=False)
        )
    time.sleep(3)
    return account_and_page_state(profile, blog_id)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create Blogger drafts or publish posts through OpenClaw's signed-in browser."
    )
    parser.add_argument("--profile", default=DEFAULT_PROFILE, help="OpenClaw browser profile name.")
    parser.add_argument("--blog-id", default=DEFAULT_BLOG_ID)
    parser.add_argument("--expected-account", default=DEFAULT_ACCOUNT)
    parser.add_argument("--title")
    parser.add_argument("--html")
    parser.add_argument("--html-file")
    parser.add_argument("--labels", default="")
    parser.add_argument("--use-current-editor", action="store_true")
    parser.add_argument("--publish", action="store_true", help="Click Blogger's publish flow.")
    parser.add_argument("--dry-run", action="store_true", help="Only check the signed-in Blogger page.")
    args = parser.parse_args()

    try:
        if args.dry_run:
            open_posts_page(args.profile, args.blog_id)
            state = ensure_account(args.profile, args.blog_id, args.expected_account)
            print(json.dumps({"ok": True, "mode": "dry-run", "state": state}, ensure_ascii=False, indent=2))
            return 0

        if not args.title:
            raise BloggerBrowserError("Provide --title.")
        html = read_html(args)

        if args.use_current_editor:
            editor = wait_for_editor(args.profile, args.blog_id)
        else:
            open_posts_page(args.profile, args.blog_id)
            ensure_account(args.profile, args.blog_id, args.expected_account)
            click_new_post(args.profile)
            editor = wait_for_editor(args.profile, args.blog_id)

        filled = fill_editor(args.profile, title=args.title, html=html, labels=args.labels)
        if not isinstance(filled, dict) or not filled.get("ok"):
            raise BloggerBrowserError(f"Could not fill Blogger editor: {filled}")

        time.sleep(4)
        state = account_and_page_state(args.profile, args.blog_id)
        result: Dict[str, Any] = {
            "ok": True,
            "blog_id": args.blog_id,
            "title": args.title,
            "edit_url": filled.get("url") or editor.get("url"),
            "publish_requested": args.publish,
            "state": state,
        }
        if args.publish:
            result["publish_result"] = click_publish(args.profile, args.blog_id)
            result["status"] = "publish-clicked"
        else:
            result["status"] = "draft-filled"

        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except BloggerBrowserError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
