#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-us}" # us | tw

python3 - "$MODE" <<'PY'
import csv
import datetime as dt
import email.utils
import io
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

mode = sys.argv[1].lower()

if mode not in {"us", "tw"}:
    print("Usage: market_brief_data.sh [us|tw]")
    sys.exit(1)

def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", errors="replace")

def stooq_last_two(symbol: str):
    q = urllib.parse.quote(symbol, safe='')
    url = f"https://stooq.com/q/d/l/?s={q}&i=d"
    txt = fetch_text(url)
    if txt.strip().lower().startswith("no data"):
        return None
    rows = list(csv.DictReader(io.StringIO(txt)))
    rows = [r for r in rows if r.get("Close")]
    if len(rows) < 2:
        return None
    prev, last = rows[-2], rows[-1]
    p = float(prev["Close"])
    c = float(last["Close"])
    chg = c - p
    pct = (chg / p) * 100 if p else 0.0
    return {
        "date": last["Date"],
        "prev_close": p,
        "close": c,
        "chg": chg,
        "pct": pct,
    }

def parse_rss(url: str, limit=12):
    xml = fetch_text(url)
    root = ET.fromstring(xml)
    out = []
    for item in root.findall("./channel/item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        source = ""
        src = item.find("source")
        if src is not None and (src.text or "").strip():
            source = src.text.strip()
        if not source and " - " in title:
            source = title.rsplit(" - ", 1)[-1].strip()
        out.append({"title": title, "link": link, "pub": pub, "source": source})
        if len(out) >= limit:
            break
    return out

def gnews_rss(query: str, hl: str, gl: str, ceid: str) -> str:
    q = urllib.parse.quote_plus(query)
    return f"https://news.google.com/rss/search?q={q}&hl={hl}&gl={gl}&ceid={ceid}"

now = dt.datetime.now(dt.timezone(dt.timedelta(hours=8)))

if mode == "us":
    market_name = "US"
    symbols = [
        ("S&P 500", "^spx"),
        ("NASDAQ", "^ixic"),
        ("Dow Jones", "^dji"),
    ]
    queries = [
        "US stock market close Reuters",
        "S&P 500 market close why today",
        "Nasdaq market close analysis",
    ]
    hl, gl, ceid = "en-US", "US", "US:en"
else:
    market_name = "TW"
    symbols = [
        ("TAIEX", "^twse"),
        ("USD/TWD", "usdtwd"),
        ("Gold (XAU/USD)", "xauusd"),
    ]
    queries = [
        "台股 收盤 盤後 分析",
        "加權指數 大漲 大跌 原因",
        "台積電 收盤",
    ]
    hl, gl, ceid = "zh-TW", "TW", "TW:zh-Hant"

print(f"MARKET={market_name}")
print(f"GENERATED_AT={now.strftime('%Y-%m-%d %H:%M %z')} (Asia/Taipei)")
print("[INDEX]")

moves = []
for name, sym in symbols:
    d = stooq_last_two(sym)
    if not d:
        print(f"- {name}|N/A|N/A|N/A|N/A")
        continue
    print(f"- {name}|{d['date']}|{d['close']:.4f}|{d['chg']:+.4f}|{d['pct']:+.2f}%")
    moves.append((name, d["pct"]))

big = [(n, p) for n, p in moves if abs(p) >= 1.5]
print("[BIG_MOVE]")
if big:
    print("YES")
    for n, p in sorted(big, key=lambda x: abs(x[1]), reverse=True):
        print(f"- {n}|{p:+.2f}%")
else:
    print("NO")

print("[HEADLINES]")
seen = set()
items = []
for q in queries:
    try:
        url = gnews_rss(q, hl=hl, gl=gl, ceid=ceid)
        rows = parse_rss(url, limit=10)
        for r in rows:
            key = (r['title'], r['link'])
            if key in seen:
                continue
            seen.add(key)
            items.append(r)
    except Exception:
        continue

# Prefer newer items when parsable

def parse_pub(s: str):
    try:
        return email.utils.parsedate_to_datetime(s)
    except Exception:
        return dt.datetime(1970, 1, 1, tzinfo=dt.timezone.utc)

items.sort(key=lambda x: parse_pub(x.get('pub', '')), reverse=True)
for i, r in enumerate(items[:8], 1):
    title = r['title'].replace('\n', ' ').strip()
    source = r['source'] or "Unknown"
    pub = r['pub']
    link = r['link']
    print(f"{i}) {title} | {source} | {pub} | {link}")
PY