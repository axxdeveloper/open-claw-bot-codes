#!/usr/bin/env python3
import csv
import json
import re
import sys
from pathlib import Path
from urllib import request, error

BASE = "http://127.0.0.1:8080/api"
HEADERS = {"Content-Type": "application/json", "X-Actor-Id": "bulk-import-script"}


def http(method, url, body=None):
    data = None
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = request.Request(url, method=method, headers=HEADERS, data=data)
    try:
        with request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code} {method} {url}: {detail}")


def read_csv(path):
    with open(path, "r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def parse_unit_codes(raw: str):
    # Keep import robust: split obvious separators, expand simple ranges like A1-A3.
    txt = (raw or "").replace("~", "-").replace("、", ",").replace("&", ",")
    txt = re.sub(r"\s+", " ", txt).strip()
    if not txt:
        return ["全"]

    parts = [p.strip() for p in re.split(r"[,/ ]+", txt) if p.strip()]
    out = []
    for p in parts:
        m = re.fullmatch(r"([A-Za-z])(\d+)-\1(\d+)", p)
        if m:
            prefix, a, b = m.group(1).upper(), int(m.group(2)), int(m.group(3))
            if a <= b and b - a <= 20:
                out.extend([f"{prefix}{i}" for i in range(a, b + 1)])
                continue
        out.append(p.upper())

    # de-dup keep order
    dedup = []
    for x in out:
        if x not in dedup:
            dedup.append(x)
    return dedup or ["全"]


def main():
    if len(sys.argv) < 2:
        print("Usage: upload_to_cre.py <buildingId> [--apply]", file=sys.stderr)
        sys.exit(1)

    building_id = sys.argv[1]
    apply = "--apply" in sys.argv

    root = Path(__file__).resolve().parent
    tenants = read_csv(root / "tenants.csv")
    occupancies_raw = read_csv(root / "occupancies_draft.csv")

    # expand rows by parsed unit codes
    occupancies = []
    for row in occupancies_raw:
        for code in parse_unit_codes(row.get("unitCode", "")):
            x = dict(row)
            x["unitCode"] = code
            occupancies.append(x)

    # 1) existing tenants
    t_resp = http("GET", f"{BASE}/buildings/{building_id}/tenants")
    t_map = {t["name"]: t["id"] for t in t_resp.get("data", [])}

    created_tenants = 0
    if apply:
        for t in tenants:
            name = (t.get("name") or "").strip()
            if not name or name in t_map:
                continue
            payload = {
                "name": name,
                "taxId": t.get("taxId") or None,
                "contactName": t.get("contactName") or None,
                "phone": t.get("phone") or None,
                "email": t.get("email") or None,
                "notes": t.get("notes") or None,
            }
            r = http("POST", f"{BASE}/buildings/{building_id}/tenants", payload)
            tid = r.get("data", {}).get("id")
            if tid:
                t_map[name] = tid
                created_tenants += 1

    # 2) floors
    floors = http("GET", f"{BASE}/buildings/{building_id}/floors").get("data", [])
    floor_label_to_id = {f["label"]: f["id"] for f in floors}

    # 3) units map and create missing units
    unit_map = {}
    for f in floors:
        fd = http("GET", f"{BASE}/floors/{f['id']}").get("data", {})
        for u in fd.get("units", []):
            if u.get("isCurrent", True):
                unit_map[(f["label"], u["code"].upper())] = u["id"]

    created_units = 0
    if apply:
        needed = {(o["floorLabel"].strip(), o["unitCode"].strip().upper()) for o in occupancies if o.get("floorLabel") and o.get("unitCode")}
        for floor_label, code in sorted(needed):
            fid = floor_label_to_id.get(floor_label)
            if not fid:
                continue
            if (floor_label, code) in unit_map:
                continue
            try:
                r = http("POST", f"{BASE}/floors/{fid}/units", {"code": code, "grossArea": 1})
                uid = r.get("data", {}).get("id")
                if uid:
                    unit_map[(floor_label, code)] = uid
                    created_units += 1
            except Exception:
                pass

    # refresh map once
    if apply:
        unit_map = {}
        for f in floors:
            fd = http("GET", f"{BASE}/floors/{f['id']}").get("data", {})
            for u in fd.get("units", []):
                if u.get("isCurrent", True):
                    unit_map[(f["label"], u["code"].upper())] = u["id"]

    # 4) existing DRAFT occupancy set
    existing_draft = set()
    for f in floors:
        fd = http("GET", f"{BASE}/floors/{f['id']}").get("data", {})
        for u in fd.get("units", []):
            uid = u.get("id")
            for oc in u.get("occupancies", []):
                if oc.get("status") == "DRAFT":
                    existing_draft.add((uid, oc.get("tenantId")))

    # 5) create DRAFT occupancies
    created_occ = 0
    skipped = []
    if apply:
        for o in occupancies:
            floor = (o.get("floorLabel") or "").strip()
            code = (o.get("unitCode") or "").strip().upper()
            tname = (o.get("tenantName") or "").strip()
            uid = unit_map.get((floor, code))
            tid = t_map.get(tname)

            if not uid or not tid:
                skipped.append({"reason": "unitOrTenantNotFound", "floor": floor, "unitCode": code, "tenantName": tname})
                continue
            if (uid, tid) in existing_draft:
                skipped.append({"reason": "duplicateDraft", "floor": floor, "unitCode": code, "tenantName": tname})
                continue

            payload = {
                "buildingId": building_id,
                "unitId": uid,
                "tenantId": tid,
                "status": "DRAFT",
                "notes": o.get("notes") or None,
            }
            try:
                http("POST", f"{BASE}/occupancies", payload)
                created_occ += 1
                existing_draft.add((uid, tid))
            except Exception as e:
                skipped.append({"reason": "createFailed", "floor": floor, "unitCode": code, "tenantName": tname, "error": str(e)})

    report = {
        "apply": apply,
        "buildingId": building_id,
        "tenantRows": len(tenants),
        "occupancyRowsRaw": len(occupancies_raw),
        "occupancyRowsExpanded": len(occupancies),
        "createdTenants": created_tenants,
        "createdUnits": created_units,
        "createdDraftOccupancies": created_occ,
        "skippedCount": len(skipped),
        "skipped": skipped[:80],
    }

    (root / "upload_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
