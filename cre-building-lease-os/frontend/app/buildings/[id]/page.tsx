"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function BuildingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [building, setBuilding] = useState<any>(null);
  const [stats, setStats] = useState({
    floorCount: 0,
    unitCount: 0,
    tenantCount: 0,
    activeLeases: 0,
    repairOpen: 0,
  });
  const [floorDirectory, setFloorDirectory] = useState<Array<{ floorId: string; label: string; unitCount: number; tenantNames: string[] }>>([]);
  const [amenities, setAmenities] = useState<Array<{ id: string; name: string; floorId?: string | null }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      const [buildingRes, floorsRes, tenantsRes, leasesRes, repairsRes, occupanciesRes, commonAreasRes] = await Promise.all([
        apiFetch<any>(`/buildings/${id}`),
        apiFetch<any[]>(`/buildings/${id}/floors`),
        apiFetch<any[]>(`/buildings/${id}/tenants`),
        apiFetch<any[]>(`/buildings/${id}/leases`),
        apiFetch<any[]>(`/buildings/${id}/repairs?status=IN_PROGRESS`),
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
      const unitCount = floorDetails
        .filter((x) => x.ok)
        .reduce((acc, x) => acc + (x.data.units || []).length, 0);

      const leases = leasesRes.ok ? leasesRes.data : [];

      setStats({
        floorCount: floors.length,
        unitCount,
        tenantCount: tenantsRes.ok ? tenantsRes.data.length : 0,
        activeLeases: leases.filter((x) => x?.lease?.status === "ACTIVE").length,
        repairOpen: repairsRes.ok ? repairsRes.data.length : 0,
      });

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

  const nextAction = useMemo(() => {
    if (stats.floorCount === 0) return "先建立樓層架構";
    if (stats.unitCount === 0) return "先新增單位，才能繼續租戶與租約流程";
    if (stats.tenantCount === 0) return "新增第一位住戶，開始租約流程";
    return "目前核心資料已齊備，可追蹤租約與修繕";
  }, [stats.floorCount, stats.unitCount, stats.tenantCount]);

  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title={building?.name || "大樓作業中心"}
        description={building?.address || "尚未填寫地址，建議補齊，方便櫃台與維運查詢。"}
        action={<Link href={`/buildings/${id}/floors`} className="btn">繼續空間配置</Link>}
      />

      <SummaryCards
        items={[
          {
            label: "樓層數",
            value: stats.floorCount,
            hint: "地下/地上合計（點擊看樓層細節）",
            href: `/buildings/${id}/floors`,
            testId: "drilldown-link-building-floors",
          },
          {
            label: "單位數",
            value: stats.unitCount,
            hint: "可租賃/可管理空間（點擊看樓層單位）",
            href: `/buildings/${id}/floors?filter=configured`,
            testId: "drilldown-link-building-units",
          },
          {
            label: "住戶數",
            value: stats.tenantCount,
            hint: "點擊看住戶細節與聯絡方式",
            href: `/buildings/${id}/tenants`,
            testId: "drilldown-link-building-tenants",
          },
          {
            label: "進行中修繕",
            value: stats.repairOpen,
            hint: "需持續追蹤（點擊看修繕明細）",
            href: `/buildings/${id}/repairs?status=IN_PROGRESS`,
            testId: "drilldown-link-building-repairs",
          },
        ]}
      />

      {error ? <div className="errorBox">{error}</div> : null}

      <SectionBlock title="下一步" description={nextAction} className="taskCard">
        <div className="row" style={{ gap: 8 }}>
          <Link href={`/buildings/${id}/floors`} className="badge">
            樓層與單位
          </Link>
          <Link href={`/buildings/${id}/tenants`} className="badge">
            住戶名單
          </Link>
          <Link href={`/buildings/${id}/leases`} className="badge">
            租約管理
          </Link>
          <Link href={`/buildings/${id}/repairs`} className="badge">
            修繕管理
          </Link>
        </div>
      </SectionBlock>

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
                  .filter((r) => r.unitCount > 0 || r.tenantNames.length > 0)
                  .sort((a, b) => a.label.localeCompare(b.label, "zh-Hant", { numeric: true }))
                  .map((row) => (
                    <tr key={row.floorId}>
                      <td>{row.label}</td>
                      <td>{row.unitCount}</td>
                      <td>{row.tenantNames.length ? row.tenantNames.join("、") : "尚未指派住戶"}</td>
                      <td>
                        <Link href={`/buildings/${id}/floors/${row.floorId}`} className="badge">樓層細節</Link>
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
