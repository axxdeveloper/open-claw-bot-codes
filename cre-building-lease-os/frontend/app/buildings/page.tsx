"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, StatusChip, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

type Building = { id: string; name: string; address?: string };

type BuildingStats = {
  totalFloors: number;
  configuredFloors: number;
  activeLeases: number;
  expiringSoon: number;
  openRepairs: number;
};

function countExpiringSoon(leases: any[]) {
  const now = new Date();
  const day90 = new Date(now);
  day90.setDate(day90.getDate() + 90);

  return leases.filter((x) => {
    if (!x?.lease?.endDate) return false;
    const end = new Date(x.lease.endDate);
    return x.lease.status === "ACTIVE" && end >= now && end <= day90;
  }).length;
}

export default function BuildingsPage() {
  const [items, setItems] = useState<Building[]>([]);
  const [statsById, setStatsById] = useState<Record<string, BuildingStats>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await apiFetch<Building[]>("/buildings");
      if (!r.ok) {
        setError(apiErrorMessage(r.error));
        setLoading(false);
        return;
      }

      setItems(r.data);
      setLoading(false);

      const statsEntries = await Promise.all(
        r.data.map(async (building) => {
          const [floorsRes, leasesRes, repairsRes] = await Promise.all([
            apiFetch<any[]>(`/buildings/${building.id}/floors`),
            apiFetch<any[]>(`/buildings/${building.id}/leases`),
            apiFetch<any[]>(`/buildings/${building.id}/repairs?status=IN_PROGRESS`),
          ]);

          const floors = floorsRes.ok ? floorsRes.data : [];

          const detailRows = await Promise.all(
            floors.map((f) => apiFetch<any>(`/floors/${f.id}`)),
          );

          const configuredFloors = detailRows.filter((d) => d.ok && (d.data.units || []).length > 0).length;
          const leases = leasesRes.ok ? leasesRes.data : [];
          const activeLeases = leases.filter((x) => x?.lease?.status === "ACTIVE").length;

          const stat: BuildingStats = {
            totalFloors: floors.length,
            configuredFloors,
            activeLeases,
            expiringSoon: countExpiringSoon(leases),
            openRepairs: repairsRes.ok ? repairsRes.data.length : 0,
          };

          return [building.id, stat] as const;
        }),
      );

      setStatsById(Object.fromEntries(statsEntries));
    })();
  }, []);

  const totals = useMemo(() => {
    const stats = Object.values(statsById);
    const pendingSetup = stats.filter((x) => x.totalFloors > 0 && x.configuredFloors < x.totalFloors).length;
    const expiringSoon = stats.reduce((acc, x) => acc + x.expiringSoon, 0);
    const openRepairs = stats.reduce((acc, x) => acc + x.openRepairs, 0);

    return {
      buildings: items.length,
      pendingSetup,
      expiringSoon,
      openRepairs,
    };
  }, [items.length, statsById]);

  const filtered = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    if (!term) return items;
    return items.filter((x) => `${x.name} ${x.address || ""}`.toLowerCase().includes(term));
  }, [items, keyword]);

  return (
    <main className="page">
      <PageHeader
        title="Dashboard｜今日營運重點"
        description="從這裡開始今天的工作：先看待辦與風險，再直接進入大樓做配置、租約與維運。"
        action={<Link href="/buildings/new" className="btn">建立新大樓</Link>}
      />

      <SectionBlock
        title="今日建議任務"
        description="先做會影響營運風險的項目，降低漏處理。"
        className="taskCard"
      >
        <div className="stack">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span>1) 先補齊尚未配置完成的大樓（樓層、單位）</span>
            <StatusChip tone="info">優先</StatusChip>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span>2) 檢查 90 天內到期租約，預先安排續約</span>
            <StatusChip tone="risk">風險</StatusChip>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span>3) 追蹤進行中的修繕，避免影響租戶使用</span>
            <StatusChip tone="draft">待追蹤</StatusChip>
          </div>
        </div>
      </SectionBlock>

      <SummaryCards
        items={[
          { label: "大樓數", value: totals.buildings, hint: "管理中的案場" },
          { label: "待完成配置", value: totals.pendingSetup, hint: "樓層或單位尚未完整" },
          { label: "90天內到期租約", value: totals.expiringSoon, hint: "建議提早安排續約" },
          { label: "進行中修繕", value: totals.openRepairs, hint: "需追蹤工程進度" },
        ]}
      />

      <SectionBlock
        title="大樓清單與下一步"
        description="每棟大樓都提供空間、合約、維運三條主路徑，直接進入當下任務。"
        action={
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜尋大樓或地址"
            aria-label="搜尋大樓"
            style={{ width: 240 }}
          />
        }
      >
        {error ? <div className="errorBox">{error}</div> : null}
        {loading ? (
          <div className="muted">載入大樓資料中...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="目前還沒有可顯示的大樓"
            description="先建立第一棟大樓，系統會引導你完成樓層與單位配置。"
            action={<Link href="/buildings/new" className="btn">建立第一棟大樓</Link>}
          />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>大樓</th>
                  <th>空間配置進度</th>
                  <th>租約風險</th>
                  <th>維運狀態</th>
                  <th>快速入口</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const stats = statsById[b.id] || {
                    totalFloors: 0,
                    configuredFloors: 0,
                    activeLeases: 0,
                    expiringSoon: 0,
                    openRepairs: 0,
                  };

                  const setupDone = stats.totalFloors > 0 && stats.configuredFloors === stats.totalFloors;

                  return (
                    <tr key={b.id}>
                      <td>
                        <div className="stack">
                          <Link href={`/buildings/${b.id}`} style={{ fontWeight: 700 }}>
                            {b.name}
                          </Link>
                          <span className="muted">{b.address || "尚未填寫地址"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="row">
                          <StatusChip tone={setupDone ? "active" : "draft"}>
                            {stats.configuredFloors}/{stats.totalFloors} 樓層已配置
                          </StatusChip>
                        </div>
                      </td>
                      <td>
                        {stats.expiringSoon > 0 ? (
                          <StatusChip tone="risk">{stats.expiringSoon} 筆即將到期</StatusChip>
                        ) : (
                          <StatusChip tone="active">目前無到期風險</StatusChip>
                        )}
                      </td>
                      <td>
                        {stats.openRepairs > 0 ? (
                          <StatusChip tone="draft">{stats.openRepairs} 筆進行中</StatusChip>
                        ) : (
                          <StatusChip tone="neutral">修繕狀態平穩</StatusChip>
                        )}
                      </td>
                      <td>
                        <div className="row" style={{ gap: 6 }}>
                          <Link className="badge" href={`/buildings/${b.id}/floors`}>
                            空間管理
                          </Link>
                          <Link className="badge" href={`/buildings/${b.id}/leases`}>
                            合約
                          </Link>
                          <Link className="badge" href={`/buildings/${b.id}/repairs`}>
                            維運
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionBlock>
    </main>
  );
}
