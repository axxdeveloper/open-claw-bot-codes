"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, StatusChip } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

type Building = { id: string; name: string; address?: string };

type BuildingStats = {
  totalFloors: number;
  configuredFloors: number;
  activeLeases: number;
  expiringSoon: number;
  openRepairs: number;
};

type DashboardScope = "all" | "unconfigured" | "expiring" | "repairs";

const SCOPE_LABELS: Record<DashboardScope, string> = {
  all: "全部大樓",
  unconfigured: "待配置",
  expiring: "租約到期風險",
  repairs: "修繕進行中",
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

function parseScope(raw: string | null): DashboardScope {
  if (raw === "unconfigured" || raw === "expiring" || raw === "repairs") return raw;
  return "all";
}

function BuildingsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<Building[]>([]);
  const [statsById, setStatsById] = useState<Record<string, BuildingStats>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [scope, setScope] = useState<DashboardScope>("all");

  const applyQuery = (patch: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });

    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  };

  useEffect(() => {
    setScope(parseScope(searchParams.get("scope")));
    setKeyword(searchParams.get("search") || "");
  }, [searchParams]);

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

  const primaryBuildingId = items[0]?.id || null;
  const expiringCount = useMemo(
    () => Object.values(statsById).reduce((acc, x) => acc + (x.expiringSoon || 0), 0),
    [statsById],
  );
  const inProgressRepairs = useMemo(
    () => Object.values(statsById).reduce((acc, x) => acc + (x.openRepairs || 0), 0),
    [statsById],
  );

  const filtered = useMemo(() => {
    let list = items;

    if (scope === "unconfigured") {
      list = list.filter((x) => {
        const s = statsById[x.id];
        return !!s && (s.totalFloors === 0 || s.configuredFloors < s.totalFloors);
      });
    }

    if (scope === "expiring") {
      list = list.filter((x) => (statsById[x.id]?.expiringSoon || 0) > 0);
    }

    if (scope === "repairs") {
      list = list.filter((x) => (statsById[x.id]?.openRepairs || 0) > 0);
    }

    const term = keyword.trim().toLowerCase();
    if (term) {
      list = list.filter((x) => `${x.name} ${x.address || ""}`.toLowerCase().includes(term));
    }

    return list;
  }, [items, keyword, scope, statsById]);

  return (
    <main className="page">
      <PageHeader
        title="大樓總覽"
        description="直接查看各大樓的樓層、公司與維運狀態。"
        action={
          <div className="row" style={{ gap: 8 }}>
            {primaryBuildingId ? (
              <Link
                href={`/buildings/${primaryBuildingId}/leases?filter=expiring`}
                className="secondary"
                title={expiringCount > 0 ? `有 ${expiringCount} 筆 90 天內到期租約` : "目前無 90 天內到期租約"}
                aria-label="到期租約通知"
                style={{ minWidth: 44, textAlign: "center" }}
              >
                🔔{expiringCount > 0 ? ` ${expiringCount}` : ""}
              </Link>
            ) : null}
            {primaryBuildingId ? (
              <Link
                href={`/buildings/${primaryBuildingId}/repairs?status=IN_PROGRESS`}
                className="secondary"
                title={inProgressRepairs > 0 ? `有 ${inProgressRepairs} 筆修繕進行中` : "目前無進行中修繕"}
                aria-label="修繕案件"
                style={{ minWidth: 44, textAlign: "center" }}
              >
                🛠️{inProgressRepairs > 0 ? ` ${inProgressRepairs}` : ""}
              </Link>
            ) : null}
          </div>
        }
      />

      <SectionBlock
        title="大樓清單與下一步"
        description="每棟大樓都提供空間、合約、維運三條主路徑，直接進入當下任務。"
        action={
          <div className="row">
            {(Object.keys(SCOPE_LABELS) as DashboardScope[]).map((key) => (
              <button
                key={key}
                type="button"
                data-testid={`filter-chip-scope-${key}`}
                className={scope === key ? "" : "secondary"}
                onClick={() => applyQuery({ scope: key === "all" ? null : key })}
              >
                {SCOPE_LABELS[key]}
              </button>
            ))}
            <input
              value={keyword}
              onChange={(e) => applyQuery({ search: e.target.value.trim() || null })}
              placeholder="搜尋大樓或地址"
              aria-label="搜尋大樓"
              style={{ width: 240 }}
            />
          </div>
        }
      >
        {error ? <div className="errorBox">{error}</div> : null}
        {loading ? (
          <div className="muted">載入大樓資料中...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="目前沒有符合條件的大樓"
            description="可切換篩選條件，或建立第一棟大樓開始配置。"
            action={
              <>
                <Link href="/buildings" className="btn secondary" data-testid="drilldown-link-reset-dashboard-filter">清除篩選</Link>
                <Link href="/buildings/new" className="btn">建立第一棟大樓</Link>
              </>
            }
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
                          <Link href={`/buildings/${b.id}`} style={{ fontWeight: 700 }} data-testid={`drilldown-link-building-${b.id}`}>
                            {b.name}
                          </Link>
                          <span className="muted">{b.address || "尚未填寫地址"}</span>
                        </div>
                      </td>
                      <td>
                        <Link
                          href={`/buildings/${b.id}/floors?filter=${setupDone ? "all" : "unconfigured"}`}
                          data-testid={`drilldown-link-building-setup-${b.id}`}
                        >
                          <StatusChip tone={setupDone ? "active" : "draft"}>
                            {stats.configuredFloors}/{stats.totalFloors} 樓層已配置
                          </StatusChip>
                        </Link>
                      </td>
                      <td>
                        <Link
                          href={`/buildings/${b.id}/leases?filter=${stats.expiringSoon > 0 ? "expiring" : "active"}`}
                          data-testid={`drilldown-link-building-lease-risk-${b.id}`}
                        >
                          {stats.expiringSoon > 0 ? (
                            <StatusChip tone="risk">{stats.expiringSoon} 筆即將到期</StatusChip>
                          ) : (
                            <StatusChip tone="active">目前無到期風險</StatusChip>
                          )}
                        </Link>
                      </td>
                      <td>
                        <Link
                          href={`/buildings/${b.id}/repairs?status=${stats.openRepairs > 0 ? "IN_PROGRESS" : "COMPLETED"}`}
                          data-testid={`drilldown-link-building-repair-${b.id}`}
                        >
                          {stats.openRepairs > 0 ? (
                            <StatusChip tone="draft">{stats.openRepairs} 筆進行中</StatusChip>
                          ) : (
                            <StatusChip tone="neutral">修繕狀態平穩</StatusChip>
                          )}
                        </Link>
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

export default function BuildingsPage() {
  return (
    <Suspense fallback={<main className="page"><div className="muted">載入 Dashboard...</div></main>}>
      <BuildingsPageContent />
    </Suspense>
  );
}
