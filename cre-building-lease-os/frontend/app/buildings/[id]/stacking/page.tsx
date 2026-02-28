"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, StatusChip, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

type Row = {
  floorId: string;
  floorLabel: string;
  units: Array<{ id: string; code: string; tenantName: string | null; occupancyStatus: string | null }>;
};

export default function StackingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"all" | "vacant" | "active" | "draft">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      const [floorsRes, tenantsRes, occRes] = await Promise.all([
        apiFetch<any[]>(`/buildings/${id}/floors`),
        apiFetch<any[]>(`/buildings/${id}/tenants`),
        apiFetch<any[]>(`/buildings/${id}/occupancies`),
      ]);

      if (!floorsRes.ok) {
        setError(apiErrorMessage(floorsRes.error));
        return;
      }

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
            occupancyStatus: occ?.status || null,
            tenantName: occ?.tenantId ? tenantsById.get(occ.tenantId) || null : null,
          };
        });

        list.push({ floorId: f.id, floorLabel: f.label, units });
      }

      setRows(list);
    })();
  }, [id]);

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
        description="從高樓層到低樓層查看各單位狀態，快速掌握招商與續約重點。"
        action={<Link href={`/buildings/${id}/leases`} className="btn">前往租約管理</Link>}
      />

      <SummaryCards
        items={[
          { label: "樓層數", value: summary.floorCount, hint: "納入堆疊圖範圍" },
          { label: "單位總數", value: summary.total, hint: "含空置與入住" },
          { label: "啟用入住", value: summary.active, hint: "有有效租約" },
          { label: "空置單位", value: summary.vacant, hint: "可優先招商" },
        ]}
      />

      <SectionBlock
        title="視圖篩選"
        description="聚焦你現在要處理的狀態。"
        action={
          <div className="row">
            <button type="button" className={filter === "all" ? "" : "secondary"} onClick={() => setFilter("all")}>全部</button>
            <button type="button" className={filter === "vacant" ? "" : "secondary"} onClick={() => setFilter("vacant")}>僅空置</button>
            <button type="button" className={filter === "draft" ? "" : "secondary"} onClick={() => setFilter("draft")}>僅草稿</button>
            <button type="button" className={filter === "active" ? "" : "secondary"} onClick={() => setFilter("active")}>僅啟用</button>
          </div>
        }
      >
        {error ? <div className="errorBox">{error}</div> : null}

        {filteredRows.length === 0 ? (
          <EmptyState
            title="目前沒有可顯示資料"
            description="可先到樓層頁新增單位，或切換篩選條件。"
            action={<Link href={`/buildings/${id}/floors`} className="btn">前往樓層配置</Link>}
          />
        ) : (
          filteredRows.map((row) => (
            <div key={row.floorId} className="card" style={{ boxShadow: "none" }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>{row.floorLabel}</h3>
                <Link href={`/buildings/${id}/floors/${row.floorId}`} className="badge">
                  前往樓層作業
                </Link>
              </div>
              {row.units.map((u) => (
                <div className="row" key={u.id} style={{ justifyContent: "space-between" }}>
                  <span>
                    <b>{u.code}</b> {u.tenantName ? `— ${u.tenantName}` : "— 空置"}
                  </span>
                  {u.occupancyStatus === "ACTIVE" ? (
                    <StatusChip tone="active">啟用</StatusChip>
                  ) : u.occupancyStatus === "DRAFT" ? (
                    <StatusChip tone="draft">草稿</StatusChip>
                  ) : (
                    <StatusChip tone="neutral">空置</StatusChip>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </SectionBlock>
    </main>
  );
}
