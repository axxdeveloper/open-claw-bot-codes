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

export default function BuildingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [building, setBuilding] = useState<any>(null);
  const [floorDirectory, setFloorDirectory] = useState<Array<{ floorId: string; label: string; entries: Array<{ key: string; address: string; room: string; household: string; unitCode: string; tenantId: string | null; tenantName: string | null; status: string | null }> }>>([]);
  const [amenities, setAmenities] = useState<Array<{ id: string; name: string; floorId?: string | null }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      const [buildingRes, floorsRes, tenantsRes, occupanciesRes, commonAreasRes, sourceRes] = await Promise.all([
        apiFetch<any>(`/buildings/${id}`),
        apiFetch<any[]>(`/buildings/${id}/floors`),
        apiFetch<any[]>(`/buildings/${id}/tenants`),
        apiFetch<any[]>(`/buildings/${id}/occupancies`),
        apiFetch<any[]>(`/buildings/${id}/common-areas`),
        fetch('/source113.json').then((r) => r.json()).catch(() => ({ rows: [] })),
      ]);

      if (!buildingRes.ok) {
        setError(apiErrorMessage(buildingRes.error));
        return;
      }

      setBuilding(buildingRes.data);

      const floors = floorsRes.ok ? floorsRes.data : [];
      const floorDetails = await Promise.all(floors.map((f) => apiFetch<any>(`/floors/${f.id}`)));

      const tenantById = new Map<string, { id: string; name: string }>();
      (tenantsRes.ok ? tenantsRes.data : []).forEach((t: any) => tenantById.set(t.id, { id: t.id, name: t.name }));
      const occupancies = occupanciesRes.ok ? occupanciesRes.data : [];
      const sourceRows: any[] = Array.isArray(sourceRes?.rows) ? sourceRes.rows : [];

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

        const floorSourceRows = sourceRows.filter((r) => {
          const tokens = floorTokens(r?.floor);
          return tokens.includes(canonicalFloor(floor.label));
        });

        const entries = floorSourceRows.map((r: any, idx: number) => {
          const house = String(r.household || "").trim();
          const matched = floorUnitOccupancies.find((x) => {
            const hu = String(x.unitCode || "").trim().toUpperCase();
            const hs = house.toUpperCase();
            if (!hu || !hs) return false;
            return hu === hs || hu.includes(hs) || hs.includes(hu);
          });
          return {
            key: `src-${r.row || idx}`,
            address: String(r.address || ""),
            room: String(r.room || ""),
            household: house,
            unitCode: house,
            tenantId: matched?.tenantId || null,
            tenantName: matched?.tenantName || null,
            status: matched?.status || null,
          };
        });

        const usedCodes = new Set(entries.map((x) => String(x.unitCode || "").toUpperCase()));
        floorUnitOccupancies.forEach((x, idx) => {
          const code = String(x.unitCode || "").toUpperCase();
          if (!code || usedCodes.has(code)) return;
          entries.push({
            key: `occ-${x.tenantId}-${idx}`,
            address: "",
            room: "",
            household: x.unitCode || "",
            unitCode: x.unitCode || "",
            tenantId: x.tenantId,
            tenantName: x.tenantName,
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
      setAmenities((commonAreasRes.ok ? commonAreasRes.data : []).map((x: any) => ({ id: x.id, name: x.name, floorId: x.floorId })));

    })();
  }, [id]);

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
                  <th>住戶明細（門牌 / 室號 / 戶號）</th>
                  <th>公共設施</th>
                  <th>查看</th>
                </tr>
              </thead>
              <tbody>
                {[...floorDirectory]
                  .sort((a, b) => {
                    const diff = floorOrder(a.label) - floorOrder(b.label);
                    if (diff !== 0) return diff;
                    return a.label.localeCompare(b.label, "zh-Hant", { numeric: true });
                  })
                  .map((row) => (
                    <tr key={row.floorId}>
                      <td>{row.label}</td>
                      <td>
                        <div className="tableWrap" style={{ maxWidth: 760 }}>
                          <table className="table" style={{ margin: 0 }}>
                            <thead>
                              <tr>
                                <th style={{ width: 120 }}>門牌</th>
                                <th style={{ width: 120 }}>室號</th>
                                <th style={{ width: 120 }}>戶號</th>
                                <th>住戶</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...row.entries]
                                .sort((a, b) =>
                                  String(a.household || a.unitCode || "").localeCompare(
                                    String(b.household || b.unitCode || ""),
                                    "zh-Hant",
                                    { numeric: true },
                                  ),
                                )
                                .map((entry) => {
                                  const hasTenant = Boolean(entry.tenantId && entry.tenantName);
                                  const rowStyle = hasTenant
                                    ? undefined
                                    : ({ background: "#f8fafc", color: "#64748b" } as const);

                                  return (
                                    <tr key={entry.key} style={rowStyle}>
                                      <td>{entry.address || "待補"}</td>
                                      <td>{entry.room || "-"}</td>
                                      <td>{entry.household || entry.unitCode || "-"}</td>
                                      <td>
                                        {hasTenant ? (
                                          <Link
                                            href={`/buildings/${id}/tenants/${entry.tenantId}`}
                                            title={`查看 ${entry.tenantName} 的聯絡人與合約`}
                                            style={{ color: "#0f2f59", fontWeight: 700 }}
                                          >
                                            {entry.tenantName}
                                            {entry.status === "DRAFT" ? "（草稿）" : ""}
                                          </Link>
                                        ) : (
                                          <span>尚無住戶</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                      <td>
                        {(amenitiesByFloor[row.floorId] || []).length === 0 ? (
                          <span className="muted">本層尚無公共設施</span>
                        ) : (
                          <div className="row" style={{ gap: 6 }}>
                            {(amenitiesByFloor[row.floorId] || []).map((a) => (
                              <Link key={a.id} href={`/buildings/${id}/common-areas/${a.id}`} className="badge">
                                {a.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="row" style={{ gap: 6 }}>
                          <Link href={`/buildings/${id}/floors/${row.floorId}`} className="badge">樓層管理</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
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
