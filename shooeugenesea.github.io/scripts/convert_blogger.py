#!/usr/bin/env python3
"""
Convert Blogger Atom feed export to Jekyll posts.

Usage:
    python3 scripts/convert_blogger.py

Reads from:
    ~/Downloads/Takeout/Blogger/Blogs/a developer/feed.atom
    ~/Downloads/Takeout/Blogger/Albums/shooeugenesea, developer/

Writes to:
    _posts/          - Jekyll markdown files
    assets/images/   - blog album images + extracted base64 images
"""

import base64
import hashlib
import os
import re
import shutil
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from urllib.parse import unquote_plus

# --- Configuration ---
REPO_DIR = Path(__file__).resolve().parent.parent
FEED_PATH = Path.home() / "Downloads/Takeout/Blogger/Blogs/a developer/feed.atom"
ALBUM_DIR = Path.home() / "Downloads/Takeout/Blogger/Albums/shooeugenesea, developer"
POSTS_DIR = REPO_DIR / "_posts"
BLOG_IMAGES_DIR = REPO_DIR / "assets/images/blog"
EXTRACTED_IMAGES_DIR = REPO_DIR / "assets/images/extracted"

NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "blogger": "http://schemas.google.com/blogger/2018",
}

# --- Stats ---
stats = {
    "posts": 0,
    "base64_extracted": 0,
    "blogger_images_mapped": 0,
    "blogger_images_unmapped": 0,
    "skipped_draft": 0,
    "skipped_non_post": 0,
}


def copy_album_images():
    """Copy album images to assets/images/blog/, normalizing filenames."""
    if not ALBUM_DIR.exists():
        print(f"WARNING: Album directory not found: {ALBUM_DIR}")
        return {}

    filename_map = {}  # original_name -> local_path (for matching)
    BLOG_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    for f in ALBUM_DIR.iterdir():
        if f.name.endswith(".json") or f.name == "metadata.json":
            continue
        if f.is_file():
            # Normalize: spaces to hyphens, lowercase extension
            stem = f.stem.replace(" ", "-")
            ext = f.suffix.lower()
            normalized = f"{stem}{ext}"
            dest = BLOG_IMAGES_DIR / normalized
            # Handle duplicates
            counter = 1
            while dest.exists():
                dest = BLOG_IMAGES_DIR / f"{stem}-{counter}{ext}"
                counter += 1
            shutil.copy2(f, dest)
            rel_path = dest.relative_to(REPO_DIR)
            # Map both original and normalized names
            filename_map[f.name] = str(rel_path)
            filename_map[normalized] = str(rel_path)
            # Also map URL-encoded form
            filename_map[f.name.replace(" ", "+")] = str(rel_path)

    print(f"Copied {len([f for f in BLOG_IMAGES_DIR.iterdir()])} album images")
    return filename_map


def extract_base64_image(data_uri, post_slug, img_index):
    """Extract a base64 data URI to a file, return the local path."""
    match = re.match(r"data:image/([^;]+);base64,(.+)", data_uri, re.DOTALL)
    if not match:
        return None

    img_type = match.group(1).lower()
    b64_data = match.group(2)

    # Clean whitespace from base64 data
    b64_data = re.sub(r"\s+", "", b64_data)

    ext_map = {"jpeg": "jpg", "png": "png", "gif": "gif", "webp": "webp", "svg+xml": "svg"}
    ext = ext_map.get(img_type, img_type)

    try:
        img_bytes = base64.b64decode(b64_data)
    except Exception as e:
        print(f"  WARNING: Failed to decode base64 image in {post_slug}: {e}")
        return None

    # Use hash of content for dedup
    content_hash = hashlib.md5(img_bytes).hexdigest()[:8]
    filename = f"{post_slug}-{img_index}-{content_hash}.{ext}"
    dest = EXTRACTED_IMAGES_DIR / filename

    EXTRACTED_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(img_bytes)
    stats["base64_extracted"] += 1

    return str(dest.relative_to(REPO_DIR))


