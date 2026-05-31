#!/usr/bin/env python3
"""Watch OpenClaw source registry and emit scored topic candidates as JSONL."""

from __future__ import annotations

import argparse
import datetime as dt
import email.utils
import hashlib
import html
import json
from pathlib import Path
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


WORKSPACE = Path(__file__).resolve().parents[1]
DEFAULT_REGISTRY = WORKSPACE / "skills/article-video-publisher/SOURCE_REGISTRY.yml"
DEFAULT_REPORT_DIR = WORKSPACE / "reports/source-watch"
DEFAULT_ARTIFACT_ROOT = WORKSPACE / "reports/article-video-publisher"
AI_FRESHNESS_BASELINE_DAYS = 30
TAIPEI = dt.timezone(dt.timedelta(hours=8))


KEYWORDS = {
    "AI": [
        "ai",
        "agent",
        "benchmark",
        "context",
        "cuda",
        "agi",
        "alphafold",
        "deepmind",
        "eval",
        "frontier model",
        "inference",
        "llm",
        "model",
        "multimodal",
        "planning",
        "reasoning",
        "research",
        "safety",
        "training",
        "transformer",
        "world model",
    ],
    "Backend": [
        "architecture",
        "availability",
        "cache",
        "cassandra",
        "cdc",
        "columnar",
        "compaction",
        "cql",
        "database",
        "databricks",
        "debezium",
        "distributed",
        "duckdb",
        "exploit",
        "flink",
        "fuzzing",
        "gc",
        "go",
        "grafana",
        "hardening",
        "iceberg",
        "index",
        "indexes",
        "indexing",
        "incident",
        "java",
        "jdk",
        "jep",
        "jvm",
        "kafka",
        "kubernetes",
        "lakehouse",
        "latency",
        "lsm",
        "message broker",
        "messaging",
        "memory corruption",
        "memtable",
        "memtables",
        "mysql",
        "nats",
        "nosql",
        "observability",
        "olap",
        "opentelemetry",
        "partition",
        "performance",
        "postgres",
        "pub/sub",
        "pulsar",
        "queue",
        "query",
        "rabbitmq",
        "reliability",
        "replication",
        "rust",
        "sandbox",
        "scaling",
        "security",
        "service mesh",
        "sharding",
        "sql",
        "sstable",
        "sstables",
        "spring",
        "storage",
        "stream",
        "streaming",
        "transaction",
        "tracing",
        "vulnerability",
        "vector",
        "vertica",
        "virtual thread",
        "wal",
    ],
}

AI_PRIORITY_MULTIPLIER = 1.35
DISALLOWED_AUTO_VIDEO_CATEGORIES: set[str] = set()

BACKEND_ENGINEER_VALUE_KEYWORDS = [
    "agent",
    "api",
    "architecture",
    "availability",
    "backend",
    "benchmark",
    "cache",
    "capacity",
    "cassandra",
    "cdc",
    "columnar",
    "compaction",
    "consistency",
    "code",
    "coding",
    "cost",
    "cql",
    "database",
    "debug",
    "debezium",
    "deploy",
    "deployment",
    "developer",
    "devtools",
    "distributed",
    "duckdb",
    "exploit",
    "eval",
    "evaluation",
    "function",
    "functions",
    "flink",
    "gateway",
    "go",
    "grafana",
    "hardening",
    "iceberg",
    "index",
    "indexes",
    "indexing",
    "incident",
    "inference",
    "infra",
    "infrastructure",
    "java",
    "jdk",
    "jvm",
    "kafka",
    "kubernetes",
    "lakehouse",
    "latency",
    "lsm",
    "message broker",
    "messaging",
    "memory corruption",
    "migration",
    "monitor",
    "mysql",
    "nats",
    "nosql",
    "observability",
    "operate",
    "opentelemetry",
    "partition",
    "performance",
    "postgres",
    "production",
    "pub/sub",
    "pulsar",
    "queue",
    "rag",
    "rabbitmq",
    "reliability",
    "replication",
    "rollout",
    "runtime",
    "rust",
    "sandbox",
    "scaling",
    "security",
    "serving",
    "service mesh",
    "shard",
    "storage",
    "streaming",
    "system",
    "tool",
    "tooling",
    "tracing",
    "transaction",
    "trie",
    "upgrade",
    "vulnerability",
    "vector",
    "vertica",
    "workflow",
]

AI_RELATED_KEYWORDS = [
    "ai",
    "agent",
    "agentic",
    "agi",
    "alphafold",
    "artificial intelligence",
    "chatbot",
    "code generation",
    "deepmind",
    "deep learning",
    "diffusion model",
    "foundation model",
    "frontier model",
    "generative",
    "gpu",
    "large language model",
    "language model",
    "llm",
    "machine learning",
    "ml",
    "neural",
    "rag",
    "transformer",
    "world model",
]

INTERVIEW_SOURCE_TYPES = {
    "ai_leader_interview",
    "ai_engineering_interview",
    "ai_research_interview",
    "ai_podcast_interview",
    "ai_video_interview",
}

PAPER_SOURCE_TYPES = {
    "research_feed",
    "paper_discovery",
    "conference_papers",
}

AI_LEADER_KEYWORDS = [
    "aidan gomez",
    "andrej karpathy",
    "andrew ng",
    "dario",
    "deepmind",
    "demis",
    "demis hassabis",
    "fei-fei",
    "geoffrey hinton",
    "greg brockman",
    "ilya",
    "jeff dean",
    "jensen huang",
    "jim keller",
    "lecun",
    "mira murati",
    "noam shazeer",
    "sam altman",
    "sutskever",
    "yann",
    "yoshua bengio",
]

AI_INTERVIEW_IMPORTANCE_KEYWORDS = [
    "agi",
    "ai for science",
    "alignment",
    "alphafold",
    "artificial general intelligence",
    "continual learning",
    "deepmind",
    "drug discovery",
    "frontier lab",
    "frontier model",
    "governance",
    "hassabis",
    "isomorphic",
    "mechanistic interpretability",
    "nobel",
    "planning",
    "reasoning",
    "safety",
    "scientific discovery",
    "simulation",
    "world model",
]

AI_PRODUCT_OPERATOR_KEYWORDS = [
    "ai era",
    "ai founder mode",
    "airbnb",
    "brian chesky",
    "ceo mode",
    "consumer ai",
    "creativity",
    "design thinking",
    "disrupting yourself with ai",
    "eleven-star experience",
    "focused problems",
    "founder mode",
    "founder-led",
    "hiring",
    "leadership",
    "manager ic",
    "operating model",
    "organization",
    "product",
    "pmf",
    "product fit",
    "pure people managers",
    "recruiting",
    "small teams",
    "user experience",
]

PAPER_SIGNAL_KEYWORDS = [
    "agent",
    "alignment",
    "benchmark",
    "code",
    "dataset",
    "evaluation",
    "inference",
    "method",
    "mixture-of-experts",
    "moe",
    "multimodal",
    "post-training",
    "rag",
    "reasoning",
    "reinforcement learning",
    "retrieval",
    "safety",
    "scaling",
    "survey",
    "training",
]

PAPER_USER_IMPACT_KEYWORDS = [
    "agent",
    "agentic",
    "assistant",
    "browser",
    "calibration",
    "citation",
    "code",
    "code generation",
    "coding",
    "context window",
    "cost",
    "developer",
    "deployment",
    "distillation",
    "eval",
    "grounding",
    "gui",
    "hallucination",
    "inference",
    "jailbreak",
    "kv cache",
    "latency",
    "long-context",
    "memory",
    "multimodal",
    "open model",
    "open-source model",
    "open-source",
    "post-training",
    "privacy",
    "production",
    "quantization",
    "rag",
    "reasoning",
    "reliability",
    "retrieval",
    "safety",
    "search",
    "serving",
    "source attribution",
    "tool",
    "tool use",
    "user",
    "workflow",
]

PAPER_BROAD_AI_MODEL_KEYWORDS = [
    "chatbot",
    "diffusion model",
    "foundation model",
    "large language model",
    "language model",
    "llm",
    "transformer",
    "vision-language",
]

AI_TIME_SENSITIVE_KEYWORDS = [
    "api",
    "benchmark",
    "coding",
    "cost",
    "eval",
    "evaluation",
    "inference",
    "latency",
    "launch",
    "leaderboard",
    "model card",
    "new model",
    "open model",
    "performance",
    "pricing",
    "release",
    "released",
    "sota",
    "state of the art",
    "tool use",
]

AI_DURABLE_KEYWORDS = [
    "architecture",
    "case study",
    "concept",
    "design",
    "explainer",
    "foundation",
    "foundations",
    "history",
    "lesson",
    "lessons",
    "mechanism",
    "postmortem",
    "primer",
    "retrospective",
    "security",
    "survey",
    "taxonomy",
    "tutorial",
]

PAPER_EVIDENCE_KEYWORDS = [
    "artifact",
    "benchmark",
    "code",
    "dataset",
    "evaluation",
    "eval",
    "github",
    "leaderboard",
    "repo",
]

