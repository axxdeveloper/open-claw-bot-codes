"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState, PageHeader, SectionBlock } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

function floorOrder(label: string) {
  const normalized = String(label || "").trim().toUpperCase();

  const basement = normalized.match(/^B\s*(\d+)(?:F)?$/);
  if (basement) return -Number(basement[1]);

  const above = normalized.match(/^(\d+)(?:F)?$/);
  if (above) return Number(above[1]);

  if (normalized === "RF") return 1000;

  return Number.MAX_SAFE_INTEGER;
}

function canonicalFloor(value: string | null | undefined) {
  return String(value || "").replace(/[\s\n\r]+/g, "").toUpperCase().replace(/F$/, "");
}

function floorTokens(rawFloor: string | null | undefined) {
  const raw = String(rawFloor || "").replace(/[\s\n\r]+/g, "").toUpperCase();
  const tokens = Array.from(raw.matchAll(/B?\d+/g)).map((m) => m[0]);
  return tokens.map((t) => canonicalFloor(t));
}

function normalizeName(value: string | null | undefined) {
  return String(value || "")
    .replace(/[\s\n\r]+/g, "")
    .replace(/臺/g, "台")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .toLowerCase();
}

function cleanCell(value: string | null | undefined, headerWord: string) {
  const v = String(value || "").trim();
  if (!v) return "";
  if (v === headerWord) return "";
  return v;
}