def rewrite_blogger_image_url(url, album_map):
    """Try to map a blogger.googleusercontent.com URL to a local album image."""
    # Extract filename from URL patterns like:
    # .../s320/Screen+Shot+2018-11-15+at+12.56.08+AM.png
    # .../s16000/DI-before.png

    # Pattern 1: URL ends with /size/filename.ext
    m = re.search(r"/s\d+/(.+)$", url)
    if not m:
        # Pattern 2: URL ends with /filename.ext (no size)
        m = re.search(r"/([^/]+\.\w{3,4})$", url)
    if not m:
        # Pattern 3: URL with =wNNN-hNNN or =sNNN suffix (hash-based, no filename)
        return None

    raw_filename = m.group(1)
    # Remove size suffix like =w659-h474
    raw_filename = re.sub(r"=\w[\w-]*$", "", raw_filename)
    decoded = unquote_plus(raw_filename)
    # Handle double-encoded URLs (%25E6... -> %E6... -> Chinese chars)
    double_decoded = unquote_plus(decoded)

    # Try exact match
    if double_decoded != decoded and double_decoded in album_map:
        stats["blogger_images_mapped"] += 1
        return album_map[double_decoded]
    if decoded in album_map:
        stats["blogger_images_mapped"] += 1
        return album_map[decoded]

    # Try URL-encoded form
    if raw_filename in album_map:
        stats["blogger_images_mapped"] += 1
        return album_map[raw_filename]

    # Try case-insensitive match
    decoded_lower = decoded.lower()
    for key, val in album_map.items():
        if key.lower() == decoded_lower:
            stats["blogger_images_mapped"] += 1
            return val

    return None


def clean_html(content, post_slug, album_map):
    """Clean HTML content: extract base64 images, rewrite blogger URLs, remove artifacts."""
    if not content:
        return ""

    # 1. Extract base64 images
    img_index = 0

    def replace_base64(match):
        nonlocal img_index
        prefix = match.group(1)
        data_uri = match.group(2)
        suffix = match.group(3)
        local_path = extract_base64_image(data_uri, post_slug, img_index)
        img_index += 1
        if local_path:
            return f'{prefix}/{local_path}{suffix}'
        return match.group(0)

    content = re.sub(
        r'(src=["\'])(data:image/[^"\']+)(["\'])',
        replace_base64,
        content,
    )

    # 2. Rewrite blogger.googleusercontent.com image URLs
    def replace_blogger_url(match):
        prefix = match.group(1)
        url = match.group(2)
        suffix = match.group(3)
        local = rewrite_blogger_image_url(url, album_map)
        if local:
            return f'{prefix}/{local}{suffix}'
        stats["blogger_images_unmapped"] += 1
        return match.group(0)  # Keep original URL if no match

    content = re.sub(
        r'(src=["\'])(https://blogger\.googleusercontent\.com/img/[^"\']+)(["\'])',
        replace_blogger_url,
        content,
    )

    # 3. Remove Evernote clipboard artifacts
    content = re.sub(r'\s*style="-en-[^"]*"', "", content)

    # 4. Clean excessive <br> sequences (more than 2 in a row)
    content = re.sub(r"(<br\s*/?>[\s\n]*){3,}", "<br><br>\n", content)

    # 5. Remove XML comments
    content = re.sub(r"<!--.*?-->", "", content, flags=re.DOTALL)

    # 6. Remove empty divs/spans with only whitespace
    content = re.sub(r"<(div|span)[^>]*>\s*</\1>", "", content)

    # 7. Clean up excessive blank lines
    content = re.sub(r"\n{3,}", "\n\n", content)

    return content.strip()


def make_slug(filename, title):
    """Generate a URL-friendly slug from blogger filename or title."""
    if filename:
        # /2019/06/designofeverydaythings-norman-doors.html -> designofeverydaythings-norman-doors
        slug = filename.rstrip("/").split("/")[-1]
        slug = re.sub(r"\.html?$", "", slug)
        return slug

    # Fallback: generate from title
    slug = title.lower()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = slug.strip("-")
    return slug or "untitled"


def escape_yaml(s):
    """Escape a string for YAML front matter."""
    if not s:
        return '""'
    # If it contains special chars, wrap in quotes
    if any(c in s for c in ":{}[]&*?|>!%@`#,\"'"):
        escaped = s.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    return s


