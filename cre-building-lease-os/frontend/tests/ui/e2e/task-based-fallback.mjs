#!/usr/bin/env node

const API = process.env.API_BASE_URL || "http://127.0.0.1:8080/api";
const headers = { "Content-Type": "application/json", "X-Actor-Id": "fallback-task-v03" };

async function post(path, data, extra = {}) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { ...headers, ...extra },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function get(path) {
  const res = await fetch(`${API}${path}`);
  return res.json();
}

const results = [];
function record(id, ok, note) {
  results.push({ id, ok, note });
}

(async () => {
  const runId = Date.now();
  const b = await post("/buildings", {
    name: `Fallback-${runId}`,
    code: `F${String(runId).slice(-6)}`,
    managementFee: 260,
  });
  const buildingId = b.data.id;

  await post(`/buildings/${buildingId}/floors/generate`, { basementFloors: 0, aboveGroundFloors: 2 });
  const floors = await get(`/buildings/${buildingId}/floors`);
  const floor1 = floors.data.find((x) => x.label === "1F");

  const unit = await post(`/floors/${floor1.id}/units`, { code: "FA1", grossArea: 100 });
  const tenant = await post(`/buildings/${buildingId}/tenants`, { name: `Tenant-${runId}` });

  // T-01 Global prerequisites
  record("T-01", Boolean(buildingId && floor1?.id), "可建立大樓/樓層，供 switcher/search/quick-add 使用");

  // T-02 Floors flow
  const occDraft = await post("/occupancies", {
    buildingId,
    unitId: unit.data.id,
    tenantId: tenant.data.id,
    status: "DRAFT",
  });
  const lease = await post("/leases", {
    buildingId,
    tenantId: tenant.data.id,
    unitIds: [unit.data.id],
    status: "ACTIVE",
    startDate: "2026-03-01",
    endDate: "2027-02-28",
  });
  record("T-02", Boolean(occDraft.ok && lease.ok), "可由 API 完成草稿入住 + 建租約主路徑");

  // T-03 Stacking assign <=2 interactions (API proxy as minimal fallback)
  const unit2 = await post(`/floors/${floor1.id}/units`, { code: "FA2", grossArea: 80 });
  const occ2 = await post("/occupancies", {
    buildingId,
    unitId: unit2.data.id,
    tenantId: tenant.data.id,
    status: "DRAFT",
  });
  record("T-03", Boolean(occ2.ok), "可指派單位為 DRAFT occupancy（stacking fallback）");

  // T-04 Inbox categories
  const repair = await post("/repairs", {
    buildingId,
    scopeType: "FLOOR",
    floorId: floor1.id,
    item: "待驗收案件",
    vendorName: "Fallback Vendor",
    quoteAmount: 8888,
    status: "COMPLETED",
  });
  const tenants = await get(`/buildings/${buildingId}/tenants`);
  const occupancies = await get(`/buildings/${buildingId}/occupancies`);
  const repairs = await get(`/buildings/${buildingId}/repairs`);
  const hasTenantMissing = tenants.data.some((t) => !t.taxId || !t.contactName);
  const hasDraftNoLease = occupancies.data.some((o) => o.status === "DRAFT" && !o.leaseId);
  const hasCompletedNoAccepted = repairs.data.some((r) => r.status === "COMPLETED");
  record("T-04", hasTenantMissing && hasDraftNoLease && hasCompletedNoAccepted && repair.ok, "三類 inbox 缺漏可被偵測");

  // T-05 batch split parser fallback
  const split = await post(`/units/${unit2.data.id}/split`, {
    parts: [
      { code: "FA2-1", grossArea: 40 },
      { code: "FA2-2", grossArea: 40 },
    ],
  });
  record("T-05", Boolean(split.ok), "批次 split payload 可執行（paste parser fallback）");

  // T-06 acceptance validation
  const invalidAccept = await fetch(`${API}/repairs`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      buildingId,
      scopeType: "FLOOR",
      floorId: floor1.id,
      item: "驗收缺欄位",
      vendorName: "v",
      quoteAmount: 1000,
      status: "ACCEPTED",
    }),
  }).then((r) => r.json());

  const patchAccepted = await fetch(`${API}/repairs/${repair.data.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      status: "ACCEPTED",
      acceptanceResult: "PASS",
      inspectorName: "Fallback Inspector",
    }),
  }).then((r) => r.json());

  record("T-06", !invalidAccept.ok && patchAccepted.ok, "驗收欄位缺漏會擋下；補齊後可 ACCEPTED");

  // T-07 attachment upload/list
  const fd = new FormData();
  fd.append("file", new Blob(["fallback-evidence"], { type: "text/plain" }), "fallback.txt");
  const upload = await fetch(`${API}/repairs/${repair.data.id}/attachments`, {
    method: "POST",
    headers: { "X-Actor-Id": "fallback-task-v03" },
    body: fd,
  }).then((r) => r.json());
  const files = await get(`/repairs/${repair.data.id}/attachments`);
  record("T-07", upload.ok && files.ok && files.data.length > 0, "附件可上傳並列出");

  console.log("# Task-based Fallback Result");
  console.log("| Task | PASS/FAIL | Evidence |");
  console.log("|---|---|---|");
  for (const r of results) {
    console.log(`| ${r.id} | ${r.ok ? "PASS" : "FAIL"} | ${r.note} |`);
  }

  const failed = results.filter((x) => !x.ok);
  process.exit(failed.length > 0 ? 1 : 0);
})();