PAPER_NARROW_DOMAIN_KEYWORDS = [
    "agriculture",
    "astronomy",
    "biomedical",
    "cell",
    "chemical",
    "chemistry",
    "chromophore",
    "clinical",
    "climate",
    "fluorescent",
    "geospatial",
    "genome",
    "histopathology",
    "medical image",
    "medical",
    "molecule",
    "pathology",
    "protein",
    "quantum-yield",
    "radar",
    "radiology",
    "traffic",
    "wireless",
]

DEPTH_KEYWORDS = [
    "architecture",
    "benchmark",
    "builder",
    "conversation",
    "data",
    "design",
    "engineering",
    "evaluation",
    "experiment",
    "consistency",
    "debug",
    "feature",
    "function",
    "functions",
    "fuzzing",
    "implementation",
    "indexing",
    "jdk",
    "jep",
    "jvm",
    "latency",
    "mechanism",
    "method",
    "migration",
    "observability",
    "patch",
    "podcast",
    "post-training",
    "performance",
    "query",
    "release",
    "reliability",
    "replication",
    "research",
    "researcher",
    "security",
    "risk",
    "rollout",
    "routing",
    "scaling law",
    "storage",
    "streaming",
    "system",
    "synthetic data",
    "tradeoff",
    "transaction",
    "upgrade",
    "vector",
]

READER_VALUE_KEYWORDS = [
    "adopt",
    "benchmark",
    "best practice",
    "capacity",
    "case study",
    "caveat",
    "cost",
    "data",
    "debug",
    "decision",
    "design",
    "deploy",
    "evaluate",
    "explain",
    "how to",
    "impact",
    "incident",
    "indicator",
    "latency",
    "lesson",
    "migration",
    "monitor",
    "operate",
    "performance",
    "policy",
    "practical",
    "production",
    "risk",
    "roadmap",
    "rollout",
    "scale",
    "scenario",
    "tuning",
    "tradeoff",
    "uncertainty",
    "upgrade",
    "what to watch",
    "why it matters",
    "workflow",
]

MARKETING_CONTEXT_KEYWORDS = [
    "announcing",
    "ai-native",
    "appoints",
    "appointment",
    "case study",
    "customer",
    "customers",
    "enterprise adoption",
    "event",
    "introducing",
    "launch",
    "now available",
    "partner",
    "partnership",
    "pricing",
    "regional director",
    "representative director",
    "sign up",
    "sponsor",
    "startup",
    "webinar",
    "why choose",
]

TECHNICAL_SUBSTANCE_KEYWORDS = [
    "agent",
    "api",
    "architecture",
    "benchmark",
    "cache",
    "cassandra",
    "changelog",
    "code",
    "coding",
    "cve",
    "database",
    "dataset",
    "developer",
    "eval",
    "evaluation",
    "experiment",
    "exploit",
    "implementation",
    "incident",
    "inference",
    "jvm",
    "kafka",
    "latency",
    "method",
    "migration",
    "model",
    "observability",
    "patch",
    "performance",
    "postgres",
    "postmortem",
    "query",
    "reliability",
    "release notes",
    "replication",
    "runtime",
    "scaling",
    "sdk",
    "security",
    "storage",
    "streaming",
    "system",
    "tool use",
    "transaction",
    "upgrade",
    "vulnerability",
    "workflow",
]

OFF_AUDIENCE_CONTEXT_KEYWORDS = [
    "arts",
    "bank",
    "classroom",
    "consumer story",
    "culture",
    "education",
    "encyclical",
    "finance",
    "government",
    "humanities",
    "legal",
    "medicine",
    "office",
    "policy",
    "pope",
    "public sector",
    "religion",
    "retail",
    "society",
    "university",
]

ENRICHMENT_MIN_SUMMARY_CHARS = 180
ENRICHMENT_MAX_SUMMARY_CHARS = 3500
ENRICHMENT_RECENT_DAYS = 30
SOURCE_SCAN_MULTIPLIER = 3
SOURCE_SCAN_FLOOR = 15
DEFAULT_MAX_ENRICHMENTS_PER_SOURCE = 2

PRIMARY_ENRICHMENT_SOURCE_TYPES = {
    "database_blog",
    "devtools_blog",
    "engineering_blog",
    "engineering_reference",
    "official_blog",
    "official_data_policy",
    "official_java_blog",
    "official_research_blog",
    "project_blog",
    "project_ecosystem_blog",
    "project_news",
    "project_release_notes",
    "researcher_team_blog",
    "runtime_blog",
    "security_blog",
}

ENRICHMENT_TECHNICAL_SIGNAL_RE = re.compile(
    r"\b("
    r"agent|agentic|api|architecture|benchmark|cassandra|changelog|claude|code|coding|"
    r"context|cve|database|developer|eval|evaluation|exploit|frontier|gemini|gpt|"
    r"incident|inference|jvm|kafka|latency|llama|llm|migration|model|model[_ -]?release|"
    r"observability|performance|postgres|postmortem|rag|reasoning|release|release notes|"
    r"reliability|runtime|safety|sdk|security|sonnet|storage|streaming|system|tool use|"
    r"tooling|upgrade|vulnerability|workflow"
    r")\b|"
    r"\bv?\d+(?:\.\d+){1,3}\b",
    re.I,
)

ENRICHMENT_CORPORATE_NOISE_RE = re.compile(
    r"\b("
    r"acquires|acquisition|appoints|appointment|award|awards|case study|conference|"
    r"country manager|customer|"
    r"customers|event|funding|hiring|office|partner|partnership|series [a-z]|"
    r"regional director|representative director|sponsor|startup|webinar"
    r")\b",
    re.I,
)

ENRICHMENT_NOISE_OVERRIDE_RE = re.compile(
    r"\b("
    r"architecture|benchmark|cve|deep dive|engineering|eval|evaluation|exploit|"
    r"incident|migration|performance|postmortem|release notes|security|technical|"
    r"vulnerability"
    r")\b",
    re.I,
)

HTML_BLOCK_SKIP_RE = re.compile(
    r"\b("
    r"accept cookies|all rights reserved|cookie policy|cookie settings|copyright|"
    r"download app|newsletter|privacy policy|sign in|sign up|subscribe|terms of service"
    r")\b",
    re.I,
)


def parse_value(value: str):
    value = value.strip()
    if value in {"true", "false"}:
        return value == "true"
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1].strip()
        if not inner:
            return []
        return [part.strip().strip("'\"") for part in inner.split(",")]
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]
    try:
        if "." in value:
            return float(value)
        return int(value)
    except ValueError:
        return value


def load_registry(path: Path) -> list[dict]:
    """Parse the small YAML subset used by SOURCE_REGISTRY.yml."""
    sources: list[dict] = []
    current: dict | None = None
    in_sources = False

    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].rstrip()
        if not line.strip():
            continue
        if line == "sources:":
            in_sources = True
            continue
        if not in_sources:
            continue
        if line.startswith("  - "):
            if current:
                sources.append(current)
            current = {}
            rest = line[4:].strip()
            if rest and ":" in rest:
                key, value = rest.split(":", 1)
                current[key.strip()] = parse_value(value)
            continue
        if current is not None and line.startswith("    ") and ":" in line:
            key, value = line.strip().split(":", 1)
            current[key.strip()] = parse_value(value)

    if current:
        sources.append(current)
    return sources


def fetch_text(url: str, timeout: int = 25) -> tuple[str, str, str]:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "OpenClaw source watcher/1.0 (+https://local.openclaw)",
            "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read(12_000_000)
        content_type = resp.headers.get("content-type", "")
        charset = "utf-8"
        match = re.search(r"charset=([^;\s]+)", content_type, re.I)
        if match:
            charset = match.group(1)
        return raw.decode(charset, "replace"), resp.geturl(), content_type


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def unique_texts(values: list[str], min_chars: int = 1) -> list[str]:
    unique: list[str] = []
    seen: set[str] = set()
    for value in values:
        cleaned = clean_text(value)
        if len(cleaned) < min_chars:
            continue
        key = re.sub(r"\W+", "", cleaned.lower())[:120]
        if not key or key in seen:
            continue
        seen.add(key)
        unique.append(cleaned)
    return unique


def parse_date(value: str | None) -> str | None:
    if not value:
        return None
    value = clean_text(value)
    try:
        parsed = email.utils.parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=dt.timezone.utc)
        return parsed.astimezone(dt.timezone.utc).isoformat()
    except Exception:
        pass
    normalized = value.replace("Z", "+00:00")
    try:
        parsed = dt.datetime.fromisoformat(normalized)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=dt.timezone.utc)
        return parsed.astimezone(dt.timezone.utc).isoformat()
    except Exception:
        return None