def convert_entry(entry, album_map):
    """Convert a single Atom entry to a Jekyll post file."""
    title_el = entry.find("atom:title", NS)
    title = title_el.text if title_el is not None and title_el.text else "Untitled"

    content_el = entry.find("atom:content", NS)
    content_html = content_el.text if content_el is not None else ""

    published_el = entry.find("atom:published", NS)
    pub_str = published_el.text if published_el is not None else None
    if not pub_str:
        return

    # Parse date: 2019-06-18T18:08:00Z or 2019-06-18T18:08:00.001Z
    pub_str_clean = re.sub(r"\.\d+Z$", "Z", pub_str)
    try:
        pub_date = datetime.strptime(pub_str_clean, "%Y-%m-%dT%H:%M:%SZ")
    except ValueError:
        print(f"  WARNING: Could not parse date '{pub_str}' for '{title}'")
        return

    filename_el = entry.find("blogger:filename", NS)
    blogger_filename = filename_el.text if filename_el is not None else None

    # Tags
    categories = entry.findall("atom:category", NS)
    tags = []
    for cat in categories:
        term = cat.attrib.get("term")
        if term:
            tags.append(term)

    slug = make_slug(blogger_filename, title)
    date_str = pub_date.strftime("%Y-%m-%d")
    jekyll_filename = f"{date_str}-{slug}.md"

    # Clean content
    cleaned = clean_html(content_html, slug, album_map)

    # Build front matter
    front_matter = "---\n"
    front_matter += f"layout: post\n"
    front_matter += f"title: {escape_yaml(title)}\n"
    front_matter += f"date: {pub_date.strftime('%Y-%m-%d %H:%M:%S')} +0800\n"
    if tags:
        tags_yaml = ", ".join(escape_yaml(t) for t in tags)
        front_matter += f"tags: [{tags_yaml}]\n"
    front_matter += "---\n"

    post_path = POSTS_DIR / jekyll_filename
    post_path.write_text(front_matter + "\n" + cleaned + "\n", encoding="utf-8")
    stats["posts"] += 1


def main():
    print(f"Feed: {FEED_PATH}")
    print(f"Album: {ALBUM_DIR}")
    print(f"Output: {REPO_DIR}")
    print()

    if not FEED_PATH.exists():
        print(f"ERROR: Feed file not found: {FEED_PATH}")
        sys.exit(1)

    # Step 1: Copy album images
    print("=== Copying album images ===")
    album_map = copy_album_images()

    # Step 2: Parse feed
    print("\n=== Parsing Atom feed ===")
    tree = ET.parse(str(FEED_PATH))
    root = tree.getroot()

    entries = root.findall("atom:entry", NS)
    print(f"Total entries: {len(entries)}")

    # Step 3: Convert posts
    print("\n=== Converting posts ===")
    POSTS_DIR.mkdir(parents=True, exist_ok=True)

    for entry in entries:
        type_el = entry.find("blogger:type", NS)
        status_el = entry.find("blogger:status", NS)

        if type_el is None or type_el.text != "POST":
            stats["skipped_non_post"] += 1
            continue

        if status_el is None or status_el.text != "LIVE":
            stats["skipped_draft"] += 1
            continue

        convert_entry(entry, album_map)

    # Step 4: Summary
    print("\n=== Summary ===")
    print(f"Posts converted:         {stats['posts']}")
    print(f"Base64 images extracted: {stats['base64_extracted']}")
    print(f"Blogger images mapped:   {stats['blogger_images_mapped']}")
    print(f"Blogger images unmapped: {stats['blogger_images_unmapped']}")
    print(f"Skipped (non-post):      {stats['skipped_non_post']}")
    print(f"Skipped (draft):         {stats['skipped_draft']}")

    if stats["blogger_images_unmapped"] > 0:
        print(f"\nWARNING: {stats['blogger_images_unmapped']} blogger image URLs could not be mapped to local files.")
        print("These will remain as remote URLs in the posts.")


if __name__ == "__main__":
    main()
