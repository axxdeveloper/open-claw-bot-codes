"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function normalizeName(value: string | null | undefined) {
  return String(value || "")
    .replace(/[\s\n\r]+/g, "")
    .replace(/臺/g, "台")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .toLowerCase();
}
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

export default function BuildingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [building, setBuilding] = useState<any>(null);
  const [floorDirectory, setFloorDirectory] = useState<Array<{ floorId: string; label: string; tenants: Array<{ id: string; name: string; unitCode: string; status: string; address: string; room: string; household: string }> }>>([]);
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

      const findSource113 = (tenantName: string, floorLabel: string, unitCode: string) => {
        const tKey = normalizeName(tenantName);
        const fKey = String(floorLabel || "").replace(/[\s\n\r]+/g, "").toUpperCase();
        const uKey = String(unitCode || "").replace(/[\s\n\r]+/g, "").toUpperCase();

        const exact = sourceRows.find((r) => {
          const merchantKey = normalizeName(r?.merchant);
          const floorKey = String(r?.floor || "").replace(/[\s\n\r]+/g, "").toUpperCase();
          const houseKey = String(r?.household || "").replace(/[\s\n\r]+/g, "").toUpperCase();
          const nameOk = merchantKey.includes(tKey) || tKey.includes(merchantKey);
          const floorOk = !floorKey || floorKey.includes(fKey) || fKey.includes(floorKey);
          const unitOk = !houseKey || houseKey.includes(uKey) || uKey.includes(houseKey);
          return nameOk && floorOk && unitOk;
        });

        if (exact) return exact;

        return sourceRows.find((r) => {
          const merchantKey = normalizeName(r?.merchant);
          return merchantKey.includes(tKey) || tKey.includes(merchantKey);
        });
      };

      const directory = floorDetails
        .map((d, idx) => {
          if (!d.ok) return null;
          const floor = floors[idx];
          const units = d.data.units || [];
          const unitCodeById = new Map<string, string>();
          units.forEach((u: any) => unitCodeById.set(u.id, u.code));

          const tenants = occupancies
            .filter(
              (o: any) =>
                units.some((u: any) => u.id === o.unitId) &&
                (o.status === "ACTIVE" || o.status === "DRAFT"),
            )
            .map((o: any) => {
              const tenant = tenantById.get(o.tenantId);
              if (!tenant) return null;
              const unitCode = unitCodeById.get(o.unitId) || "未標示單位";
              const src = findSource113(tenant.name, floor.label, unitCode) || {};
              return {
                id: tenant.id,
                name: tenant.name,
                unitCode,
                status: String(o.status || ""),
                address: String(src.address || ""),
                room: String(src.room || ""),
                household: String(src.household || unitCode || ""),
              };
            })
            .filter(Boolean) as Array<{ id: string; name: string; unitCode: string; status: string; address: string; room: string; household: string }>;

          return {
            floorId: floor.id,
            label: floor.label,
            tenants,
          };
        })
        .filter(Boolean) as Array<{ floorId: string; label: string; tenants: Array<{ id: string; name: string; unitCode: string; status: string; address: string; room: string; household: string }> }>;

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
                        {row.tenants.length ? (
                          <div className="grid" style={{ gap: 6 }}>
                            {[...row.tenants]
                              .sort((a, b) => a.unitCode.localeCompare(b.unitCode, "zh-Hant", { numeric: true }))
                              .map((tenant) => (
                              <Link
                                key={`${tenant.id}-${tenant.unitCode}`}
                                href={`/buildings/${id}/tenants/${tenant.id}`}
                                className="badge"
                                title={`查看 ${tenant.name} 的聯絡人與合約`}
                              >
                                門牌：{tenant.address || "待補"}｜室號：{tenant.room || "-"}｜戶號：{tenant.household || tenant.unitCode || "-"}｜住戶：{tenant.name}
                                {tenant.status === "DRAFT" ? "（草稿）" : ""}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <span className="badge">尚無用戶</span>
                        )}
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