export default function BuildingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [building, setBuilding] = useState<any>(null);
  const [floorDirectory, setFloorDirectory] = useState<Array<{ floorId: string; label: string; entries: Array<{ key: string; address: string; room: string; household: string; unitCode: string; tenantId: string | null; tenantName: string | null; status: string | null }> }>>([]);
  const [entryDrafts, setEntryDrafts] = useState<Record<string, { address: string; room: string; household: string; tenantName: string }>>({});
  const [editingEntries, setEditingEntries] = useState<Record<string, boolean>>({});
  const [amenities, setAmenities] = useState<Array<{ id: string; name: string; floorId?: string | null }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      const [buildingRes, floorsRes, tenantsRes, occupanciesRes, commonAreasRes, sourceRes, overrideRes] = await Promise.all([
        apiFetch<any>(`/buildings/${id}`),
        apiFetch<any[]>(`/buildings/${id}/floors`),
        apiFetch<any[]>(`/buildings/${id}/tenants`),
        apiFetch<any[]>(`/buildings/${id}/occupancies`),
        apiFetch<any[]>(`/buildings/${id}/common-areas`),
        fetch('/source113.json').then((r) => r.json()).catch(() => ({ rows: [] })),
        fetch(`/api/source113-overrides/${id}`).then((r) => r.json()).catch(() => ({ ok: false, data: [] })),
      ]);

      if (!buildingRes.ok) {
        setError(apiErrorMessage(buildingRes.error));
        return;
      }

      setBuilding(buildingRes.data);

      const floors = floorsRes.ok ? floorsRes.data : [];
      const floorDetails = await Promise.all(floors.map((f) => apiFetch<any>(`/floors/${f.id}`)));

      const tenantById = new Map<string, { id: string; name: string }>();
      const tenantIdByNormalizedName = new Map<string, string>();
      (tenantsRes.ok ? tenantsRes.data : []).forEach((t: any) => {
        tenantById.set(t.id, { id: t.id, name: t.name });
        tenantIdByNormalizedName.set(normalizeName(t.name), t.id);
      });
      const occupancies = occupanciesRes.ok ? occupanciesRes.data : [];
      const sourceRows: any[] = Array.isArray(sourceRes?.rows) ? sourceRes.rows : [];
      const overrides: any[] = overrideRes?.ok && Array.isArray(overrideRes.data) ? overrideRes.data : [];
      const overrideMap = new Map<string, any>();
      overrides.forEach((o) => overrideMap.set(String(o.entryKey || ""), o));
      const fallbackAddresses = Array.from(
        new Set(String(buildingRes.data?.address || "").match(/\d+號/g) || []),
      );

      const floorUnitsByFloorId = new Map<string, any[]>();
      floorDetails.forEach((d, idx) => {
        const floor = floors[idx];
        floorUnitsByFloorId.set(floor.id, d.ok ? d.data.units || [] : []);
      });

      const directory = floors.map((floor: any) => {
        const units = floorUnitsByFloorId.get(floor.id) || [];
        const unitCodeById = new Map<string, string>();
        units.forEach((u: any) => unitCodeById.set(u.id, u.code));

        const floorUnitOccupancies = occupancies
          .filter(
            (o: any) =>
              units.some((u: any) => u.id === o.unitId) &&
              (o.status === "ACTIVE" || o.status === "DRAFT"),
          )
          .map((o: any) => {
            const tenant = tenantById.get(o.tenantId);
            if (!tenant) return null;
            const unitCode = unitCodeById.get(o.unitId) || "";
            return {
              tenantId: tenant.id,
              tenantName: tenant.name,
              unitCode,
              status: String(o.status || ""),
            };
          })
          .filter(Boolean) as Array<{ tenantId: string; tenantName: string; unitCode: string; status: string }>;

        let floorSourceRows = sourceRows.filter((r) => {
          const tokens = floorTokens(r?.floor);
          return tokens.includes(canonicalFloor(floor.label));
        });

        if (floorSourceRows.length === 0 && fallbackAddresses.length > 0) {
          floorSourceRows = fallbackAddresses.map((addr, i) => ({
            row: `fallback-${floor.label}-${i}`,
            address: addr,
            room: "",
            household: "",
            merchant: "",
          }));
        }

        const entries = floorSourceRows.map((r: any, idx: number) => {
          const house = String(r.household || "").trim();
          const matched = floorUnitOccupancies.find((x) => {
            const hu = String(x.unitCode || "").trim().toUpperCase();
            const hs = house.toUpperCase();
            if (!hu || !hs) return false;
            return hu === hs || hu.includes(hs) || hs.includes(hu);
          });
          const sourceTenantName = String(r.merchant || "").trim();
          const sourceTenantId = tenantIdByNormalizedName.get(normalizeName(sourceTenantName)) || null;
          const key = `src-${r.row || idx}`;
          const ov = overrideMap.get(key) || {};
          return {
            key,
            address: cleanCell(ov.address ?? r.address, "地址"),
            room: cleanCell(ov.room ?? r.room, "室號"),
            household: cleanCell(ov.household ?? house, "戶號"),
            unitCode: cleanCell(ov.household ?? house, "戶號"),
            tenantId: matched?.tenantId || sourceTenantId,
            tenantName: String((ov.tenantName ?? matched?.tenantName ?? sourceTenantName) || "") || null,
            status: matched?.status || null,
          };
        });

        const usedCodes = new Set(entries.map((x) => String(x.unitCode || "").toUpperCase()));
        floorUnitOccupancies.forEach((x, idx) => {
          const code = String(x.unitCode || "").toUpperCase();
          if (!code || usedCodes.has(code)) return;
          const key = `occ-${x.tenantId}-${idx}`;
          const ov = overrideMap.get(key) || {};
          entries.push({
            key,
            address: cleanCell(ov.address, "地址"),
            room: cleanCell(ov.room, "室號"),
            household: cleanCell(ov.household ?? x.unitCode, "戶號"),
            unitCode: cleanCell(ov.household ?? x.unitCode, "戶號"),
            tenantId: x.tenantId,
            tenantName: String((ov.tenantName ?? x.tenantName) || "") || null,
            status: x.status,
          });
        });

        if (entries.length === 0) {
          entries.push({
            key: `empty-${floor.id}`,
            address: "",
            room: "",
            household: "",
            unitCode: "",
            tenantId: null,
            tenantName: null,
            status: null,
          });
        }

        return {
          floorId: floor.id,
          label: floor.label,
          entries,
        };
      });

      setFloorDirectory(directory);
      const drafts: Record<string, { address: string; room: string; household: string; tenantName: string }> = {};
      directory.forEach((row: any) => {
        (row.entries || []).forEach((e: any) => {
          drafts[e.key] = {
            address: e.address || "",
            room: e.room || "",
            household: e.household || e.unitCode || "",
            tenantName: e.tenantName || "",
          };
        });
      });
      setEntryDrafts(drafts);
      setAmenities((commonAreasRes.ok ? commonAreasRes.data : []).map((x: any) => ({ id: x.id, name: x.name, floorId: x.floorId })));

    })();
  }, [id]);

  const beginInlineEdit = (entry: any) => {
    setEntryDrafts((prev) => ({
      ...prev,
      [entry.key]: {
        address: prev[entry.key]?.address ?? entry.address ?? "",
        room: prev[entry.key]?.room ?? entry.room ?? "",
        household: prev[entry.key]?.household ?? entry.household ?? entry.unitCode ?? "",
        tenantName: prev[entry.key]?.tenantName ?? entry.tenantName ?? "",
      },
    }));
    setEditingEntries((prev) => ({ ...prev, [entry.key]: true }));
  };

  const cancelInlineEdit = (entry: any) => {
    setEntryDrafts((prev) => ({
      ...prev,
      [entry.key]: {
        address: entry.address ?? "",
        room: entry.room ?? "",
        household: entry.household ?? entry.unitCode ?? "",
        tenantName: entry.tenantName ?? "",
      },
    }));
    setEditingEntries((prev) => ({ ...prev, [entry.key]: false }));
  };

  const saveInline = async (entry: any) => {
    const draft = entryDrafts[entry.key];
    if (!draft) return;

    setError(null);
    setSuccess(null);

    const payload = {
      entryKey: entry.key,
      address: draft.address,
      room: draft.room,
      household: draft.household,
      tenantName: draft.tenantName,
    };

    const res = await fetch(`/api/source113-overrides/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: { message: "儲存失敗" } }));

    if (!res?.ok) {
      setError(res?.error?.message || "儲存失敗");
      return;
    }

    if (entry.tenantId && draft.tenantName && draft.tenantName !== entry.tenantName) {
      const t = await apiFetch(`/tenants/${entry.tenantId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: draft.tenantName }),
      });
      if (!t.ok) {
        setError(apiErrorMessage(t.error));
        return;
      }
    }

    setSuccess("已儲存行內修改");

    setFloorDirectory((prev) =>
      prev.map((row) => ({
        ...row,
        entries: row.entries.map((e) =>
          e.key === entry.key
            ? {
                ...e,
                address: draft.address,
                room: draft.room,
                household: draft.household,
                unitCode: draft.household,
                tenantName: draft.tenantName || e.tenantName,
              }
            : e,
        ),
      })),
    );
    setEditingEntries((prev) => ({ ...prev, [entry.key]: false }));
  };

  const amenitiesByFloor = amenities.reduce<Record<string, Array<{ id: string; name: string }>>>((acc, item) => {
    if (!item.floorId) return acc;
    if (!acc[item.floorId]) acc[item.floorId] = [];
    acc[item.floorId].push({ id: item.id, name: item.name });
    return acc;
  }, {});

  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title={building?.name || "大樓作業中心"}
        description={building?.address || "尚未填寫地址，建議補齊，方便櫃台與維運查詢。"}
      />

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <SectionBlock
        title="樓層與公司總覽"
        description="直接看每層有哪些公司與單位，不用先切頁。"
        action={<Link href={`/buildings/${id}/common-areas`} className="btn secondary">設施管理</Link>}
      >
        {floorDirectory.length === 0 ? (
          <EmptyState
            title="目前沒有樓層明細資料"
            description="請先到樓層頁建立單位，或匯入住戶資料。"
            action={<Link href={`/buildings/${id}/floors`} className="btn">前往樓層配置</Link>}
          />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>樓層</th>
                  <th>門牌</th>
                  <th>室號</th>
                  <th>戶號</th>
                  <th>住戶</th>
                  <th>公共設施</th>
                  <th>查看</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {[...floorDirectory]
                  .sort((a, b) => {
                    const diff = floorOrder(a.label) - floorOrder(b.label);
                    if (diff !== 0) return diff;
                    return a.label.localeCompare(b.label, "zh-Hant", { numeric: true });
                  })
                  .flatMap((row) => {
                    const rowEntries = [...row.entries].sort((a, b) =>
                      String(a.household || a.unitCode || "").localeCompare(
                        String(b.household || b.unitCode || ""),
                        "zh-Hant",
                        { numeric: true },
                      ),
                    );

                    return rowEntries.map((entry, idx) => {
                      const currentTenantName = entryDrafts[entry.key]?.tenantName ?? entry.tenantName ?? "";
                      const hasTenantName = Boolean(currentTenantName);
                      const canClickTenant = Boolean(entry.tenantId && entry.tenantName);
                      const rowStyle = hasTenantName
                        ? undefined
                        : ({ background: "#f8fafc", color: "#64748b" } as const);

                      const isEditing = Boolean(editingEntries[entry.key]);
                      const amenities = amenitiesByFloor[row.floorId] || [];

                      return (
                        <tr key={entry.key} style={rowStyle}>
                          {idx === 0 ? <td rowSpan={rowEntries.length}>{row.label}</td> : null}

                          <td>
                            {isEditing ? (
                              <input
                                value={entryDrafts[entry.key]?.address ?? ""}
                                placeholder="待補"
                                onChange={(e) =>
                                  setEntryDrafts((prev) => ({
                                    ...prev,
                                    [entry.key]: {
                                      ...(prev[entry.key] || { address: "", room: "", household: "", tenantName: "" }),
                                      address: e.target.value,
                                    },
                                  }))
                                }
                              />
                            ) : (
                              entry.address || "待補"
                            )}
                          </td>

                          <td>
                            {isEditing ? (
                              <input
                                value={entryDrafts[entry.key]?.room ?? ""}
                                placeholder="-"
                                onChange={(e) =>
                                  setEntryDrafts((prev) => ({
                                    ...prev,
                                    [entry.key]: {
                                      ...(prev[entry.key] || { address: "", room: "", household: "", tenantName: "" }),
                                      room: e.target.value,
                                    },
                                  }))
                                }
                              />
                            ) : (
                              entry.room || "-"
                            )}
                          </td>

                          <td>
                            {isEditing ? (
                              <input
                                value={entryDrafts[entry.key]?.household ?? ""}
                                placeholder="-"
                                onChange={(e) =>
                                  setEntryDrafts((prev) => ({
                                    ...prev,
                                    [entry.key]: {
                                      ...(prev[entry.key] || { address: "", room: "", household: "", tenantName: "" }),
                                      household: e.target.value,
                                    },
                                  }))
                                }
                              />
                            ) : (
                              entry.household || entry.unitCode || "-"
                            )}
                          </td>

                          <td>
                            {isEditing ? (
                              <input
                                value={entryDrafts[entry.key]?.tenantName ?? ""}
                                placeholder="尚無住戶"
                                onChange={(e) =>
                                  setEntryDrafts((prev) => ({
                                    ...prev,
                                    [entry.key]: {
                                      ...(prev[entry.key] || { address: "", room: "", household: "", tenantName: "" }),
                                      tenantName: e.target.value,
                                    },
                                  }))
                                }
                              />
                            ) : canClickTenant ? (
                              <Link
                                href={`/buildings/${id}/tenants/${entry.tenantId}`}
                                title={`查看 ${entry.tenantName} 的聯絡人與合約`}
                                style={{ color: "#0f2f59", fontWeight: 700 }}
                              >
                                {entry.tenantName}
                              </Link>
                            ) : hasTenantName ? (
                              <span style={{ color: "#0f2f59", fontWeight: 700 }}>{currentTenantName}</span>
                            ) : (
                              <span>尚無住戶</span>
                            )}
                          </td>

                          {idx === 0 ? (
                            <td rowSpan={rowEntries.length}>
                              {amenities.length === 0 ? (
                                <span className="muted">本層尚無公共設施</span>
                              ) : (
                                <div className="row" style={{ gap: 6 }}>
                                  {amenities.map((a) => (
                                    <Link key={a.id} href={`/buildings/${id}/common-areas/${a.id}`} className="badge">
                                      {a.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </td>
                          ) : null}

                          {idx === 0 ? (
                            <td rowSpan={rowEntries.length}>
                              <Link href={`/buildings/${id}/floors/${row.floorId}`} className="badge">樓層管理</Link>
                            </td>
                          ) : null}

                          <td style={{ whiteSpace: "nowrap" }}>
                            {isEditing ? (
                              <div className="row" style={{ gap: 6 }}>
                                <button type="button" className="secondary" onClick={() => saveInline(entry)}>儲存</button>
                                <button type="button" className="secondary" onClick={() => cancelInlineEdit(entry)}>取消</button>
                              </div>
                            ) : (
                              <button type="button" className="secondary" onClick={() => beginInlineEdit(entry)}>編輯</button>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })}
              </tbody>
            </table>
          </div>
        )}
      </SectionBlock>


      {!building ? (
        <EmptyState
          title="正在整理大樓資料"
          description="如果等待超過幾秒，可重新整理頁面。"
        />
      ) : null}
    </main>
  );
}
