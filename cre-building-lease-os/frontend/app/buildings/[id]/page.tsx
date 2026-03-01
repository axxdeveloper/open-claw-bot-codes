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

export default function BuildingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [building, setBuilding] = useState<any>(null);
  const [floorDirectory, setFloorDirectory] = useState<Array<{ floorId: string; label: string; unitCount: number; tenants: Array<{ id: string; name: string; unitCode: string }> }>>([]);
  const [amenities, setAmenities] = useState<Array<{ id: string; name: string; floorId?: string | null }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      const [buildingRes, floorsRes, tenantsRes, occupanciesRes, commonAreasRes] = await Promise.all([
        apiFetch<any>(`/buildings/${id}`),
        apiFetch<any[]>(`/buildings/${id}/floors`),
        apiFetch<any[]>(`/buildings/${id}/tenants`),
        apiFetch<any[]>(`/buildings/${id}/occupancies`),
        apiFetch<any[]>(`/buildings/${id}/common-areas`),
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

      const directory = floorDetails
        .map((d, idx) => {
          if (!d.ok) return null;
          const floor = floors[idx];
          const units = d.data.units || [];
          const unitCodeById = new Map<string, string>();
          units.forEach((u: any) => unitCodeById.set(u.id, u.code));

          const tenants = occupancies
            .filter((o: any) => units.some((u: any) => u.id === o.unitId) && o.status === "ACTIVE")
            .map((o: any) => {
              const tenant = tenantById.get(o.tenantId);
              if (!tenant) return null;
              return {
                id: tenant.id,
                name: tenant.name,
                unitCode: unitCodeById.get(o.unitId) || "-",
              };
            })
            .filter(Boolean) as Array<{ id: string; name: string; unitCode: string }>;

          return {
            floorId: floor.id,
            label: floor.label,
            unitCount: units.length,
            tenants,
          };
        })
        .filter(Boolean) as Array<{ floorId: string; label: string; unitCount: number; tenants: Array<{ id: string; name: string; unitCode: string }> }>;

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
                  <th>單位數</th>
                  <th>公司/住戶</th>
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
                      <td>{row.unitCount}</td>
                      <td>
                        {row.tenants.length ? (
                          <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                            {[...row.tenants]
                              .sort((a, b) => a.unitCode.localeCompare(b.unitCode, "zh-Hant", { numeric: true }))
                              .map((tenant) => (
                              <Link
                                key={tenant.id}
                                href={`/buildings/${id}/tenants/${tenant.id}`}
                                className="badge"
                                title={`查看 ${tenant.name} 的聯絡人與合約`}
                              >
                                {tenant.unitCode}｜{tenant.name}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <Link
                            href={`/buildings/${id}/floors/${row.floorId}#unit-workspace`}
                            className="badge"
                            title="前往本層指派用戶"
                          >
                            指派用戶
                          </Link>
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