def item_age_days(item: dict, now_utc: dt.datetime) -> int | None:
    published_at = item.get("published_at")
    if not published_at:
        return None
    try:
        published_dt = dt.datetime.fromisoformat(str(published_at))
        if published_dt.tzinfo is None:
            published_dt = published_dt.replace(tzinfo=dt.timezone.utc)
        return max(0, (now_utc - published_dt.astimezone(dt.timezone.utc)).days)
    except Exception:
        return None


def find_text(elem: ET.Element, names: list[str]) -> str:
    for name in names:
        found = elem.find(name)
        if found is not None and found.text:
            return clean_text(found.text)
    for child in elem.iter():
        local = child.tag.split("}", 1)[-1]
        if local in names and child.text:
            return clean_text(child.text)
    return ""


def parse_rss_or_atom(text: str, source: dict) -> list[dict]:
    root = ET.fromstring(text.lstrip("\ufeff"))
    items: list[dict] = []

    rss_items = root.findall(".//item")
    if rss_items:
        for item in rss_items:
            link = find_text(item, ["link"])
            title = find_text(item, ["title"])
            published = parse_date(find_text(item, ["pubDate", "date", "published", "updated"]))
            summary = find_text(item, ["description", "summary", "encoded"])
            if title and link:
                items.append(
                    {
                        "title": title,
                        "url": link,
                        "published_at": published,
                        "summary": summary,
                    }
                )
        return items

    for entry in root.findall(".//{http://www.w3.org/2005/Atom}entry"):
        title = find_text(entry, ["title"])
        link = ""
        for link_el in entry.findall("{http://www.w3.org/2005/Atom}link"):
            href = link_el.attrib.get("href", "")
            rel = link_el.attrib.get("rel", "alternate")
            if href and rel == "alternate":
                link = href
                break
        published = parse_date(find_text(entry, ["published", "updated"]))
        summary = find_text(entry, ["summary", "content"])
        if title and link:
            items.append(
                {
                    "title": title,
                    "url": urllib.parse.urljoin(str(source.get("url", "")), link),
                    "published_at": published,
                    "summary": summary,
                }
            )
    return items


def title_from_url(url: str) -> str:
    path = urllib.parse.urlparse(url).path.strip("/")
    if not path:
        return urllib.parse.urlparse(url).netloc
    slug = path.split("/")[-1]
    slug = re.sub(r"\.(html?|php|aspx?)$", "", slug, flags=re.I)
    slug = re.sub(r"[-_]+", " ", slug)
    return slug.strip().title()


def parse_sitemap(text: str, source: dict) -> list[dict]:
    root = ET.fromstring(text.lstrip("\ufeff"))
    prefixes = source.get("url_prefixes") or [source.get("url", "")]
    items: list[dict] = []
    for url_el in root.findall(".//{*}url"):
        loc = find_text(url_el, ["loc"])
        if not loc:
            continue
        if prefixes and not any(loc.startswith(prefix) for prefix in prefixes):
            continue
        published = parse_date(find_text(url_el, ["lastmod"]))
        items.append(
            {
                "title": title_from_url(loc),
                "url": loc,
                "published_at": published,
                "summary": "",
            }
        )
    items.sort(key=lambda item: item.get("published_at") or "", reverse=True)
    return items


def parse_html_links(text: str, source: dict) -> list[dict]:
    base = str(source.get("url") or source.get("fetch_url") or "")
    prefixes = source.get("url_prefixes") or [base]
    exclude_url_substrings = source.get("exclude_url_substrings") or []
    exclude_title_patterns = source.get("exclude_title_patterns") or []
    seen: set[str] = set()
    items: list[dict] = []
    pattern = re.compile(
        r"<a\b[^>]*href=(?:[\"']([^\"']+)[\"']|([^\s>]+))[^>]*>(.*?)</a>",
        re.I | re.S,
    )
    for quoted_href, bare_href, label in pattern.findall(text):
        href = quoted_href or bare_href
        url = urllib.parse.urljoin(base, html.unescape(href))
        url = url.split("#", 1)[0]
        if url in seen:
            continue
        if prefixes and not any(url.startswith(prefix) for prefix in prefixes):
            continue
        if any(part and part in url for part in exclude_url_substrings):
            continue
        seen.add(url)
        title = clean_text(label) or title_from_url(url)
        if len(title) < 8 or title.lower() in {"read more", "continue reading", "continue reading »"}:
            title = title_from_url(url)
        # Some project feeds (for example Kafka) use ultra-short anchor labels like
        # "AK 4.3.0". Promote those to URL-slug titles so scoring sees topic context.
        if re.fullmatch(r"[A-Z]{1,4}\s+\d+(?:\.\d+){1,3}", title):
            title = title_from_url(url)
        if any(pattern and re.search(pattern, title, re.I) for pattern in exclude_title_patterns):
            continue
        if title and url.rstrip("/") != base.rstrip("/"):
            items.append(
                {
                    "title": title,
                    "url": url,
                    "published_at": None,
                    "summary": "",
                }
            )
    return items


def extract_js_object(text: str, marker: str) -> dict | None:
    marker_index = text.find(marker)
    if marker_index < 0:
        return None
    start = text.find("{", marker_index)
    if start < 0:
        return None
    depth = 0
    in_string = False
    escaping = False
    for index, char in enumerate(text[start:], start):
        if in_string:
            if escaping:
                escaping = False
            elif char == "\\":
                escaping = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[start : index + 1])
                except Exception:
                    return None
    return None


def model_text(obj) -> str:
    if isinstance(obj, str):
        return clean_text(obj)
    if isinstance(obj, dict):
        if "content" in obj:
            return clean_text(str(obj.get("content") or ""))
        if "simpleText" in obj:
            return clean_text(str(obj.get("simpleText") or ""))
        runs = obj.get("runs")
        if isinstance(runs, list):
            return clean_text("".join(str(run.get("text", "")) for run in runs if isinstance(run, dict)))
        text_obj = obj.get("text")
        if isinstance(text_obj, dict):
            return model_text(text_obj)
    return ""


def parse_youtube_relative_date(value: str | None) -> str | None:
    if not value:
        return None
    value = clean_text(value).lower()
    patterns = [
        (r"(\d+)\s+days?\s+ago", "days"),
        (r"(\d+)\s+weeks?\s+ago", "weeks"),
        (r"(\d+)\s+months?\s+ago", "months"),
        (r"(\d+)\s+years?\s+ago", "years"),
        (r"(\d+)\s*天前", "days"),
        (r"(\d+)\s*週前", "weeks"),
        (r"(\d+)\s*周前", "weeks"),
        (r"(\d+)\s*個月前", "months"),
        (r"(\d+)\s*年前", "years"),
    ]
    for pattern, unit in patterns:
        match = re.search(pattern, value)
        if not match:
            continue
        amount = int(match.group(1))
        days = amount
        if unit == "weeks":
            days *= 7
        elif unit == "months":
            days *= 30
        elif unit == "years":
            days *= 365
        published = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)
        return published.isoformat()
    return None


def parse_youtube_channel(text: str, source: dict) -> list[dict]:
    data = extract_js_object(text, "ytInitialData")
    if not data:
        return []

    base = str(source.get("url") or source.get("fetch_url") or "https://www.youtube.com")
    seen: set[str] = set()
    items: list[dict] = []

    def add_item(video_id: str | None, title: str, summary_parts: list[str] | None = None) -> None:
        video_id = clean_text(video_id)
        title = clean_text(title)
        if not video_id or not title or video_id in seen:
            return
        url = urllib.parse.urljoin(base, f"/watch?v={video_id}")
        summary = clean_text(" ".join(part for part in (summary_parts or []) if part))
        if item_excluded(source, {"title": title, "url": url}):
            return
        seen.add(video_id)
        items.append(
            {
                "title": title,
                "url": url,
                "published_at": parse_youtube_relative_date(summary),
                "summary": summary,
            }
        )

    def walk(obj) -> None:
        if isinstance(obj, dict):
            if "videoRenderer" in obj:
                renderer = obj["videoRenderer"]
                add_item(
                    renderer.get("videoId"),
                    model_text(renderer.get("title") or {}),
                    [
                        model_text(renderer.get("descriptionSnippet") or {}),
                        model_text(renderer.get("publishedTimeText") or {}),
                        model_text(renderer.get("lengthText") or {}),
                        model_text(renderer.get("viewCountText") or {}),
                    ],
                )
            if "lockupViewModel" in obj:
                lockup = obj["lockupViewModel"]
                if lockup.get("contentType") == "LOCKUP_CONTENT_TYPE_VIDEO":
                    metadata = (
                        lockup.get("metadata", {})
                        .get("lockupMetadataViewModel", {})
                    )
                    title = model_text(metadata.get("title") or {})
                    summary_parts: list[str] = []
                    rows = (
                        metadata.get("metadata", {})
                        .get("contentMetadataViewModel", {})
                        .get("metadataRows", [])
                    )
                    for row in rows:
                        if not isinstance(row, dict):
                            continue
                        for part in row.get("metadataParts", []):
                            summary_parts.append(model_text(part.get("text") or {}))
                    add_item(lockup.get("contentId"), title, summary_parts)
            for value in obj.values():
                walk(value)
        elif isinstance(obj, list):
            for value in obj:
                walk(value)

    walk(data)
    return items


