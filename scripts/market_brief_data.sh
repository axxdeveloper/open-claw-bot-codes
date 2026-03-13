#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-us}" # us | tw

python3 - "$MODE" <<'PY'
import csv
import datetime as dt
import email.utils
import io
import json
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

try:
    from openpyxl import load_workbook
except Exception:
    load_workbook = None

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
    pv = to_num(prev.get("Volume"))
    lv = to_num(last.get("Volume"))
    return {
        "date": last["Date"],
        "prev_close": p,
        "close": c,
        "chg": chg,
        "pct": pct,
        "prev_volume": pv,
        "volume": lv,
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


def fetch_tw_margin_summary():
    base = "https://www.twse.com.tw/rwd/zh/marginTrading/MI_MARGN"
    today = dt.datetime.now(dt.timezone(dt.timedelta(hours=8))).date()
    for back in range(0, 10):
        d = today - dt.timedelta(days=back)
        url = f"{base}?date={d.strftime('%Y%m%d')}&selectType=MS&response=json"
        try:
            obj = json.loads(fetch_text(url))
        except Exception:
            continue
        if obj.get("stat") != "OK":
            continue
        tables = obj.get("tables") or []
        if not tables:
            continue
        rows = tables[0].get("data") or []
        picked = {}
        for r in rows:
            if not r:
                continue
            key = str(r[0]).strip()
            picked[key] = r
        unit = picked.get("融資(交易單位)")
        amt = picked.get("融資金額(仟元)")
        if not unit and not amt:
            continue
        out = {
            "date": obj.get("date", d.strftime('%Y%m%d')),
            "fin_unit_prev": unit[4] if unit and len(unit) > 4 else "",
            "fin_unit_today": unit[5] if unit and len(unit) > 5 else "",
            "fin_amt_prev_k": amt[4] if amt and len(amt) > 4 else "",
            "fin_amt_today_k": amt[5] if amt and len(amt) > 5 else "",
        }
        return out
    return None


def to_num(s):
    if s is None:
        return None
    try:
        return float(str(s).replace(',', '').strip())
    except Exception:
        return None


def fetch_us_margin_finra():
    if load_workbook is None:
        return None
    url = "https://www.finra.org/sites/default/files/2021-03/margin-statistics.xlsx"
    tmp = "/tmp/finra-margin-statistics.xlsx"
    try:
        urllib.request.urlretrieve(url, tmp)
        wb = load_workbook(tmp, data_only=True, read_only=True)
        ws = wb[wb.sheetnames[0]]
        rows = []
        for r in ws.iter_rows(min_row=2, max_row=2000, values_only=True):
            ym = r[0]
            debit = r[1]
            if ym and isinstance(ym, str) and debit is not None:
                rows.append((ym.strip(), float(debit)))
        if len(rows) < 1:
            return None
        latest = rows[0]
        prev = rows[1] if len(rows) > 1 else None
        out = {
            "month": latest[0],
            "debit_usd_m": latest[1],
            "prev_month": prev[0] if prev else "",
            "prev_debit_usd_m": prev[1] if prev else None,
        }
        return out
    except Exception:
        return None


def fetch_tw_institutional_flow():
    base = "https://www.twse.com.tw/rwd/zh/fund/BFI82U"
    today = dt.datetime.now(dt.timezone(dt.timedelta(hours=8))).date()
    for back in range(0, 10):
        d = today - dt.timedelta(days=back)
        url = f"{base}?dayDate={d.strftime('%Y%m%d')}&type=day&response=json"
        try:
            obj = json.loads(fetch_text(url))
        except Exception:
            continue
        if obj.get("stat") != "OK":
            continue
        rows = obj.get("data") or []
        if not rows:
            continue
        picked = {str(r[0]).strip(): r for r in rows if r}

        def diff(name):
            r = picked.get(name)
            return to_num(r[3]) if r and len(r) > 3 else None

        dealer_self = diff("自營商(自行買賣)")
        dealer_hedge = diff("自營商(避險)")
        dealer_total = None
        if dealer_self is not None or dealer_hedge is not None:
            dealer_total = (dealer_self or 0) + (dealer_hedge or 0)

        return {
            "date": obj.get("date", d.strftime('%Y%m%d')),
            "foreign_diff": diff("外資及陸資(不含外資自營商)"),
            "trust_diff": diff("投信"),
            "dealer_diff": dealer_total,
            "total_diff": diff("合計"),
        }
    return None


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

print("[MARGIN_BALANCE]")
if mode == "tw":
    m = fetch_tw_margin_summary()
    if not m:
        print("- TW|N/A|N/A")
    else:
        unit_prev = to_num(m.get("fin_unit_prev"))
        unit_today = to_num(m.get("fin_unit_today"))
        amt_prev = to_num(m.get("fin_amt_prev_k"))
        amt_today = to_num(m.get("fin_amt_today_k"))
        unit_chg = (unit_today - unit_prev) if unit_prev is not None and unit_today is not None else None
        amt_chg = (amt_today - amt_prev) if amt_prev is not None and amt_today is not None else None
        print(
            f"- TW|{m.get('date','N/A')}|融資餘額(交易單位)={m.get('fin_unit_today','N/A')}|較前日={unit_chg:+,.0f}" if unit_chg is not None
            else f"- TW|{m.get('date','N/A')}|融資餘額(交易單位)={m.get('fin_unit_today','N/A')}|較前日=N/A"
        )
        print(
            f"- TW|{m.get('date','N/A')}|融資餘額金額(仟元)={m.get('fin_amt_today_k','N/A')}|較前日={amt_chg:+,.0f}" if amt_chg is not None
            else f"- TW|{m.get('date','N/A')}|融資餘額金額(仟元)={m.get('fin_amt_today_k','N/A')}|較前日=N/A"
        )
else:
    m = fetch_us_margin_finra()
    if not m:
        print("- US|N/A|N/A")
    else:
        latest = m.get("debit_usd_m")
        prev = m.get("prev_debit_usd_m")
        mom = ((latest - prev) / prev * 100.0) if (latest is not None and prev) else None
        print(
            f"- US|{m.get('month','N/A')}|FINRA客戶融資借款(USD million)={latest:,.0f}|MoM={mom:+.2f}%|prev={m.get('prev_month','N/A')}"
            if mom is not None else
            f"- US|{m.get('month','N/A')}|FINRA客戶融資借款(USD million)={latest:,.0f}|MoM=N/A"
        )

print("[CAPITAL_FLOW]")
if mode == "tw":
    f = fetch_tw_institutional_flow()
    if not f:
        print("- TW|N/A|三大法人買賣超資料暫缺")
    else:
        def fmt_ntd(v):
            return "N/A" if v is None else f"{v:,.0f}"
        print(f"- TW|{f.get('date','N/A')}|外資及陸資買賣差額(元)={fmt_ntd(f.get('foreign_diff'))}")
        print(f"- TW|{f.get('date','N/A')}|投信買賣差額(元)={fmt_ntd(f.get('trust_diff'))}")
        print(f"- TW|{f.get('date','N/A')}|自營商合計買賣差額(元)={fmt_ntd(f.get('dealer_diff'))}")
        print(f"- TW|{f.get('date','N/A')}|三大法人合計買賣差額(元)={fmt_ntd(f.get('total_diff'))}")
else:
    us_symbols = [
        ("SPY", "spy.us"),
        ("QQQ", "qqq.us"),
        ("IWM", "iwm.us"),
        ("XLK", "xlk.us"),
        ("XLE", "xle.us"),
        ("XLF", "xlf.us"),
    ]
    flow_rows = []
    latest_date = "N/A"
    for label, sym in us_symbols:
        d = stooq_last_two(sym)
        if not d:
            continue
        latest_date = d.get("date", latest_date)
        vol = d.get("volume")
        pvol = d.get("prev_volume")
        vchg = ((vol - pvol) / pvol * 100.0) if (vol is not None and pvol) else None
        flow_rows.append((label, d.get("pct"), vchg))
    if not flow_rows:
        print("- US|N/A|ETF 資金 proxy 資料暫缺")
    else:
        row_txt = []
        for label, p, v in flow_rows:
            ptxt = "N/A" if p is None else f"{p:+.2f}%"
            vtxt = "N/A" if v is None else f"{v:+.2f}%"
            row_txt.append(f"{label}:{ptxt},Vol{vtxt}")
        print(f"- US|{latest_date}|ETF 資金 proxy（日漲跌 + 成交量變化）|" + " ; ".join(row_txt))

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