"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, StatusChip } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

function isExpiringSoon(endDate?: string) {
  if (!endDate) return false;
  const now = new Date();
  const d90 = new Date(now);
  d90.setDate(d90.getDate() + 90);
  const end = new Date(endDate);
  return end >= now && end <= d90;
}

type LeaseFilter = "all" | "active" | "draft" | "expiring";

function parseFilter(raw: string | null): LeaseFilter {
  if (raw === "active" || raw === "draft" || raw === "expiring") return raw;
  return "all";
}

export default function LeasesPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const id = params.id;

  const [building, setBuilding] = useState<any>(null);
  const [leases, setLeases] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<LeaseFilter>("all");
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

  const load = async (bid: string) => {
    const [buildingRes, ls, ts, fs] = await Promise.all([
      apiFetch<any>(`/buildings/${bid}`),
      apiFetch<any[]>(`/buildings/${bid}/leases`),
      apiFetch<any[]>(`/buildings/${bid}/tenants`),
      apiFetch<any[]>(`/buildings/${bid}/floors`),
    ]);

    if (buildingRes.ok) setBuilding(buildingRes.data);
    if (ls.ok) setLeases(ls.data);
    if (ts.ok) setTenants(ts.data);

    if (fs.ok) {
      const floorData = await Promise.all(fs.data.map((f: any) => apiFetch<any>(`/floors/${f.id}`)));
      const allUnits = floorData
        .flatMap((x) => {
          if (!x.ok) return [];
          const floorLabel = x.data?.floor?.label || "?F";
          return (x.data.units || []).map((u: any) => ({
            id: u.id,
            code: u.code,
            floorLabel,
            display: `${floorLabel}-${u.code}`,
          }));
        });
      setUnits(allUnits);
    }
  };

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  useEffect(() => {
    const prefillUnitId = searchParams.get("unitId");
    if (prefillUnitId) setSelected([prefillUnitId]);
  }, [searchParams]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (selected.length === 0) {
      setError("請至少勾選一個租賃單位。");
      return;
    }

    const fd = new FormData(e.currentTarget);

    const result = await apiFetch<any>(`/leases`, {
      method: "POST",
      body: JSON.stringify({
        buildingId: id,
        tenantId: String(fd.get("tenantId") || ""),
        unitIds: selected,
        status: String(fd.get("status") || "ACTIVE"),
        startDate: String(fd.get("startDate") || ""),
        endDate: String(fd.get("endDate") || ""),
        managementFee: fd.get("managementFee") ? Number(fd.get("managementFee")) : null,
      }),
    });

    if (!result.ok) {
      setError(apiErrorMessage(result.error));
      return;
    }

    setSuccess("租約已建立，系統已同步更新入住狀態。");
    setSelected([]);
    load(id);
  };

  const prefillTenant = searchParams.get("tenantId") || "";
  const tenantFilter = searchParams.get("tenantId") || "";
  const unitFilter = searchParams.get("unitId") || "";

  const tenantNameById = useMemo(() => {
    const map = new Map<string, string>();
    tenants.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [tenants]);

  const unitCodeById = useMemo(() => {
    const map = new Map<string, string>();
    units.forEach((u) => map.set(u.id, u.display || u.code));
    return map;
  }, [units]);

  const filteredLeases = useMemo(() => {
    let list = leases;

    if (filter === "active") list = list.filter((x) => x?.lease?.status === "ACTIVE");
    if (filter === "draft") list = list.filter((x) => x?.lease?.status === "DRAFT");
    if (filter === "expiring") list = list.filter((x) => x?.lease?.status === "ACTIVE" && isExpiringSoon(x?.lease?.endDate));

    if (tenantFilter) list = list.filter((x) => x?.lease?.tenantId === tenantFilter);
    if (unitFilter) list = list.filter((x) => (x?.unitIds || []).includes(unitFilter));

    const term = keyword.trim().toLowerCase();
    if (term) {
      list = list.filter((x) => {
        const unitCodes = (x?.unitIds || []).map((uid: string) => unitCodeById.get(uid) || uid).join(" ");
        const tenantName = tenantNameById.get(x?.lease?.tenantId || "") || "";
        const text = `${x?.lease?.id || ""} ${x?.lease?.status || ""} ${x?.lease?.startDate || ""} ${x?.lease?.endDate || ""} ${tenantName} ${unitCodes}`;
        return text.toLowerCase().includes(term);
      });
    }

    return list;
  }, [filter, keyword, leases, tenantFilter, tenantNameById, unitCodeById, unitFilter]);

  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title="租約管理"
        description="集中管理租約建立、狀態與到期風險，避免漏續約。"
        action={<Link href={`/buildings/${id}/tenants`} className="btn secondary">回住戶管理</Link>}
      />


      <SectionBlock title="建立租約" description="依照順序填寫：住戶 → 期間 → 單位。" className="taskCard">
        <form className="grid" onSubmit={onSubmit} aria-label="create-lease-form" id="quick-add-lease" data-testid="create-lease-form">
          <div className="split">
            <label>
              住戶
              <select name="tenantId" required defaultValue={prefillTenant} data-testid="lease-tenant-select">
                <option value="">選擇住戶</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              狀態
              <select name="status" defaultValue="ACTIVE">
                <option value="DRAFT">草稿</option>
                <option value="ACTIVE">啟用</option>
              </select>
            </label>
          </div>

          <div className="split">
            <label>
              起租日
              <input name="startDate" type="date" required />
            </label>
            <label>
              結束日
              <input name="endDate" type="date" required />
            </label>
          </div>

          <label>
            管理費（選填）
            <input
              name="managementFee"
              type="number"
              step="0.01"
              min={0}
              placeholder={building?.managementFee ? `留空自動套用預設 ${building.managementFee}` : "每坪管理費"}
              data-testid="lease-management-fee-input"
            />
            <small className="muted">{building?.managementFee ? `留空時會沿用大樓預設管理費：${building.managementFee}` : "留空時會沿用大樓預設（若有設定）。"}</small>
          </label>

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))" }}>
            {units.map((u) => (
              <label key={u.id} className="card" style={{ padding: 8, boxShadow: "none" }}>
                <input
                  type="checkbox"
                  checked={selected.includes(u.id)}
                  onChange={() =>
                    setSelected((prev) =>
                      prev.includes(u.id) ? prev.filter((x) => x !== u.id) : [...prev, u.id],
                    )
                  }
                />{" "}
                {u.display || u.code}
              </label>
            ))}
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="muted">已選 {selected.length} 個單位</span>
            <button type="submit" data-testid="lease-submit">建立租約</button>
          </div>
        </form>
      </SectionBlock>

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <SectionBlock
        title="租約清單"
        description="重點顯示狀態與到期風險。"
        action={
          <div className="row">
            <button type="button" className={filter === "all" ? "" : "secondary"} onClick={() => applyQuery({ filter: null })} data-testid="filter-chip-leases-all">全部</button>
            <button type="button" className={filter === "active" ? "" : "secondary"} onClick={() => applyQuery({ filter: "active" })} data-testid="filter-chip-leases-active">啟用</button>
            <button type="button" className={filter === "draft" ? "" : "secondary"} onClick={() => applyQuery({ filter: "draft" })} data-testid="filter-chip-leases-draft">草稿</button>
            <button type="button" className={filter === "expiring" ? "" : "secondary"} onClick={() => applyQuery({ filter: "expiring" })} data-testid="filter-chip-leases-expiring">90天到期</button>
            <input
              value={keyword}
              onChange={(e) => applyQuery({ search: e.target.value.trim() || null })}
              placeholder="搜尋租約 / 住戶 / 單位"
              aria-label="搜尋租約"
              style={{ width: 220 }}
            />
          </div>
        }
      >
        {leases.length === 0 ? (
          <EmptyState
            title="尚無租約"
            description="可先到住戶頁建立住戶，再回來建立第一筆租約。"
            action={<Link href={`/buildings/${id}/tenants`} className="btn">前往住戶頁</Link>}
          />
        ) : filteredLeases.length === 0 ? (
          <EmptyState
            title="目前沒有符合篩選的租約"
            description="可清除篩選條件，或調整搜尋關鍵字。"
            action={<Link href={`/buildings/${id}/leases`} className="btn secondary" data-testid="drilldown-link-leases-reset-filter">清除篩選</Link>}
          />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>租約</th>
                  <th>住戶</th>
                  <th>單位</th>
                  <th>期間</th>
                  <th>狀態</th>
                  <th>風險提醒</th>
                  <th>快速操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeases.map((x: any) => {
                  const tenantName = tenantNameById.get(x?.lease?.tenantId || "") || "未知住戶";
                  const unitCodes = (x?.unitIds || []).map((uid: string) => unitCodeById.get(uid) || uid);

                  return (
                    <tr key={x.lease.id}>
                      <td>
                        <Link href={`/leases/${x.lease.id}`} data-testid={`drilldown-link-lease-${x.lease.id}`}>
                          {x.lease.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/buildings/${id}/tenants?search=${encodeURIComponent(tenantName)}`} data-testid={`drilldown-link-lease-tenant-${x.lease.id}`}>
                          {tenantName}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/buildings/${id}/leases?unitId=${x?.unitIds?.[0] || ""}`} data-testid={`drilldown-link-lease-unit-${x.lease.id}`}>
                          {unitCodes.join("、") || "-"}
                        </Link>
                      </td>
                      <td>
                        {x.lease.startDate} ~ {x.lease.endDate}
                      </td>
                      <td>
                        <Link href={`/buildings/${id}/leases?filter=${x.lease.status === "ACTIVE" ? "active" : "draft"}`} data-testid={`drilldown-link-lease-status-${x.lease.id}`}>
                          {x.lease.status === "ACTIVE" ? (
                            <StatusChip tone="active">啟用</StatusChip>
                          ) : (
                            <StatusChip tone="draft">草稿</StatusChip>
                          )}
                        </Link>
                      </td>
                      <td>
                        <Link
                          href={`/buildings/${id}/leases?filter=${isExpiringSoon(x.lease.endDate) ? "expiring" : "active"}`}
                          data-testid={`drilldown-link-lease-risk-${x.lease.id}`}
                        >
                          {isExpiringSoon(x.lease.endDate) ? (
                            <StatusChip tone="risk">90天內到期</StatusChip>
                          ) : (
                            <StatusChip tone="neutral">目前正常</StatusChip>
                          )}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/leases/${x.lease.id}`} className="badge">查看詳情</Link>
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