def parse_huggingface_papers(text: str) -> list[dict]:
    match = re.search(r'data-target="DailyPapers"\s+data-props="([^"]+)"', text)
    if not match:
        return []
    try:
        props = json.loads(html.unescape(match.group(1)))
    except Exception:
        return []
    items: list[dict] = []
    for entry in props.get("dailyPapers", []) or []:
        paper = entry.get("paper") or {}
        paper_id = paper.get("id")
        title = clean_text(paper.get("title"))
        if not paper_id or not title:
            continue
        items.append(
            {
                "title": title,
                "url": f"https://huggingface.co/papers/{paper_id}",
                "published_at": parse_date(paper.get("publishedAt") or paper.get("submittedOnDailyAt")),
                "summary": clean_text(paper.get("summary") or paper.get("ai_summary")),
            }
        )
    return items


def parse_items(text: str, content_type: str, source: dict) -> list[dict]:
    mode = str(source.get("fetch_mode", "rss"))
    if str(source.get("id")) == "huggingface-papers":
        items = parse_huggingface_papers(text)
        if items:
            return items
    if mode == "youtube_channel":
        return parse_youtube_channel(text, source)
    if mode == "sitemap":
        return parse_sitemap(text, source)
    if mode == "html":
        return parse_html_links(text, source)
    if "html" in content_type.lower() and not text.lstrip().startswith("<?xml"):
        return parse_html_links(text, source)
    return parse_rss_or_atom(text, source)


def title_terms(title: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9]+|[\u4e00-\u9fff]", title)


def metadata_quality(item: dict) -> dict:
    title = clean_text(str(item.get("title", "")))
    summary = clean_text(str(item.get("summary", "")))
    url_title = title_from_url(str(item.get("url", "")))
    title_from_slug = bool(url_title and title.lower() == url_title.lower())
    terms = title_terms(title)
    return {
        "title_chars": len(title),
        "title_terms": len(terms),
        "summary_chars": len(summary),
        "title_from_url": title_from_slug,
        "thin_title": len(terms) <= 4 or title_from_slug,
        "thin_summary": len(summary) < ENRICHMENT_MIN_SUMMARY_CHARS,
    }


def source_is_primary_for_enrichment(source: dict) -> bool:
    category = str(source.get("category", ""))
    source_type = str(source.get("type", "")).lower()
    tags = {str(tag).lower() for tag in source.get("tags", []) or []}
    tier = int(source.get("tier", 3) or 3)
    if tier > 2:
        return False
    if category not in {"AI", "Backend"} and not (tags & {"ai", "backend", "systems", "infra", "security"}):
        return False
    return source_type in PRIMARY_ENRICHMENT_SOURCE_TYPES


def enrichment_signal_text(source: dict, item: dict) -> str:
    parts = [
        str(source.get("category", "")),
        str(source.get("type", "")),
        str(source.get("name", "")),
        str(item.get("title", "")),
        str(item.get("url", "")),
        " ".join(str(tag) for tag in source.get("tags", []) or []),
    ]
    return " ".join(parts).lower()


def looks_like_corporate_noise(item: dict) -> bool:
    title_url = f"{item.get('title', '')} {item.get('url', '')}"
    return bool(ENRICHMENT_CORPORATE_NOISE_RE.search(title_url)) and not bool(
        ENRICHMENT_NOISE_OVERRIDE_RE.search(title_url)
    )


def should_enrich_candidate(source: dict, item: dict, now_utc: dt.datetime) -> bool:
    if not item.get("url"):
        return False
    if not source_is_primary_for_enrichment(source):
        return False
    if looks_like_corporate_noise(item):
        return False

    quality = metadata_quality(item)
    if not (quality["thin_summary"] or quality["thin_title"]):
        return False
    fetch_mode = str(source.get("fetch_mode", "")).lower()
    if fetch_mode not in {"sitemap", "html"} and quality["thin_summary"] and not quality["thin_title"]:
        return False

    age = item_age_days(item, now_utc)
    if age is not None and age > ENRICHMENT_RECENT_DAYS:
        return False

    return bool(ENRICHMENT_TECHNICAL_SIGNAL_RE.search(enrichment_signal_text(source, item)))


def html_attrs(tag: str) -> dict[str, str]:
    attrs: dict[str, str] = {}
    for key, double_value, single_value, bare_value in re.findall(
        r"([\w:-]+)\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|([^\s\"'=<>`]+))",
        tag,
        flags=re.S,
    ):
        attrs[key.lower()] = html.unescape(double_value or single_value or bare_value or "")
    return attrs


def walk_jsonld_values(value, keys: set[str], output: list[str], limit: int = 16) -> None:
    if len(output) >= limit:
        return
    if isinstance(value, dict):
        for key in keys:
            text = value.get(key)
            if isinstance(text, str):
                output.append(text)
                if len(output) >= limit:
                    return
        graph = value.get("@graph")
        if isinstance(graph, list):
            walk_jsonld_values(graph, keys, output, limit)
        for child in value.values():
            if isinstance(child, (dict, list)):
                walk_jsonld_values(child, keys, output, limit)
                if len(output) >= limit:
                    return
    elif isinstance(value, list):
        for child in value:
            walk_jsonld_values(child, keys, output, limit)
            if len(output) >= limit:
                return


def extract_html_page_summary(text: str) -> dict:
    title = ""
    title_match = re.search(r"<title\b[^>]*>(.*?)</title>", text, re.I | re.S)
    if title_match:
        title = clean_text(title_match.group(1))

    meta_texts: list[str] = []
    for tag in re.findall(r"<meta\b[^>]*>", text, re.I | re.S):
        attrs = html_attrs(tag)
        key = (attrs.get("name") or attrs.get("property") or attrs.get("itemprop") or "").lower()
        content = attrs.get("content", "")
        if key in {"description", "og:description", "twitter:description"} and content:
            meta_texts.append(content)

    jsonld_texts: list[str] = []
    for raw in re.findall(
        r"<script\b[^>]*type=[\"']application/ld\+json[\"'][^>]*>(.*?)</script>",
        text,
        re.I | re.S,
    ):
        try:
            data = json.loads(html.unescape(raw.strip()))
        except Exception:
            continue
        walk_jsonld_values(data, {"headline", "description", "abstract", "articleBody"}, jsonld_texts)

    body = re.sub(
        r"(?is)<(script|style|noscript|svg|nav|header|footer|form|iframe)\b.*?</\1>",
        " ",
        text,
    )
    body = re.sub(r"(?is)<!--.*?-->", " ", body)
    block_texts: list[str] = []
    for tag_name, content in re.findall(r"(?is)<(h[1-3]|p|li)\b[^>]*>(.*?)</\1>", body):
        block = clean_text(content)
        if not block or HTML_BLOCK_SKIP_RE.search(block):
            continue
        if tag_name.lower().startswith("h") and len(block) >= 12:
            block_texts.append(block)
        elif len(block) >= 40:
            block_texts.append(block)
        if len(" ".join(block_texts)) >= ENRICHMENT_MAX_SUMMARY_CHARS:
            break

    parts = unique_texts(meta_texts + jsonld_texts + block_texts, min_chars=12)
    summary = " ".join(parts)
    if len(summary) > ENRICHMENT_MAX_SUMMARY_CHARS:
        summary = summary[:ENRICHMENT_MAX_SUMMARY_CHARS].rsplit(" ", 1)[0].strip()
    return {
        "title": title,
        "summary": summary,
        "meta_count": len(unique_texts(meta_texts, min_chars=12)),
        "jsonld_count": len(unique_texts(jsonld_texts, min_chars=12)),
        "block_count": len(unique_texts(block_texts, min_chars=12)),
    }


