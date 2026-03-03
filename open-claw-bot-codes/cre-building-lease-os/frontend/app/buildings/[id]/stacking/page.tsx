"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, StatusChip, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

type Row = {
  floorId: string;
  floorLabel: string;
  units: Array<{
    id: string;
    code: string;
    tenantId: string | null;
    tenantName: string | null;
    occupancyStatus: string | null;
  }>;
};

type StackingFilter = "all" | "vacant" | "active" | "draft";

function parseFilter(raw: string | null): StackingFilter {
  if (raw === "vacant" || raw === "active" || raw === "draft") return raw;
  return "all";
}

export default function StackingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const id = params.id;

  const [rows, setRows] = useState<Row[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantByUnit, setSelectedTenantByUnit] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<StackingFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    setFilter(parseFilter(searchParams.get("filter")));
  }, [searchParams]);

  const load = async () => {
    if (!id) return;

    const [floorsRes, tenantsRes, occRes] = await Promise.all([
      apiFetch<any[]>(`/buildings/${id}/floors`),
      apiFetch<any[]>(`/buildings/${id}/tenants`),
      apiFetch<any[]>(`/buildings/${id}/occupancies`),
    ]);

    if (!floorsRes.ok) {
      setError(apiErrorMessage(floorsRes.error));
      return;
    }

    if (tenantsRes.ok) setTenants(tenantsRes.data);

    const tenantsById = new Map<string, string>();
    if (tenantsRes.ok) {
      for (const t of tenantsRes.data) tenantsById.set(t.id, t.name);
    }

    const occByUnit = new Map<string, any>();
    if (occRes.ok) {
      for (const o of occRes.data) {
        const prev = occByUnit.get(o.unitId);
        if (!prev || prev.status !== "ACTIVE") {
          occByUnit.set(o.unitId, o);
        }
      }
    }

    const list: Row[] = [];
    for (const f of floorsRes.data.slice().reverse()) {
      const detail = await apiFetch<any>(`/floors/${f.id}`);
      if (!detail.ok) continue;

      const units = (detail.data.units || []).map((u: any) => {
        const occ = occByUnit.get(u.id);
        return {
          id: u.id,
          code: u.code,
          tenantId: occ?.tenantId || null,
          occupancyStatus: occ?.status || null,
          tenantName: occ?.tenantId ? tenantsById.get(occ.tenantId) || null : null,
        };
      });

      list.push({ floorId: f.id, floorLabel: f.label, units });
    }

    setRows(list);
  };

  useEffect(() => {
    load();
  }, [id]);

  const assignDraft = async (unitId: string) => {
    const tenantId = selectedTenantByUnit[unitId];
    if (!tenantId) {
      setError("請先選擇住戶，再建立草稿入住。");
      return;
    }

    setError(null);
    setSuccess(null);

    const result = await apiFetch(`/occupancies`, {
      method: "POST",
      body: JSON.stringify({
        buildingId: id,
        unitId,
        tenantId,
        status: "DRAFT",
      }),
    });

    if (!result.ok) {
      setError(apiErrorMessage(result.error));
      return;
    }

    setSuccess("已建立草稿入住。下一步可直接建立租約。 ");
    await load();
  };

  const summary = useMemo(() => {
    let total = 0;
    let active = 0;
    let draft = 0;

    for (const r of rows) {
      for (const u of r.units) {
        total += 1;
        if (u.occupancyStatus === "ACTIVE") active += 1;
        else if (u.occupancyStatus === "DRAFT") draft += 1;
      }
    }

    return {
      floorCount: rows.length,
      total,
      active,
      draft,
      vacant: Math.max(total - active - draft, 0),
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (filter === "all") return rows;

    return rows
      .map((row) => ({
        ...row,
        units: row.units.filter((u) => {
          if (filter === "vacant") return !u.occupancyStatus;
          if (filter === "active") return u.occupancyStatus === "ACTIVE";
          return u.occupancyStatus === "DRAFT";
        }),
      }))
      .filter((x) => x.units.length > 0);
  }, [rows, filter]);

  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title="堆疊圖｜空置與入住總覽"
        description="從高樓層到低樓層查看各單位狀態；可直接在此頁 2 步驟指派住戶。"
        action={<Link href={`/buildings/${id}/leases`} className="btn">前往租約管理</Link>}
      />

      <SummaryCards
        items={[
          {
            label: "樓層數",
            value: summary.floorCount,
            hint: "納入堆疊圖範圍",
            href: `/buildings/${id}/floors`,
            testId: "drilldown-link-stacking-floor-count",
          },
          {
            label: "單位總數",
            value: summary.total,
            hint: "含空置與入住",
            href: `/buildings/${id}/stacking?filter=all`,
            testId: "drilldown-link-stacking-total-units",
          },
          {
            label: "啟用入住",
            value: summary.active,
            hint: "有有效租約",
            href: `/buildings/${id}/stacking?filter=active`,
            testId: "drilldown-link-stacking-active",
          },
          {
            label: "空置單位",
            value: summary.vacant,
            hint: "可優先招商",
            href: `/buildings/${id}/stacking?filter=vacant`,
            testId: "drilldown-link-stacking-vacant",
          },
        ]}
      />

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <SectionBlock
        title="視圖篩選"
        description="聚焦你現在要處理的狀態。"
        action={
          <div className="row">
            <button type="button" className={filter === "all" ? "" : "secondary"} onClick={() => applyQuery({ filter: null })} data-testid="filter-chip-stacking-all">全部</button>
            <button type="button" className={filter === "vacant" ? "" : "secondary"} onClick={() => applyQuery({ filter: "vacant" })} data-testid="filter-chip-stacking-vacant">僅空置</button>
            <button type="button" className={filter === "draft" ? "" : "secondary"} onClick={() => applyQuery({ filter: "draft" })} data-testid="filter-chip-stacking-draft">僅草稿</button>
            <button type="button" className={filter === "active" ? "" : "secondary"} onClick={() => applyQuery({ filter: "active" })} data-testid="filter-chip-stacking-active">僅啟用</button>
          </div>
        }
      >
        {filteredRows.length === 0 ? (
          <EmptyState
            title="目前沒有可顯示資料"
            description="可先到樓層頁新增單位，或切換篩選條件。"
            action={
              <>
                <Link href={`/buildings/${id}/stacking`} className="btn secondary" data-testid="drilldown-link-stacking-reset-filter">清除篩選</Link>
                <Link href={`/buildings/${id}/floors`} className="btn">前往樓層配置</Link>
              </>
            }
          />
        ) : (
          filteredRows.map((row) => (
            <div key={row.floorId} className="card" style={{ boxShadow: "none" }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>
                  <Link href={`/buildings/${id}/floors/${row.floorId}`} data-testid={`drilldown-link-stacking-floor-${row.floorId}`}>
                    {row.floorLabel}
                  </Link>
                </h3>
                <div className="row">
                  <Link href={`/buildings/${id}/floors/${row.floorId}`} className="badge">
                    前往樓層作業
                  </Link>
                  <Link href={`/buildings/${id}/floors/${row.floorId}#create-floor-repair-form`} className="badge">
                    新增修繕
                  </Link>
                </div>
              </div>
              {row.units.map((u) => (
                <div className="row" key={u.id} style={{ justifyContent: "space-between", alignItems: "center" }} data-testid="stacking-unit-row">
                  <span>
                    <Link href={`/buildings/${id}/leases?unitId=${u.id}`} data-testid={`drilldown-link-unit-${u.id}`}>
                      <b>{u.code}</b>
                    </Link>{" "}
                    {u.tenantName ? (
                      <>
                        — <Link href={`/buildings/${id}/tenants?search=${encodeURIComponent(u.tenantName)}`} data-testid={`drilldown-link-tenant-${u.id}`}>{u.tenantName}</Link>
                      </>
                    ) : (
                      "— 空置"
                    )}
                  </span>

                  <div className="row" style={{ gap: 8 }}>
                    {u.occupancyStatus === "ACTIVE" ? (
                      <Link href={`/buildings/${id}/stacking?filter=active`} data-testid={`drilldown-link-stacking-status-active-${u.id}`}>
                        <StatusChip tone="active">啟用</StatusChip>
                      </Link>
                    ) : u.occupancyStatus === "DRAFT" ? (
                      <Link href={`/buildings/${id}/stacking?filter=draft`} data-testid={`drilldown-link-stacking-status-draft-${u.id}`}>
                        <StatusChip tone="draft">草稿</StatusChip>
                      </Link>
                    ) : (
                      <Link href={`/buildings/${id}/stacking?filter=vacant`} data-testid={`drilldown-link-stacking-status-vacant-${u.id}`}>
                        <StatusChip tone="neutral">空置</StatusChip>
                      </Link>
                    )}

                    {u.occupancyStatus !== "ACTIVE" ? (
                      <>
                        <select
                          value={selectedTenantByUnit[u.id] || ""}
                          onChange={(e) =>
                            setSelectedTenantByUnit((prev) => ({ ...prev, [u.id]: e.target.value }))
                          }
                          data-testid={`stacking-tenant-select-${u.id}`}
                          style={{ minWidth: 180 }}
                        >
                          <option value="">選住戶</option>
                          {tenants.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="secondary"
                          data-testid={`stacking-assign-btn-${u.id}`}
                          onClick={() => assignDraft(u.id)}
                        >
                          指派 DRAFT
                        </button>
                        <Link
                          href={`/buildings/${id}/leases?unitId=${u.id}&tenantId=${selectedTenantByUnit[u.id] || ""}`}
                          className="badge"
                          data-testid={`stacking-quick-lease-${u.id}`}
                        >
                          建租約
                        </Link>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </SectionBlock>
    </main>
  );
}
