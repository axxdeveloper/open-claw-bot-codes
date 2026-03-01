"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, StatusChip, SummaryCards } from "@/components/TaskLayout";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      const [buildingRes, floorsRes, tenantsRes, leasesRes, repairsRes] = await Promise.all([
        apiFetch<any>(`/buildings/${id}`),
        apiFetch<any[]>(`/buildings/${id}/floors`),
        apiFetch<any[]>(`/buildings/${id}/tenants`),
        apiFetch<any[]>(`/buildings/${id}/leases`),
        apiFetch<any[]>(`/buildings/${id}/repairs?status=IN_PROGRESS`),
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

      <div className="split">
        <SectionBlock title="空間管理" description="先把空間資料建完整，後續流程會更順。">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span>樓層與單位配置</span>
            <Link href={`/buildings/${id}/floors`} className="btn secondary">前往</Link>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span>堆疊圖（空置/入住）</span>
            <Link href={`/buildings/${id}/stacking`} className="btn secondary">前往</Link>
          </div>
        </SectionBlock>

        <SectionBlock title="客戶與合約" description="住戶資料與租約狀態請維持一致。">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span>住戶管理</span>
            <Link href={`/buildings/${id}/tenants`} className="btn secondary">前往</Link>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span>租約管理</span>
            <div className="row">
              {stats.activeLeases > 0 ? <StatusChip tone="active">{stats.activeLeases} 筆啟用</StatusChip> : null}
              <Link href={`/buildings/${id}/leases`} className="btn secondary">前往</Link>
            </div>
          </div>
        </SectionBlock>
      </div>

      <SectionBlock title="維運管理" description="業主、公共區域與修繕請在同一區域管理，避免資訊分散。">
        <div className="row" style={{ gap: 8 }}>
          <Link href={`/buildings/${id}/owners`} className="badge">業主與持分</Link>
          <Link href={`/buildings/${id}/common-areas`} className="badge">公共區域</Link>
          <Link href={`/buildings/${id}/repairs`} className="badge">修繕管理</Link>
        </div>
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