def enrich_item_from_page(item: dict, timeout: int) -> dict:
    enriched = dict(item)
    before = metadata_quality(enriched)
    try:
        text, final_url, content_type = fetch_text(str(item.get("url", "")), timeout=timeout)
        if "html" in content_type.lower() or "<html" in text[:1000].lower():
            page = extract_html_page_summary(text)
        else:
            summary = clean_text(text)
            if len(summary) > ENRICHMENT_MAX_SUMMARY_CHARS:
                summary = summary[:ENRICHMENT_MAX_SUMMARY_CHARS].rsplit(" ", 1)[0].strip()
            page = {
                "title": "",
                "summary": summary,
                "meta_count": 0,
                "jsonld_count": 0,
                "block_count": 1 if summary else 0,
            }

        page_title = clean_text(page.get("title", ""))
        if page_title and (before["title_from_url"] or before["thin_title"]):
            enriched["title"] = page_title

        existing_summary = clean_text(str(enriched.get("summary", "")))
        page_summary = clean_text(str(page.get("summary", "")))
        if page_summary:
            summary_parts = unique_texts([existing_summary, page_summary], min_chars=1)
            summary = " ".join(summary_parts)
            if len(summary) > ENRICHMENT_MAX_SUMMARY_CHARS:
                summary = summary[:ENRICHMENT_MAX_SUMMARY_CHARS].rsplit(" ", 1)[0].strip()
            enriched["summary"] = summary

        after = metadata_quality(enriched)
        enriched["metadata_quality"] = after
        enriched["enrichment"] = {
            "status": "ok" if after["summary_chars"] > before["summary_chars"] else "no_new_summary",
            "resolved_url": final_url,
            "content_type": content_type,
            "summary_chars_before": before["summary_chars"],
            "summary_chars_after": after["summary_chars"],
            "meta_count": page.get("meta_count", 0),
            "jsonld_count": page.get("jsonld_count", 0),
            "block_count": page.get("block_count", 0),
        }
        return enriched
    except Exception as exc:
        enriched["metadata_quality"] = before
        enriched["enrichment"] = {
            "status": "error",
            "error": f"{type(exc).__name__}: {exc}",
            "summary_chars_before": before["summary_chars"],
            "summary_chars_after": before["summary_chars"],
        }
        return enriched


def candidate_key(url: str, title: str) -> str:
    basis = url.strip().lower() or re.sub(r"\W+", " ", title.lower()).strip()
    return hashlib.sha1(basis.encode("utf-8")).hexdigest()


def load_seen_keys(report_dir: Path, output_path: Path, days: int = 30) -> set[str]:
    seen: set[str] = set()
    cutoff = dt.datetime.now(TAIPEI).date() - dt.timedelta(days=days)
    if not report_dir.exists():
        return seen
    for path in report_dir.glob("*.jsonl"):
        stem = path.stem
        try:
            file_date = dt.date.fromisoformat(stem)
        except ValueError:
            continue
        if file_date < cutoff and path != output_path:
            continue
        try:
            for line in path.read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                obj = json.loads(line)
                key = obj.get("dedupe_key")
                if key:
                    seen.add(key)
        except Exception:
            continue
    return seen


def count_keyword_hits(text: str, words: list[str]) -> int:
    text = text.lower()
    hits = 0
    for word in words:
        word = word.lower()
        if re.fullmatch(r"[a-z0-9]+", word):
            if re.search(rf"(?<![a-z0-9]){re.escape(word)}(?![a-z0-9])", text):
                hits += 1
        elif word in text:
            hits += 1
    return hits


def is_interview_source(source_type: str) -> bool:
    return source_type.lower() in INTERVIEW_SOURCE_TYPES


def is_paper_source(source_type: str) -> bool:
    return source_type.lower() in PAPER_SOURCE_TYPES


def normalized_domain(url: str) -> str:
    try:
        host = urllib.parse.urlparse(url).netloc.lower().split("@")[-1].split(":")[0]
    except Exception:
        return ""
    if host.startswith("www."):
        host = host[4:]
    return host


def source_diversity_keys(source: dict, item: dict | None = None) -> list[str]:
    item = item or {}
    source_id = str(source.get("source_id") or source.get("id") or "").strip().lower()
    source_name = str(source.get("source_name") or source.get("name") or "").strip().lower()
    source_type = str(source.get("source_type") or source.get("type") or "").strip().lower()
    url = str(item.get("url") or source.get("url") or "").strip()
    domain = normalized_domain(url)
    keys: list[str] = []
    if domain:
        keys.append(f"domain:{domain}")
    if source_id:
        keys.append(f"source_id:{source_id}")
    if source_name:
        keys.append(f"source_name:{source_name}")

    combined = " ".join(part for part in [source_id, source_name, source_type, domain] if part)
    if "arxiv" in combined:
        keys.append("family:arxiv-papers")
    elif is_paper_source(source_type):
        keys.append(f"family:paper:{domain or source_id or source_name}")
    elif is_interview_source(source_type) or "youtube" in source_type or "podcast" in source_type:
        keys.append(f"family:interview:{domain or source_id or source_name}")
    elif "blog" in source_type or "engineering" in source_type:
        keys.append(f"family:blog:{domain or source_id or source_name}")
    return list(dict.fromkeys(key for key in keys if key and not key.endswith(":")))


def parse_artifact_time(obj: dict, path: Path) -> float:
    for key in ("accessed_at", "published_at", "article_date"):
        value = obj.get(key)
        if not value:
            continue
        try:
            text = str(value).replace("Z", "+00:00")
            parsed = dt.datetime.fromisoformat(text)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=TAIPEI)
            return parsed.timestamp()
        except ValueError:
            try:
                parsed_date = dt.date.fromisoformat(str(value))
                return dt.datetime.combine(parsed_date, dt.time.min, tzinfo=TAIPEI).timestamp()
            except ValueError:
                continue
    try:
        return path.stat().st_mtime
    except OSError:
        return 0.0


def load_recent_source_context(artifact_root: Path = DEFAULT_ARTIFACT_ROOT, limit: int = 20) -> dict:
    records: list[tuple[float, list[str], str]] = []
    if not artifact_root.exists():
        return {"last10_counts": {}, "last20_counts": {}, "latest_keys": set(), "record_count": 0}
    for path in artifact_root.glob("*/*/source.json"):
        try:
            obj = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        keys = source_diversity_keys(obj, {"url": obj.get("url")})
        if not keys:
            continue
        records.append((parse_artifact_time(obj, path), keys, str(path)))
    records.sort(key=lambda record: record[0], reverse=True)
    recent = records[:limit]

    def count_keys(rows: list[tuple[float, list[str], str]]) -> dict[str, int]:
        counts: dict[str, int] = {}
        for _, keys, _ in rows:
            for key in keys:
                counts[key] = counts.get(key, 0) + 1
        return counts

    return {
        "last10_counts": count_keys(recent[:10]),
        "last20_counts": count_keys(recent[:20]),
        "latest_keys": set(recent[0][1]) if recent else set(),
        "record_count": len(recent),
    }


def source_diversity_adjustment(source: dict, item: dict, recent_context: dict | None) -> dict:
    keys = source_diversity_keys(source, item)
    if not recent_context or not keys:
        return {"keys": keys, "multiplier": 1.0, "penalty": 0.0, "note": ""}

    last10 = recent_context.get("last10_counts", {})
    last20 = recent_context.get("last20_counts", {})
    latest_keys = recent_context.get("latest_keys", set())
    max_last10 = max((int(last10.get(key, 0)) for key in keys), default=0)
    max_last20 = max((int(last20.get(key, 0)) for key in keys), default=0)
    back_to_back = bool(set(keys) & set(latest_keys))

    penalty = 0.0
    reasons: list[str] = []
    if back_to_back:
        penalty += 0.15
        reasons.append("back-to-back source family")
    if max_last10 > 2:
        penalty += min(0.12, 0.04 * (max_last10 - 2))
        reasons.append(f"{max_last10} matches in last 10")
    if max_last20 > 4:
        penalty += min(0.10, 0.02 * (max_last20 - 4))
        reasons.append(f"{max_last20} matches in last 20")
    multiplier = round(max(0.78, 1.0 - penalty), 3)
    penalty = round(1.0 - multiplier, 3)
    return {
        "keys": keys,
        "multiplier": multiplier,
        "penalty": penalty,
        "note": "; ".join(reasons),
    }


def item_excluded(source: dict, item: dict) -> bool:
    title = str(item.get("title", ""))
    url = str(item.get("url", ""))
    exclude_url_substrings = source.get("exclude_url_substrings") or []
    exclude_title_patterns = source.get("exclude_title_patterns") or []
    if any(part and part in url for part in exclude_url_substrings):
        return True
    return any(pattern and re.search(pattern, title, re.I) for pattern in exclude_title_patterns)


def is_ai_related(source: dict, body: str) -> bool:
    category = str(source.get("category", ""))
    tags = {str(tag).lower() for tag in source.get("tags", []) or []}
    source_type = str(source.get("type", "")).lower()
    ai_hits = count_keyword_hits(body, AI_RELATED_KEYWORDS)
    leader_hits = count_keyword_hits(body, AI_LEADER_KEYWORDS)
    if category == "AI":
        if is_interview_source(source_type):
            return ai_hits >= 1 or leader_hits >= 1
        return True
    if tags & {"ai", "machine_learning", "language_models", "llm", "agents", "models", "evals"}:
        return True
    if "research" in source_type and ai_hits >= 1:
        return True
    if is_interview_source(source_type) and (ai_hits >= 1 or leader_hits >= 1):
        return True
    return ai_hits >= 1


