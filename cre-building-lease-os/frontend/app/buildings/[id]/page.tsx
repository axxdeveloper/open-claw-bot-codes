"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState, PageHeader, SectionBlock } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function BuildingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [building, setBuilding] = useState<any>(null);
  const [floorDirectory, setFloorDirectory] = useState<Array<{ floorId: string; label: string; unitCount: number; tenantNames: string[] }>>([]);
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

      const tenantNameById = new Map<string, string>();
      (tenantsRes.ok ? tenantsRes.data : []).forEach((t: any) => tenantNameById.set(t.id, t.name));
      const occupancies = occupanciesRes.ok ? occupanciesRes.data : [];

      const directory = floorDetails
        .map((d, idx) => {
          if (!d.ok) return null;
          const floor = floors[idx];
          const units = d.data.units || [];
          const tenantNames = Array.from(
            new Set(
              occupancies
                .filter((o: any) => units.some((u: any) => u.id === o.unitId) && o.status === "ACTIVE")
                .map((o: any) => tenantNameById.get(o.tenantId) || "")
                .filter(Boolean),
            ),
          );

          return {
            floorId: floor.id,
            label: floor.label,
            unitCount: units.length,
            tenantNames,
          };
        })
        .filter(Boolean) as Array<{ floorId: string; label: string; unitCount: number; tenantNames: string[] }>;

      setFloorDirectory(directory);
      setAmenities((commonAreasRes.ok ? commonAreasRes.data : []).map((x: any) => ({ id: x.id, name: x.name, floorId: x.floorId })));

    })();
  }, [id]);

  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title={building?.name || "大樓作業中心"}
        description={building?.address || "尚未填寫地址，建議補齊，方便櫃台與維運查詢。"}
        action={<Link href={`/buildings/${id}/floors`} className="btn">繼續空間配置</Link>}
      />

      {error ? <div className="errorBox">{error}</div> : null}

      <SectionBlock title="樓層與公司總覽" description="直接看每層有哪些公司與單位，不用先切頁。">
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
                  <th>查看</th>
                </tr>
              </thead>
              <tbody>
                {floorDirectory
                  .sort((a, b) => a.label.localeCompare(b.label, "zh-Hant", { numeric: true }))
                  .map((row) => (
                    <tr key={row.floorId}>
                      <td>{row.label}</td>
                      <td>{row.unitCount}</td>
                      <td>{row.tenantNames.length ? row.tenantNames.join("、") : "尚未指派住戶"}</td>
                      <td>
                        <div className="row" style={{ gap: 6 }}>
                          <Link href={`/buildings/${id}/floors/${row.floorId}`} className="badge">樓層管理</Link>
                          <Link href={`/buildings/${id}/common-areas?floorId=${row.floorId}`} className="badge">設施管理</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionBlock>

      <SectionBlock title="大樓設施（公共區域）" description="直接看有哪些設施，點進去可看修繕歷史；廠商管理請走獨立頁面。">
        <div className="row" style={{ marginBottom: 8 }}>
          <Link href={`/buildings/${id}/vendors`} className="badge">廠商管理</Link>
          <Link href={`/buildings/${id}/repairs`} className="badge">修繕需求單</Link>
        </div>
        {amenities.length === 0 ? (
          <EmptyState
            title="尚未建立公共區域"
            description="可先建立大廳、電梯、停車場、機房等設施。"
            action={<Link href={`/buildings/${id}/common-areas`} className="btn">前往公共區域</Link>}
          />
        ) : (
          <div className="row" style={{ gap: 8 }}>
            {amenities.map((a) => (
              <Link key={a.id} href={`/buildings/${id}/common-areas/${a.id}`} className="badge">
                {a.name}{a.floorId ? `（樓層綁定）` : ""}
              </Link>
            ))}
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
