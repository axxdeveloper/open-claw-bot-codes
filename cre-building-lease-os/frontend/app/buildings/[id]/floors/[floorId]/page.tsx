"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  EmptyState,
  PageHeader,
  SectionBlock,
  StatusChip,
  SummaryCards,
} from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

type SplitDraft = {
  c1: string;
  g1: string;
  c2: string;
  g2: string;
};

function displayAmount(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export default function FloorDetailPage() {
  const params = useParams<{ id: string; floorId: string }>();
  const id = params.id;
  const floorId = params.floorId;

  const [building, setBuilding] = useState<any>(null);
  const [floor, setFloor] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [floorOwners, setFloorOwners] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [occupancyByUnit, setOccupancyByUnit] = useState<Map<string, string>>(new Map());
  const [selectedTenant, setSelectedTenant] = useState<Record<string, string>>({});
  const [splitDrafts, setSplitDrafts] = useState<Record<string, SplitDraft>>({});
  const [batchSplitText, setBatchSplitText] = useState("");
  const [batchSplitUnitId, setBatchSplitUnitId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    const [buildingRes, floorRes, tenantsRes, ownersRes, floorOwnersRes, repairsRes, occRes] = await Promise.all([
      apiFetch<any>(`/buildings/${id}`),
      apiFetch<any>(`/floors/${floorId}`),
      apiFetch<any[]>(`/buildings/${id}/tenants`),
      apiFetch<any[]>(`/buildings/${id}/owners`),
      apiFetch<any[]>(`/floors/${floorId}/owners`),
      apiFetch<any[]>(`/buildings/${id}/repairs?floorId=${floorId}`),
      apiFetch<any[]>(`/buildings/${id}/occupancies`),
    ]);

    if (!floorRes.ok) {
      setError(apiErrorMessage(floorRes.error));
      return;
    }

    const floorData = floorRes.data.floor;
    const unitRows = floorRes.data.units || [];

    if (buildingRes.ok) setBuilding(buildingRes.data);
    setFloor(floorData);
    setUnits(unitRows);
    if (!batchSplitUnitId && unitRows.length > 0) {
      setBatchSplitUnitId(unitRows[0].id);
    }

    const draftDefaults: Record<string, SplitDraft> = {};
    for (const u of unitRows) {
      draftDefaults[u.id] = {
        c1: `${u.code}-1`,
        c2: `${u.code}-2`,
        g1: u.grossArea ? (Number(u.grossArea) / 2).toFixed(2) : "0",
        g2: u.grossArea ? (Number(u.grossArea) / 2).toFixed(2) : "0",
      };
    }
    setSplitDrafts(draftDefaults);

    if (tenantsRes.ok) setTenants(tenantsRes.data);
    if (ownersRes.ok) setOwners(ownersRes.data);
    if (floorOwnersRes.ok) setFloorOwners(floorOwnersRes.data);
    if (repairsRes.ok) setRepairs(repairsRes.data);

    const byUnit = new Map<string, string>();
    if (occRes.ok) {
      const unitIds = new Set<string>(unitRows.map((u: any) => u.id));
      for (const o of occRes.data) {
        if (!unitIds.has(o.unitId)) continue;
        const prev = byUnit.get(o.unitId);
        if (!prev || prev !== "ACTIVE") {
          byUnit.set(o.unitId, o.status);
        }
      }
    }
    setOccupancyByUnit(byUnit);
  };

  useEffect(() => {
    if (!id || !floorId) return;
    load();
  }, [id, floorId]);

  if (!id || !floorId) return null;

  const addUnit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData(e.currentTarget);
    const r = await apiFetch(`/floors/${floorId}/units`, {
      method: "POST",
      body: JSON.stringify({
        code: String(fd.get("code") || "").trim(),
        grossArea: Number(fd.get("grossArea") || 0),
        netArea: fd.get("netArea") ? Number(fd.get("netArea")) : null,
        balconyArea: fd.get("balconyArea") ? Number(fd.get("balconyArea")) : null,
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("單位已新增，建議接著指派住戶或建立租約。");
    (e.target as HTMLFormElement).reset();
    load();
  };

  const splitUnit = async (unitId: string) => {
    const d = splitDrafts[unitId];
    if (!d) return;

    setError(null);
    setSuccess(null);

    const r = await apiFetch(`/units/${unitId}/split`, {
      method: "POST",
      body: JSON.stringify({
        parts: [
          { code: d.c1.trim(), grossArea: Number(d.g1) },
          { code: d.c2.trim(), grossArea: Number(d.g2) },
        ],
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("單位已切分完成。");
    load();
  };

  const batchSplit = async () => {
    setError(null);
    setSuccess(null);

    if (!batchSplitUnitId) {
      setError("請先選擇要切分的來源單位。");
      return;
    }

    const parts = batchSplitText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [code, gross, net, balcony] = line.split(",").map((x) => x.trim());
        return {
          code,
          grossArea: Number(gross),
          netArea: net ? Number(net) : null,
          balconyArea: balcony ? Number(balcony) : null,
        };
      });

    if (parts.length < 2 || parts.some((x) => !x.code || Number.isNaN(x.grossArea))) {
      setError("貼上格式有誤：每行需為 code,gross,net,balcony，且至少兩行。");
      return;
    }

    const r = await apiFetch(`/units/${batchSplitUnitId}/split`, {
      method: "POST",
      body: JSON.stringify({ parts }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setBatchSplitText("");
    setSuccess("批次切分完成。已依貼上內容建立新單位。 ");
    load();
  };

  const assignDraftOccupancy = async (unitId: string) => {
    const tenantId = selectedTenant[unitId];
    if (!tenantId) {
      setError("請先選擇住戶，再建立草稿入住。 ");
      return;
    }

    setError(null);
    setSuccess(null);

    const r = await apiFetch(`/occupancies`, {
      method: "POST",
      body: JSON.stringify({
        buildingId: id,
        unitId,
        tenantId,
        status: "DRAFT",
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("草稿入住已建立，下一步可直接建立租約。 ");
    load();
  };

  const createQuickLease = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData(e.currentTarget);
    const unitId = String(fd.get("unitId") || "");
    const tenantId = String(fd.get("tenantId") || "");

    if (!unitId || !tenantId) {
      setError("請選擇單位與住戶後再建立租約。");
      return;
    }

    const r = await apiFetch(`/leases`, {
      method: "POST",
      body: JSON.stringify({
        buildingId: id,
        tenantId,
        unitIds: [unitId],
        status: "ACTIVE",
        startDate: String(fd.get("startDate") || ""),
        endDate: String(fd.get("endDate") || ""),
        managementFee: fd.get("managementFee") ? Number(fd.get("managementFee")) : null,
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("租約已建立，入住狀態已自動同步。 ");
    (e.target as HTMLFormElement).reset();
    load();
  };

  const assignOwner = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData(e.currentTarget);
    const payload: any = {
      ownerId: String(fd.get("ownerId") || ""),
      sharePercent: Number(fd.get("sharePercent") || 0),
      notes: String(fd.get("notes") || "") || null,
    };

    if (fd.get("startDate")) payload.startDate = `${fd.get("startDate")}T00:00:00+08:00`;
    if (fd.get("endDate")) payload.endDate = `${fd.get("endDate")}T00:00:00+08:00`;

    const r = await apiFetch(`/floors/${floorId}/owners/assign`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("業主持分已更新。");
    (e.target as HTMLFormElement).reset();
    load();
  };

  const createRepair = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData(e.currentTarget);
    const r = await apiFetch(`/repairs`, {
      method: "POST",
      body: JSON.stringify({
        buildingId: id,
        scopeType: "FLOOR",
        floorId,
        item: String(fd.get("item") || ""),
        vendorName: String(fd.get("vendorName") || ""),
        vendorTaxId: String(fd.get("vendorTaxId") || "").trim() || null,
        quoteAmount: Number(fd.get("quoteAmount") || 0),
        finalAmount: String(fd.get("finalAmount") || "").trim()
          ? Number(fd.get("finalAmount"))
          : null,
        status: "DRAFT",
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("樓層修繕已建立。");
    (e.target as HTMLFormElement).reset();
    load();
  };

  const summary = useMemo(() => {
    let active = 0;
    let draft = 0;

    for (const u of units) {
      const status = occupancyByUnit.get(u.id);
      if (status === "ACTIVE") active += 1;
      else if (status === "DRAFT") draft += 1;
    }

    return {
      unitCount: units.length,
      active,
      draft,
      vacant: Math.max(units.length - active - draft, 0),
      ownerCount: floorOwners.length,
      repairCount: repairs.length,
    };
  }, [units, occupancyByUnit, floorOwners.length, repairs.length]);

  return (
    <main className="page">
      <PageHeader
        title={`樓層作業中心｜${floor?.label || ""}`}
        description="把這一層的單位、入住、租約與維運一次處理，減少跨頁往返。"
        action={
          <div className="row">
            <Link href={`/buildings/${id}/floors`} className="btn secondary">
              回樓層清單
            </Link>
            <Link href={`/buildings/${id}/leases`} className="btn">
              查看全部租約
            </Link>
          </div>
        }
      />

      <SummaryCards
        items={[
          { label: "單位總數", value: summary.unitCount, hint: "本層可管理單位" },
          { label: "啟用入住", value: summary.active, hint: "已有效租約" },
          { label: "草稿入住", value: summary.draft, hint: "待轉正式租約" },
          { label: "空置", value: summary.vacant, hint: "可優先招商" },
        ]}
      />

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <SectionBlock
        title="當下任務"
        description="先新增或切分單位，再指派住戶，最後立即建立租約。"
        className="taskCard"
      >
        <div className="row" style={{ gap: 8 }}>
          <a href="#add-unit" className="badge">1. 新增單位</a>
          <a href="#unit-workspace" className="badge">2. 指派住戶</a>
          <a href="#quick-lease" className="badge">3. 建立租約</a>
        </div>
      </SectionBlock>

      <SectionBlock title="快速建立租約" description="不用跳頁，直接在本層完成指派與租約。" className="card" >
        <form className="split" onSubmit={createQuickLease} id="quick-lease" aria-label="create-quick-lease-form" data-testid="quick-lease-form">
          <label>
            單位
            <select name="unitId" required data-testid="quick-lease-unit-select">
              <option value="">選擇單位</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.code}</option>
              ))}
            </select>
          </label>
          <label>
            住戶
            <select name="tenantId" required data-testid="quick-lease-tenant-select">
              <option value="">選擇住戶</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label>
            起租日
            <input name="startDate" type="date" required data-testid="quick-lease-start-date" />
          </label>
          <label>
            結束日
            <input name="endDate" type="date" required data-testid="quick-lease-end-date" />
          </label>
          <label>
            管理費（選填）
            <input
              name="managementFee"
              type="number"
              step="0.01"
              min={0}
              placeholder={building?.managementFee ? `留空將沿用大樓預設 ${building.managementFee}` : "每坪管理費"}
              data-testid="quick-lease-management-fee"
            />
            <small className="muted">{building?.managementFee ? `留空時會自動套用大樓預設管理費：${building.managementFee}` : "若留空，將沿用大樓預設值（若有）。"}</small>
          </label>
          <div className="row" style={{ alignItems: "end" }}>
            <button type="submit" data-testid="quick-lease-submit">直接建立啟用租約</button>
          </div>
        </form>
      </SectionBlock>

      <SectionBlock title="單位作業區" description="可新增、切分單位，並建立草稿入住。" className="card" >
        <form onSubmit={addUnit} className="row" aria-label="add-unit-form" id="add-unit" data-testid="add-unit-form">
          <input name="code" placeholder="單位編號（例如 A1）" required data-testid="add-unit-code" />
          <input name="grossArea" type="number" step="0.01" placeholder="總坪數" required data-testid="add-unit-gross" />
          <input name="netArea" type="number" step="0.01" placeholder="室內坪數" />
          <input name="balconyArea" type="number" step="0.01" placeholder="陽台坪數" />
          <button type="submit" data-testid="add-unit-submit">新增單位</button>
        </form>

        <div className="grid" style={{ border: "1px dashed #bfd1ea", borderRadius: 12, padding: 12 }}>
          <div>
            <b>批次切分（貼上多列）</b>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              格式：code,gross,net,balcony。最少兩列，例如 A1-1,50,40,5。
            </p>
          </div>
          <div className="split">
            <label>
              來源單位
              <select
                value={batchSplitUnitId}
                onChange={(e) => setBatchSplitUnitId(e.target.value)}
                data-testid="batch-split-unit-select"
              >
                <option value="">選擇來源單位</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.code}</option>
                ))}
              </select>
            </label>
            <label>
              <span>貼上多列資料</span>
              <textarea
                value={batchSplitText}
                onChange={(e) => setBatchSplitText(e.target.value)}
                placeholder={"A1-1,50,40,5\nA1-2,50,40,5"}
                data-testid="batch-split-textarea"
              />
            </label>
          </div>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="secondary" onClick={batchSplit} data-testid="batch-split-submit">
              送出批次切分
            </button>
          </div>
        </div>

        {units.length === 0 ? (
          <EmptyState
            title="這層還沒有單位"
            description="先建立第一個單位，後續就能指派住戶並建立租約。"
          />
        ) : (
          <div className="tableWrap" id="unit-workspace">
            <table className="table">
              <thead>
                <tr>
                  <th>單位</th>
                  <th>坪數</th>
                  <th>入住狀態</th>
                  <th>切分</th>
                  <th>住戶指派</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id}>
                    <td>{u.code}</td>
                    <td>總坪數 {u.grossArea}</td>
                    <td>
                      {occupancyByUnit.get(u.id) === "ACTIVE" ? (
                        <StatusChip tone="active">啟用</StatusChip>
                      ) : occupancyByUnit.get(u.id) === "DRAFT" ? (
                        <StatusChip tone="draft">草稿</StatusChip>
                      ) : (
                        <StatusChip tone="neutral">空置</StatusChip>
                      )}
                    </td>
                    <td>
                      <div className="grid" style={{ minWidth: 210 }}>
                        <input
                          aria-label={`split-code-1-${u.id}`}
                          value={splitDrafts[u.id]?.c1 || ""}
                          onChange={(e) =>
                            setSplitDrafts((prev) => ({
                              ...prev,
                              [u.id]: { ...prev[u.id], c1: e.target.value },
                            }))
                          }
                          placeholder="新單位 1"
                        />
                        <input
                          aria-label={`split-gross-1-${u.id}`}
                          value={splitDrafts[u.id]?.g1 || ""}
                          onChange={(e) =>
                            setSplitDrafts((prev) => ({
                              ...prev,
                              [u.id]: { ...prev[u.id], g1: e.target.value },
                            }))
                          }
                          placeholder="坪數 1"
                        />
                        <input
                          aria-label={`split-code-2-${u.id}`}
                          value={splitDrafts[u.id]?.c2 || ""}
                          onChange={(e) =>
                            setSplitDrafts((prev) => ({
                              ...prev,
                              [u.id]: { ...prev[u.id], c2: e.target.value },
                            }))
                          }
                          placeholder="新單位 2"
                        />
                        <input
                          aria-label={`split-gross-2-${u.id}`}
                          value={splitDrafts[u.id]?.g2 || ""}
                          onChange={(e) =>
                            setSplitDrafts((prev) => ({
                              ...prev,
                              [u.id]: { ...prev[u.id], g2: e.target.value },
                            }))
                          }
                          placeholder="坪數 2"
                        />
                        <button type="button" className="secondary" onClick={() => splitUnit(u.id)}>
                          Split
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="grid" style={{ minWidth: 180 }}>
                        <select
                          value={selectedTenant[u.id] || ""}
                          onChange={(e) =>
                            setSelectedTenant((prev) => ({ ...prev, [u.id]: e.target.value }))
                          }
                          data-testid={`floor-tenant-select-${u.id}`}
                        >
                          <option value="">選擇住戶</option>
                          {tenants.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => assignDraftOccupancy(u.id)}
                          data-testid={`floor-assign-draft-${u.id}`}
                        >
                          Assign DRAFT
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionBlock>

      <div className="split">
        <SectionBlock title="業主與持分" description="業主入口放在主要區塊，避免藏在深層流程。">
          <form onSubmit={assignOwner} className="split" aria-label="assign-owner-form">
            <label>
              業主
              <select name="ownerId" required>
                <option value="">選擇業主</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </label>
            <label>
              持分比例（%）
              <input name="sharePercent" type="number" step="0.01" placeholder="例如 50" required />
            </label>
            <label>
              生效日
              <input name="startDate" type="date" />
            </label>
            <label>
              失效日
              <input name="endDate" type="date" />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              備註
              <input name="notes" placeholder="補充說明" />
            </label>
            <button type="submit">更新持分</button>
          </form>

          {summary.ownerCount === 0 ? (
            <div className="muted">尚未設定任何持分。</div>
          ) : (
            floorOwners.map((fo) => (
              <div key={fo.id} className="row" style={{ justifyContent: "space-between" }}>
                <span>
                  <b>{fo.owner?.name || "未命名業主"}</b> / {fo.sharePercent}%
                </span>
                <button
                  type="button"
                  className="danger"
                  onClick={async () => {
                    await apiFetch(`/floor-owners/${fo.id}`, { method: "DELETE" });
                    load();
                  }}
                >
                  刪除
                </button>
              </div>
            ))
          )}
        </SectionBlock>

        <SectionBlock title="樓層修繕" description="修繕入口放在同頁，日常巡檢可快速新增。">
          <form onSubmit={createRepair} className="grid" aria-label="create-floor-repair-form" id="create-floor-repair-form" data-testid="create-floor-repair-form">
            <div className="split">
              <input name="item" placeholder="修繕項目（例如：消防檢查）" required />
              <input name="vendorName" placeholder="廠商名稱" required />
            </div>
            <div className="split">
              <input name="vendorTaxId" placeholder="廠商統編（選填）" />
              <input name="quoteAmount" type="number" step="0.01" placeholder="預估金額" required />
            </div>
            <input name="finalAmount" type="number" step="0.01" placeholder="結案金額（選填）" />
            <button type="submit">新增修繕</button>
          </form>

          {summary.repairCount === 0 ? (
            <div className="muted">目前尚無此樓層修繕紀錄。</div>
          ) : (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>項目</th>
                    <th>廠商</th>
                    <th>廠商統編</th>
                    <th>預估金額</th>
                    <th>結案金額</th>
                    <th>狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {repairs.map((r) => (
                    <tr key={r.id}>
                      <td>{r.item}</td>
                      <td>{r.vendorName}</td>
                      <td>{r.vendorTaxId || "-"}</td>
                      <td>{displayAmount(r.quoteAmount)}</td>
                      <td>{displayAmount(r.finalAmount)}</td>
                      <td><StatusChip tone="draft">{r.status}</StatusChip></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionBlock>
      </div>
    </main>
  );
}