def score_candidate(
    source: dict,
    item: dict,
    seen_before: bool,
    now_utc: dt.datetime,
    recent_source_context: dict | None = None,
) -> dict:
    category = str(source.get("category", ""))
    blocked_auto_category = category in DISALLOWED_AUTO_VIDEO_CATEGORIES
    tier = int(source.get("tier", 3) or 3)
    source_type = str(source.get("type", ""))
    security_source = source_type.lower() == "security_blog"
    title = str(item.get("title", ""))
    body = f"{title} {item.get('summary', '')}".lower()
    ai_related = is_ai_related(source, body)
    interview_priority = source_type.lower() in INTERVIEW_SOURCE_TYPES and ai_related
    ai_leader_hits = count_keyword_hits(body, AI_LEADER_KEYWORDS)
    ai_interview_importance_hits = count_keyword_hits(body, AI_INTERVIEW_IMPORTANCE_KEYWORDS)
    ai_interview_importance_signal = interview_priority and (
        ai_leader_hits >= 1 or ai_interview_importance_hits >= 2
    )
    ai_product_operator_hits = count_keyword_hits(body, AI_PRODUCT_OPERATOR_KEYWORDS)
    ai_product_operator_signal = interview_priority and ai_related and ai_product_operator_hits >= 2
    paper_source = is_paper_source(source_type)
    paper_hits = count_keyword_hits(body, PAPER_SIGNAL_KEYWORDS)
    paper_user_impact_hits = count_keyword_hits(body, PAPER_USER_IMPACT_KEYWORDS)
    paper_broad_model_hits = count_keyword_hits(body, PAPER_BROAD_AI_MODEL_KEYWORDS)
    paper_evidence_hits = count_keyword_hits(body, PAPER_EVIDENCE_KEYWORDS)
    paper_narrow_domain_hits = count_keyword_hits(body, PAPER_NARROW_DOMAIN_KEYWORDS)
    paper_user_impact = paper_source and ai_related and (
        paper_user_impact_hits >= 1 or (paper_broad_model_hits >= 1 and paper_evidence_hits >= 2)
    )
    paper_too_narrow = paper_narrow_domain_hits >= 2 or (
        paper_narrow_domain_hits >= 1 and paper_user_impact_hits == 0
    )
    paper_priority = paper_user_impact and paper_hits >= 1 and not paper_too_narrow

    source_authority = 3 if tier <= 1 else 2 if tier == 2 else 1
    if (
        source_type in {"official_research_blog", "researcher_team_blog", "official_data_policy"}
        or interview_priority
    ):
        source_authority = max(source_authority, 3)

    topic_hits = count_keyword_hits(body, KEYWORDS.get(category, []))
    depth_hits = count_keyword_hits(body, DEPTH_KEYWORDS)
    reader_value_hits = count_keyword_hits(body, READER_VALUE_KEYWORDS)
    backend_engineer_value_hits = count_keyword_hits(body, BACKEND_ENGINEER_VALUE_KEYWORDS)
    backend_engineer_operating_value_signal = ai_product_operator_signal
    backend_engineer_value_signal = (
        category == "Backend"
        or backend_engineer_value_hits > 0
        or ai_interview_importance_signal
        or ai_product_operator_signal
    )
    marketing_hits = count_keyword_hits(body, MARKETING_CONTEXT_KEYWORDS)
    technical_substance_hits = count_keyword_hits(body, TECHNICAL_SUBSTANCE_KEYWORDS)
    off_audience_context_hits = count_keyword_hits(body, OFF_AUDIENCE_CONTEXT_KEYWORDS)
    security_mechanism_hits = count_keyword_hits(
        body,
        ["0-click", "cve", "exploit", "fuzz", "hardening", "memory corruption", "patch", "sandbox", "vulnerability", "zero-day"],
    )
    substance_depth = min(4, max(1, depth_hits + (1 if topic_hits >= 2 else 0)))
    if source_type in {"research_feed", "project_news"} and depth_hits == 0:
        substance_depth = min(substance_depth, 2)
    if paper_priority:
        substance_depth = max(substance_depth, 3 if paper_hits >= 2 or depth_hits >= 2 else 2)
    elif paper_source:
        substance_depth = min(substance_depth, 1)

    reader_value_signal = reader_value_hits > 0 or backend_engineer_operating_value_signal
    audience_value = min(3, 1 + (1 if topic_hits and depth_hits else 0) + (1 if reader_value_signal else 0))
    if source_type in {"official_research_blog", "researcher_team_blog", "engineering_blog"}:
        audience_value = max(audience_value, 2)
    if security_source and (topic_hits or depth_hits or security_mechanism_hits):
        audience_value = max(audience_value, 2)
        substance_depth = max(substance_depth, 2)
    if backend_engineer_value_signal and (depth_hits or reader_value_signal):
        audience_value = max(audience_value, 2)
    if paper_priority:
        audience_value = max(audience_value, 3 if paper_hits >= 2 and reader_value_hits else 2)
    elif paper_source:
        audience_value = min(audience_value, 1 if paper_user_impact_hits else 0)

    published_at = item.get("published_at")
    age_days: int | None = None
    timeliness = 1
    if published_at:
        try:
            published_dt = dt.datetime.fromisoformat(published_at)
            age_days = (now_utc - published_dt.astimezone(dt.timezone.utc)).days
            timeliness = 2 if age_days <= 14 else 1 if age_days <= 60 else 0
        except Exception:
            timeliness = 1
    ai_time_sensitive_hits = count_keyword_hits(body, AI_TIME_SENSITIVE_KEYWORDS) if ai_related else 0
    ai_durable_hits = count_keyword_hits(body, AI_DURABLE_KEYWORDS) if ai_related else 0
    ai_temporal_ok = True
    ai_temporal_review_required = False
    ai_temporal_staleness_risk = "none"
    ai_temporal_note = ""
    ai_temporal_penalty = 0
    if ai_related:
        if age_days is None:
            ai_temporal_ok = False
            ai_temporal_review_required = True
            ai_temporal_staleness_risk = "unknown"
            ai_temporal_note = "missing published_at; automatic AI topic cannot prove freshness"
            ai_temporal_penalty = 8
        elif age_days <= AI_FRESHNESS_BASELINE_DAYS:
            ai_temporal_note = f"AI source is {age_days} days old; within {AI_FRESHNESS_BASELINE_DAYS}-day freshness baseline"
        else:
            ai_temporal_review_required = True
            ai_temporal_staleness_risk = "medium"
            ai_temporal_penalty = 1 if age_days <= 60 else 2 if age_days <= 180 else 4
            ai_temporal_note = (
                f"AI source is {age_days} days old; requires staleness review against newer models/APIs/evals"
            )
            if (
                (ai_time_sensitive_hits >= 2 and ai_durable_hits == 0)
                or (age_days > 180 and ai_time_sensitive_hits >= 1 and ai_durable_hits == 0)
                or (age_days > 365 and ai_durable_hits == 0)
            ):
                ai_temporal_ok = False
                ai_temporal_staleness_risk = "high"
                ai_temporal_penalty = 8
                ai_temporal_note = (
                    f"AI source is {age_days} days old and appears time-sensitive; defer unless refreshed"
                )
            elif ai_durable_hits:
                ai_temporal_staleness_risk = "low" if age_days <= 180 else "medium"
                ai_temporal_note = (
                    f"AI source is {age_days} days old but appears durable; freshness review still required"
                )

    explainability = min(
        3,
        1
        + (1 if any(w in body for w in ["how", "why", "architecture", "design", "system", "data", "report"]) else 0)
        + (
            1
            if any(
                w in body
                for w in [
                    "benchmark",
                    "consistency",
                    "evaluation",
                    "migration",
                    "observability",
                    "performance",
                    "query",
                    "release",
                    "replication",
                    "risk",
                    "streaming",
                    "tradeoff",
                ]
            )
            else 0
        ),
    )
    if interview_priority:
        substance_depth = max(substance_depth, 3)
        audience_value = max(audience_value, 3 if tier <= 2 and (reader_value_hits or depth_hits >= 3) else 2)
        explainability = max(explainability, 2)
    if security_source and security_mechanism_hits:
        explainability = max(explainability, 2)
    if ai_interview_importance_signal:
        substance_depth = max(substance_depth, 3)
        audience_value = max(audience_value, 3 if tier <= 2 else 2)
        explainability = max(explainability, 3 if ai_interview_importance_hits >= 2 or ai_leader_hits >= 1 else 2)
    if ai_product_operator_signal:
        substance_depth = max(substance_depth, 3)
        audience_value = max(audience_value, 3 if tier <= 2 else 2)
        explainability = max(explainability, 3)
    if paper_priority:
        explainability = max(explainability, 2 + (1 if paper_hits >= 2 else 0))
    elif paper_source:
        explainability = min(explainability, 1 if paper_user_impact_hits else 0)
    promotional_risk = marketing_hits >= 2 or (marketing_hits >= 1 and depth_hits < 2)
    if promotional_risk:
        penalty = 3 if depth_hits < 2 else 1
        substance_depth = max(0, substance_depth - penalty)
        audience_value = max(0, audience_value - (2 if depth_hits < 2 else 1))
        explainability = max(0, explainability - (2 if depth_hits < 2 else 1))
    off_audience_risk = bool(off_audience_context_hits and technical_substance_hits < 2)
    if off_audience_risk:
        substance_depth = max(0, substance_depth - 3)
        audience_value = max(0, audience_value - 2)
        explainability = max(0, explainability - 2)
    novelty_non_repeat = 0 if seen_before else 2
    sourceability = 2 if item.get("url") and tier <= 2 else 1 if item.get("url") else 0
    risk_clarity = 1 if any(w in body for w in ["risk", "limit", "caveat", "uncertain", "safety"]) else 0
    if ai_interview_importance_signal and any(
        w in body for w in ["agi", "alignment", "critical", "governance", "limit", "safety", "risk"]
    ):
        risk_clarity = max(risk_clarity, 1)
    if ai_product_operator_signal and any(
        w in body for w in ["risk", "survive", "change", "manager", "disrupt", "hiring"]
    ):
        risk_clarity = max(risk_clarity, 1)
    if not backend_engineer_value_signal and not (reader_value_signal or topic_hits or depth_hits):
        substance_depth = min(substance_depth, 1)
        explainability = min(explainability, 1)

    paper_noise_penalty = 0
    if paper_source and not paper_priority:
        paper_noise_penalty += 4
    if paper_source and paper_narrow_domain_hits >= 2 and paper_user_impact_hits < 2:
        paper_noise_penalty += 2

    raw_total = max(
        0,
        source_authority
        + substance_depth
        + audience_value
        + timeliness
        + explainability
        + novelty_non_repeat
        + sourceability
        + risk_clarity
        - paper_noise_penalty,
    )
    raw_total = max(0, raw_total - ai_temporal_penalty)
    weight = float(source.get("weight", 1.0) or 1.0)
    if is_interview_source(source_type) and not ai_related:
        weight = min(weight, 0.85)
    if paper_source and not paper_priority:
        weight = min(weight, 0.70)
    ranking_multiplier = weight * (AI_PRIORITY_MULTIPLIER if ai_related and not (paper_source and not paper_priority) else 1.0)
    ranking_score_before_source_diversity = round(min(20, raw_total * ranking_multiplier), 2)
    source_diversity = source_diversity_adjustment(source, item, recent_source_context)
    ranking_score = round(ranking_score_before_source_diversity * float(source_diversity["multiplier"]), 2)

    return {
        "source_authority": source_authority,
        "substance_depth": substance_depth,
        "audience_value": audience_value,
        "reader_value_hits": reader_value_hits,
        "reader_value_signal": reader_value_signal,
        "backend_engineer_value_hits": backend_engineer_value_hits,
        "backend_engineer_value_signal": backend_engineer_value_signal,
        "backend_engineer_operating_value_signal": backend_engineer_operating_value_signal,
        "timeliness": timeliness,
        "explainability": explainability,
        "novelty_non_repeat": novelty_non_repeat,
        "sourceability": sourceability,
        "risk_clarity": risk_clarity,
        "promotional_risk": promotional_risk,
        "marketing_hits": marketing_hits,
        "technical_substance_hits": technical_substance_hits,
        "off_audience_context_hits": off_audience_context_hits,
        "off_audience_risk": off_audience_risk,
        "blocked_auto_category": blocked_auto_category,
        "ai_priority": ai_related,
        "ai_source_age_days": age_days,
        "ai_freshness_baseline_days": AI_FRESHNESS_BASELINE_DAYS if ai_related else None,
        "ai_temporal_ok": ai_temporal_ok,
        "ai_temporal_review_required": ai_temporal_review_required,
        "ai_temporal_staleness_risk": ai_temporal_staleness_risk,
        "ai_temporal_penalty": ai_temporal_penalty,
        "ai_temporal_note": ai_temporal_note,
        "ai_time_sensitive_hits": ai_time_sensitive_hits,
        "ai_durable_hits": ai_durable_hits,
        "interview_priority": interview_priority,
        "ai_leader_hits": ai_leader_hits,
        "ai_interview_importance_hits": ai_interview_importance_hits,
        "ai_interview_importance_signal": ai_interview_importance_signal,
        "ai_product_operator_hits": ai_product_operator_hits,
        "ai_product_operator_signal": ai_product_operator_signal,
        "paper_source": paper_source,
        "paper_user_impact": paper_user_impact,
        "paper_user_impact_hits": paper_user_impact_hits,
        "paper_broad_model_hits": paper_broad_model_hits,
        "paper_evidence_hits": paper_evidence_hits,
        "paper_narrow_domain_hits": paper_narrow_domain_hits,
        "paper_noise_penalty": paper_noise_penalty,
        "paper_priority": paper_priority,
        "source_diversity_keys": source_diversity["keys"],
        "source_diversity_multiplier": source_diversity["multiplier"],
        "source_diversity_penalty": source_diversity["penalty"],
        "source_diversity_note": source_diversity["note"],
        "ranking_multiplier": round(ranking_multiplier, 3),
        "ranking_score_before_source_diversity": ranking_score_before_source_diversity,
        "total": raw_total,
        "ranking_score": ranking_score,
    }


