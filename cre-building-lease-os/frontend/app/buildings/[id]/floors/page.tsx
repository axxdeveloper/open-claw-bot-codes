"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, StatusChip, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

type FloorFilter = "all" | "basement" | "above" | "unconfigured" | "configured";

type FloorRow = {
  id: string;
  label: string;
  region: "地下" | "地上";
  unitCount: number;
  activeCount: number;
  draftCount: number;
  vacantCount: number;
  ownerCount: number;
  repairCount: number;
  configured: boolean;
};

const FILTER_LABELS: Record<FloorFilter, string> = {
  all: "全部",
  basement: "地下",
  above: "地上",
  unconfigured: "僅未配置",
  configured: "僅已配置",
};

function parseRegion(label: string): "地下" | "地上" {
  return label.startsWith("B") ? "地下" : "地上";
}

function pickStatusWeight(status: string | null | undefined) {
  if (status === "ACTIVE") return 2;
  if (status === "DRAFT") return 1;
  return 0;
}

function parseFilter(raw: string | null): FloorFilter {
  if (raw === "basement" || raw === "above" || raw === "unconfigured" || raw === "configured") return raw;
  return "all";
}

export default function FloorsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const id = params.id;

  const [rows, setRows] = useState<FloorRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState<FloorFilter>("all");
  const [keyword, setKeyword] = useState("");

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
    setKeyword(searchParams.get("search") || "");
  }, [searchParams]);

  const load = async (buildingId: string) => {
    setLoading(true);

    const floorsRes = await apiFetch<any[]>(`/buildings/${buildingId}/floors`);
    if (!floorsRes.ok) {
      setError(apiErrorMessage(floorsRes.error));
      setLoading(false);
      return;
    }

    const baseRows: FloorRow[] = floorsRes.data.map((f) => ({
      id: f.id,
      label: f.label,
      region: parseRegion(String(f.label || "")),
      unitCount: 0,
      activeCount: 0,
      draftCount: 0,
      vacantCount: 0,
      ownerCount: 0,
      repairCount: 0,
      configured: false,
    }));
    setRows(baseRows);
    setLoading(false);

    setDetailLoading(true);

    const occupanciesRes = await apiFetch<any[]>(`/buildings/${buildingId}/occupancies`);
    const occupancyByUnit = new Map<string, string>();

    if (occupanciesRes.ok) {
      for (const occ of occupanciesRes.data) {
        if (!occ?.unitId) continue;
        const prev = occupancyByUnit.get(occ.unitId);
        const status = String(occ.status || "");
        if (!prev || pickStatusWeight(status) > pickStatusWeight(prev)) {
          occupancyByUnit.set(occ.unitId, status);
        }
      }
    }

    const [details, floorOwnersRows, repairRows] = await Promise.all([
      Promise.all(baseRows.map((f) => apiFetch<any>(`/floors/${f.id}`))),
      Promise.all(baseRows.map((f) => apiFetch<any[]>(`/floors/${f.id}/owners`))),
      Promise.all(baseRows.map((f) => apiFetch<any[]>(`/buildings/${buildingId}/repairs?floorId=${f.id}`))),
    ]);

    const merged = baseRows.map((row, idx) => {
      const detail = details[idx];
      const units = detail.ok ? detail.data.units || [] : [];

      let activeCount = 0;
      let draftCount = 0;
      for (const u of units) {
        const status = occupancyByUnit.get(u.id);
        if (status === "ACTIVE") activeCount += 1;
        else if (status === "DRAFT") draftCount += 1;
      }

      const unitCount = units.length;
      const vacantCount = Math.max(unitCount - activeCount - draftCount, 0);
      const ownerCount = floorOwnersRows[idx]?.ok ? floorOwnersRows[idx].data.length : 0;
      const repairCount = repairRows[idx]?.ok ? repairRows[idx].data.length : 0;

      return {
        ...row,
        unitCount,
        activeCount,
        draftCount,
        vacantCount,
        ownerCount,
        repairCount,
        configured: unitCount > 0,
      };
    });

    setRows(merged);
    setDetailLoading(false);
  };

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  const regenerate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData(e.currentTarget);
    const r = await apiFetch(`/buildings/${id}/floors/generate`, {
      method: "POST",
      body: JSON.stringify({
        basementFloors: Number(fd.get("basementFloors") || 5),
        aboveGroundFloors: Number(fd.get("aboveGroundFloors") || 20),
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("樓層設定已更新。下一步：優先進入未配置樓層新增單位。");
    await load(id);
  };

  const summary = useMemo(() => {
    const basement = rows.filter((x) => x.region === "地下").length;
    const above = rows.filter((x) => x.region === "地上").length;
    const configured = rows.filter((x) => x.configured).length;

    return {
      basement,
      above,
      total: rows.length,
      configured,
      draftOccupancies: rows.reduce((acc, x) => acc + x.draftCount, 0),
      ownerAssignments: rows.reduce((acc, x) => acc + x.ownerCount, 0),
      repairs: rows.reduce((acc, x) => acc + x.repairCount, 0),
    };
  }, [rows]);

  const firstFloorWithRepair = rows.find((x) => x.repairCount > 0);

  const filteredRows = useMemo(() => {
    let list = rows;

    if (filter === "basement") list = list.filter((x) => x.region === "地下");
    if (filter === "above") list = list.filter((x) => x.region === "地上");
    if (filter === "unconfigured") list = list.filter((x) => !x.configured);
    if (filter === "configured") list = list.filter((x) => x.configured);

    const term = keyword.trim().toUpperCase();
    if (term) list = list.filter((x) => x.label.toUpperCase().includes(term));

    return list;
  }, [rows, filter, keyword]);

  const firstUnconfigured = rows.find((x) => !x.configured);

  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title="樓層與單位配置"
        description="先確認樓層架構，再逐層建立單位與入住狀態。這會影響後續租約與維運效率。"
        action={
          firstUnconfigured ? (
            <Link href={`/buildings/${id}/floors/${firstUnconfigured.id}#add-unit`} className="btn">
              前往 {firstUnconfigured.label} 配置單位
            </Link>
          ) : (
            <Link href={`/buildings/${id}/stacking`} className="btn">
              查看整棟入住概況
            </Link>
          )
        }
      />

      <SummaryCards
        items={[
          {
            label: "地下層數",
            value: summary.basement,
            hint: "B1、B2...",
            href: `/buildings/${id}/floors?filter=basement#floor-list`,
            testId: "drilldown-link-floor-summary-basement",
          },
          {
            label: "地上層數",
            value: summary.above,
            hint: "1F、2F...",
            href: `/buildings/${id}/floors?filter=above#floor-list`,
            testId: "drilldown-link-floor-summary-above",
          },
          {
            label: "總樓層",
            value: summary.total,
            hint: "本棟目前樓層",
            href: `/buildings/${id}/floors?filter=all#floor-list`,
            testId: "drilldown-link-floor-summary-total",
          },
          {
            label: "已配置樓層",
            value: summary.configured,
            hint: "已建立單位",
            href: `/buildings/${id}/floors?filter=configured#floor-list`,
            testId: "drilldown-link-floor-summary-configured",
          },
          {
            label: "草稿入住",
            value: summary.draftOccupancies,
            hint: "待轉正式租約",
            href: `/buildings/${id}/stacking?filter=draft#stacking-list`,
            testId: "drilldown-link-floor-summary-draft-occupancies",
          },
          {
            label: "持分 / 修繕",
            value: (
              <span>
                <Link href={`/buildings/${id}/owners`} data-testid="drilldown-link-floor-summary-owners">{summary.ownerAssignments}</Link>
                {" / "}
                <Link
                  href={firstFloorWithRepair ? `/buildings/${id}/repairs?floorId=${firstFloorWithRepair.id}` : `/buildings/${id}/repairs`}
                  data-testid="drilldown-link-floor-summary-repairs"
                >
                  {summary.repairs}
                </Link>
              </span>
            ),
            hint: "owners / repairs",
          },
        ]}
      />

      <SectionBlock
        title="樓層設定精靈"
        description="若樓層數有變動，在這裡重新設定地下/地上層數即可。"
        className="taskCard"
      >
        <form className="row" onSubmit={regenerate} aria-label="regenerate-floors-form">
          <label>
            地下層數
            <input name="basementFloors" defaultValue={5} type="number" min={0} max={20} />
          </label>
          <label>
            地上層數
            <input name="aboveGroundFloors" defaultValue={20} type="number" min={1} max={200} />
          </label>
          <button type="submit">更新樓層設定</button>
        </form>
      </SectionBlock>

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <div id="floor-list">
      <SectionBlock
        title="樓層清單"
        description="可直接查看每層配置與入住狀況，不顯示工程欄位。"
        action={
          <div className="row">
            {(Object.keys(FILTER_LABELS) as FloorFilter[]).map((key) => (
              <button
                key={key}
                type="button"
                data-testid={`filter-chip-floors-${key}`}
                className={filter === key ? "" : "secondary"}
                onClick={() => applyQuery({ filter: key === "all" ? null : key })}
              >
                {FILTER_LABELS[key]}
              </button>
            ))}
            <input
              value={keyword}
              onChange={(e) => applyQuery({ search: e.target.value.trim() || null })}
              placeholder="搜尋樓層（例如 10F）"
              aria-label="搜尋樓層"
              data-testid="floors-search-input"
              style={{ width: 210 }}
            />
          </div>
        }
      >
        {loading ? (
          <div className="muted">載入樓層清單中...</div>
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="沒有符合條件的樓層"
            description="可調整篩選條件，或回到上方重新設定樓層數。"
            action={
              <>
                <Link href={`/buildings/${id}/floors`} className="btn secondary" data-testid="drilldown-link-floors-reset">清除篩選</Link>
                {firstUnconfigured ? (
                  <Link href={`/buildings/${id}/floors/${firstUnconfigured.id}#add-unit`} className="btn" data-testid="drilldown-link-floors-next-unconfigured">
                    前往 {firstUnconfigured.label} 配置單位
                  </Link>
                ) : null}
              </>
            }
          />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>樓層</th>
                  <th>區域</th>
                  <th>單位數</th>
                  <th>入住概況</th>
                  <th>樓層摘要</th>
                  <th>快速操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((f) => (
                  <tr key={f.id} data-testid="floors-row">
                    <td>
                      <Link href={`/buildings/${id}/floors/${f.id}`} style={{ fontWeight: 700 }} data-testid={`drilldown-link-floor-${f.id}`}>
                        {f.label}
                      </Link>
                    </td>
                    <td>{f.region}</td>
                    <td>
                      <Link
                        href={`/buildings/${id}/floors/${f.id}${f.unitCount > 0 ? "#unit-workspace" : "#add-unit"}`}
                        data-testid={`drilldown-link-unit-${f.id}`}
                      >
                        {f.unitCount}
                      </Link>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <Link href={`/buildings/${id}/stacking?filter=vacant`} data-testid={`drilldown-link-stacking-vacant-${f.id}`}>
                          <StatusChip tone="neutral">空置 {f.vacantCount}</StatusChip>
                        </Link>
                        <Link href={`/buildings/${id}/stacking?filter=draft`} data-testid={`drilldown-link-stacking-draft-${f.id}`}>
                          <StatusChip tone="draft">草稿 {f.draftCount}</StatusChip>
                        </Link>
                        <Link href={`/buildings/${id}/stacking?filter=active`} data-testid={`drilldown-link-stacking-active-${f.id}`}>
                          <StatusChip tone="active">啟用 {f.activeCount}</StatusChip>
                        </Link>
                      </div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <Link href={`/buildings/${id}/floors/${f.id}`} data-testid={`drilldown-link-floor-owner-${f.id}`}>
                          <StatusChip tone="info">業主 {f.ownerCount}</StatusChip>
                        </Link>
                        <Link href={`/buildings/${id}/repairs?floorId=${f.id}`} data-testid={`drilldown-link-floor-repair-${f.id}`}>
                          <StatusChip tone="draft">修繕 {f.repairCount}</StatusChip>
                        </Link>
                      </div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <Link href={`/buildings/${id}/floors/${f.id}`} className="badge">
                          查看樓層
                        </Link>
                        <Link href={`/buildings/${id}/floors/${f.id}#add-unit`} className="badge">
                          新增單位
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {detailLoading ? <div className="muted">正在更新單位數與入住概況...</div> : null}
      </SectionBlock>
      </div>
    </main>
  );
}