def format_decision(score: dict) -> str:
    if score.get("ai_priority") and not score.get("ai_temporal_ok", True):
        return "reject"
    total = int(score["total"])
    if int(score.get("audience_value", 0)) < 2:
        return "reject"
    if total >= 16:
        return "long-form"
    if total >= 13:
        return "shorts"
    if total >= 9:
        return "shorts"
    return "reject"


def decision_reason(source: dict, item: dict, score: dict) -> str:
    return (
        f"{source.get('name')} is tier {source.get('tier')} with "
        f"{score['substance_depth']}/4 substance depth and "
        f"{score['audience_value']}/3 audience value and "
        f"{score['explainability']}/3 explainability for {source.get('category')} viewers"
        f"{'; reader-value signal present' if score.get('reader_value_signal') else '; reader-value signal weak'}"
        f"{'; backend-engineer value present' if score.get('backend_engineer_value_signal') else ''}"
        f"{'; backend operating-judgment value present' if score.get('backend_engineer_operating_value_signal') else ''}"
        f"{'; AI-priority weighted' if score.get('ai_priority') else ''}"
        f"{'; AI temporal check: ' + score.get('ai_temporal_note', '') if score.get('ai_priority') and score.get('ai_temporal_ok') else ''}"
        f"{'; rejected by AI temporal staleness: ' + score.get('ai_temporal_note', '') if score.get('ai_priority') and not score.get('ai_temporal_ok', True) else ''}"
        f"{'; AI leader/interview priority' if score.get('interview_priority') else ''}"
        f"{'; frontier AI interview importance signal' if score.get('ai_interview_importance_signal') else ''}"
        f"{'; AI product/operator interview signal' if score.get('ai_product_operator_signal') else ''}"
        f"{'; AI paper priority' if score.get('paper_priority') else ''}"
        f"{'; paper deprioritized as low user-impact/noisy' if score.get('paper_source') and not score.get('paper_priority') else ''}"
        f"{'; source-diversity penalty: ' + score.get('source_diversity_note', '') if score.get('source_diversity_penalty') else ''}"
        f"{'; penalized as off-audience/non-technical context' if score.get('off_audience_risk') else ''}"
        f"{'; penalized as self-promotional/marketing-like' if score.get('promotional_risk') else ''}."
    )


def compact_source(source: dict, fetch_url: str | None = None) -> dict:
    return {
        "id": source.get("id"),
        "name": source.get("name"),
        "category": source.get("category"),
        "tier": source.get("tier"),
        "type": source.get("type"),
        "url": source.get("url"),
        "fetch_url": fetch_url or source.get("fetch_url") or source.get("url"),
        "weight": source.get("weight"),
    }


def compact_item(item: dict) -> dict:
    summary = clean_text(str(item.get("summary", "")))
    return {
        "title": item.get("title"),
        "url": item.get("url"),
        "published_at": item.get("published_at"),
        "summary_chars": len(summary),
        "summary_preview": summary[:500],
        "metadata_quality": item.get("metadata_quality") or metadata_quality(item),
        "enrichment": item.get("enrichment"),
    }


def reject_reasons(score: dict, seen_before: bool, min_score: int, format_name: str) -> list[str]:
    reasons: list[str] = []
    if seen_before:
        reasons.append("seen_before")
    if score["total"] < min_score:
        reasons.append("below_min_score")
    if format_name == "reject":
        if int(score.get("audience_value", 0)) < 2:
            reasons.append("audience_value_too_low")
        if score.get("ai_priority") and not score.get("ai_temporal_ok", True):
            reasons.append("ai_temporal_stale_or_unknown")
        reasons.append("format_reject")
    return list(dict.fromkeys(reasons))


def should_record_near_miss(source: dict, item: dict, score: dict, reasons: list[str], enriched: bool) -> bool:
    if reasons == ["seen_before"]:
        return False
    tier = int(source.get("tier", 3) or 3)
    if tier > 2:
        return False
    if str(source.get("category", "")) not in {"AI", "Backend"}:
        return False
    quality = item.get("metadata_quality") or metadata_quality(item)
    return bool(
        enriched
        or quality.get("thin_summary")
        or score.get("ranking_score", 0) >= 8
        or score.get("total", 0) >= 7
    )


def make_near_miss_record(
    observed_at: str,
    source: dict,
    fetch_url: str,
    item: dict,
    key: str,
    score: dict,
    format_name: str,
    reasons: list[str],
) -> dict:
    return {
        "observed_at": observed_at,
        "source": compact_source(source, fetch_url),
        "item": compact_item(item),
        "dedupe_key": key,
        "candidate_score": score,
        "format_decision": format_name,
        "reject_reasons": reasons,
        "decision_reason": decision_reason(source, item, score),
    }


def read_health(path: Path) -> dict:
    if not path.exists():
        return {"sources": {}}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"sources": {}}


def write_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def top_diverse(candidates: list[dict], limit: int = 5, max_per_source: int = 2) -> list[dict]:
    selected: list[dict] = []
    counts: dict[str, int] = {}
    for candidate in candidates:
        source_name = str(candidate["source"]["name"])
        if counts.get(source_name, 0) >= max_per_source:
            continue
        selected.append(candidate)
        counts[source_name] = counts.get(source_name, 0) + 1
        if len(selected) >= limit:
            return selected
    return selected


def main() -> int:
    parser = argparse.ArgumentParser(description="Watch OpenClaw source registry.")
    parser.add_argument("--registry", type=Path, default=DEFAULT_REGISTRY)
    parser.add_argument("--report-dir", type=Path, default=DEFAULT_REPORT_DIR)
    parser.add_argument("--date", default=dt.datetime.now(TAIPEI).date().isoformat())
    parser.add_argument("--max-items-per-source", type=int, default=5)
    parser.add_argument("--min-score", type=int, default=9)
    parser.add_argument("--fetch-timeout", type=int, default=15)
    parser.add_argument("--limit-sources", type=int, default=0)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--replace", action="store_true", help="Rewrite the current date JSONL instead of appending.")
    args = parser.parse_args()

    sources = [s for s in load_registry(args.registry) if s.get("enabled", True)]
    if args.limit_sources:
        sources = sources[: args.limit_sources]
    active_source_ids = {str(source.get("id")) for source in sources}

    args.report_dir.mkdir(parents=True, exist_ok=True)
    output_path = args.report_dir / f"{args.date}.jsonl"
    near_miss_path = args.report_dir / f"{args.date}-near-misses.jsonl"
    health_path = args.report_dir / "source-health.json"
    if args.replace and not args.dry_run and output_path.exists():
        output_path.unlink()
    if args.replace and not args.dry_run and near_miss_path.exists():
        near_miss_path.unlink()
    health = read_health(health_path)
    health.setdefault("sources", {})

    seen = load_seen_keys(args.report_dir, output_path)
    recent_source_context = load_recent_source_context()
    now = dt.datetime.now(dt.timezone.utc)
    observed_at = now.isoformat()
    candidates: list[dict] = []
    near_misses: list[dict] = []
    error_count = 0

    for source in sources:
        source_id = str(source.get("id"))
        fetch_url = str(source.get("fetch_url") or source.get("url"))
        source_health = {
            "status": "ok",
            "fetched_at": observed_at,
            "fetch_url": fetch_url,
            "item_count": 0,
            "scanned_item_count": 0,
            "candidate_count": 0,
            "near_miss_count": 0,
            "enriched_count": 0,
            "enrichment_error_count": 0,
            "error": None,
        }
        try:
            text, final_url, content_type = fetch_text(fetch_url, timeout=args.fetch_timeout)
            items = parse_items(text, content_type, source)
            max_items = int(source.get("max_items", args.max_items_per_source) or args.max_items_per_source)
            scan_items = int(
                source.get(
                    "scan_items",
                    max(max_items, args.max_items_per_source * SOURCE_SCAN_MULTIPLIER, SOURCE_SCAN_FLOOR),
                )
                or max_items
            )
            max_enrichments = int(
                source.get("max_enrichments", DEFAULT_MAX_ENRICHMENTS_PER_SOURCE)
                or DEFAULT_MAX_ENRICHMENTS_PER_SOURCE
            )
            source_health["resolved_url"] = final_url
            source_health["content_type"] = content_type
            source_health["item_count"] = len(items)
            source_health["scan_item_limit"] = scan_items
            for item in items[:scan_items]:
                if item_excluded(source, item):
                    continue
                item["metadata_quality"] = metadata_quality(item)
                enriched = False
                if (
                    source_health["enriched_count"] < max_enrichments
                    and should_enrich_candidate(source, item, now)
                ):
                    item = enrich_item_from_page(item, timeout=args.fetch_timeout)
                    enriched = True
                    source_health["enriched_count"] += 1
                    if item.get("enrichment", {}).get("status") == "error":
                        source_health["enrichment_error_count"] += 1
                key = candidate_key(str(item.get("url", "")), str(item.get("title", "")))
                seen_before = key in seen
                score = score_candidate(source, item, seen_before, now, recent_source_context)
                format_name = format_decision(score)
                reasons = reject_reasons(score, seen_before, args.min_score, format_name)
                source_health["scanned_item_count"] += 1
                if reasons:
                    if should_record_near_miss(source, item, score, reasons, enriched):
                        source_health["near_miss_count"] += 1
                        near_misses.append(
                            make_near_miss_record(
                                observed_at,
                                source,
                                fetch_url,
                                item,
                                key,
                                score,
                                format_name,
                                reasons,
                            )
                        )
                    continue
                seen.add(key)
                source_health["candidate_count"] += 1
                source_health["last_candidate_at"] = observed_at
                candidates.append(
                    {
                        "observed_at": observed_at,
                        "source": compact_source(source, fetch_url),
                        "item": item,
                        "dedupe_key": key,
                        "candidate_score": score,
                        "format_decision": format_name,
                        "decision_reason": decision_reason(source, item, score),
                    }
                )
            source_health["last_success_at"] = observed_at
        except Exception as exc:
            error_count += 1
            source_health.update(
                {
                    "status": "error",
                    "error": f"{type(exc).__name__}: {exc}",
                    "item_count": 0,
                    "candidate_count": 0,
                }
            )
        health["sources"][source_id] = {**health["sources"].get(source_id, {}), **source_health}

    candidates.sort(
        key=lambda obj: (
            obj["candidate_score"]["ranking_score"],
            bool(obj["candidate_score"].get("ai_priority")),
            obj["candidate_score"]["total"],
        ),
        reverse=True,
    )
    top_candidates = top_diverse(candidates)

    if not args.dry_run and candidates:
        with output_path.open("a", encoding="utf-8") as fh:
            for candidate in candidates:
                fh.write(json.dumps(candidate, ensure_ascii=False, sort_keys=True) + "\n")
    if not args.dry_run and near_misses:
        with near_miss_path.open("a", encoding="utf-8") as fh:
            for near_miss in near_misses:
                fh.write(json.dumps(near_miss, ensure_ascii=False, sort_keys=True) + "\n")
    if not args.dry_run:
        health["sources"] = {
            source_id: source_health
            for source_id, source_health in health["sources"].items()
            if source_id in active_source_ids
        }
        health["generated_at"] = observed_at
        health["registry"] = str(args.registry)
        write_json(health_path, health)

    print(
        json.dumps(
            {
                "status": "ok",
                "dry_run": args.dry_run,
                "sources_scanned": len(sources),
                "candidates": len(candidates),
                "near_misses": len(near_misses),
                "errors": error_count,
                "output": str(output_path),
                "near_miss_output": str(near_miss_path),
                "health": str(health_path),
                "top": [
                    {
                        "score": c["candidate_score"]["ranking_score"],
                        "source": c["source"]["name"],
                        "title": c["item"]["title"],
                        "url": c["item"]["url"],
                        "format": c["format_decision"],
                        "ai_priority": c["candidate_score"].get("ai_priority", False),
                        "interview_priority": c["candidate_score"].get("interview_priority", False),
                        "paper_priority": c["candidate_score"].get("paper_priority", False),
                        "paper_user_impact": c["candidate_score"].get("paper_user_impact", False),
                        "ai_source_age_days": c["candidate_score"].get("ai_source_age_days"),
                        "ai_temporal_review_required": c["candidate_score"].get(
                            "ai_temporal_review_required", False
                        ),
                        "ai_temporal_staleness_risk": c["candidate_score"].get(
                            "ai_temporal_staleness_risk", "none"
                        ),
                        "ai_temporal_note": c["candidate_score"].get("ai_temporal_note", ""),
                        "source_diversity_penalty": c["candidate_score"].get("source_diversity_penalty", 0.0),
                        "source_diversity_note": c["candidate_score"].get("source_diversity_note", ""),
                    }
                    for c in top_candidates
                ],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0 if error_count == 0 or candidates else 2


if __name__ == "__main__":
    raise SystemExit(main())
