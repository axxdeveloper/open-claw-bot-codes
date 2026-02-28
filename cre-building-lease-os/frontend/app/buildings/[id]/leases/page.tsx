"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, StatusChip, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

function isExpiringSoon(endDate?: string) {
  if (!endDate) return false;
  const now = new Date();
  const d90 = new Date(now);
  d90.setDate(d90.getDate() + 90);
  const end = new Date(endDate);
  return end >= now && end <= d90;
}

export default function LeasesPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;

  const [leases, setLeases] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async (bid: string) => {
    const [ls, ts, fs] = await Promise.all([
      apiFetch<any[]>(`/buildings/${bid}/leases`),
      apiFetch<any[]>(`/buildings/${bid}/tenants`),
      apiFetch<any[]>(`/buildings/${bid}/floors`),
    ]);

    if (ls.ok) setLeases(ls.data);
    if (ts.ok) setTenants(ts.data);

    if (fs.ok) {
      const floorData = await Promise.all(fs.data.map((f: any) => apiFetch<any>(`/floors/${f.id}`)));
      const allUnits = floorData
        .filter((x) => x.ok)
        .flatMap((x) => x.data.units || [])
        .map((u: any) => ({ id: u.id, code: u.code }));
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

  const summary = useMemo(() => {
    const active = leases.filter((x) => x?.lease?.status === "ACTIVE").length;
    const draft = leases.filter((x) => x?.lease?.status === "DRAFT").length;
    const expiringSoon = leases.filter((x) => x?.lease?.status === "ACTIVE" && isExpiringSoon(x?.lease?.endDate)).length;

    return {
      total: leases.length,
      active,
      draft,
      expiringSoon,
    };
  }, [leases]);

  const prefillTenant = searchParams.get("tenantId") || "";

  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title="租約管理"
        description="集中管理租約建立、狀態與到期風險，避免漏續約。"
        action={<Link href={`/buildings/${id}/tenants`} className="btn secondary">回住戶管理</Link>}
      />

      <SummaryCards
        items={[
          { label: "租約總數", value: summary.total, hint: "含草稿與啟用" },
          { label: "啟用租約", value: summary.active, hint: "正在履約" },
          { label: "草稿租約", value: summary.draft, hint: "待確認" },
          { label: "90天內到期", value: summary.expiringSoon, hint: "建議提早續約" },
        ]}
      />

      <SectionBlock title="建立租約" description="依照順序填寫：住戶 → 期間 → 單位。" className="taskCard">
        <form className="grid" onSubmit={onSubmit} aria-label="create-lease-form">
          <div className="split">
            <label>
              住戶
              <select name="tenantId" required defaultValue={prefillTenant}>
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
            <input name="managementFee" type="number" step="0.01" min={0} placeholder="每坪管理費" />
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
                {u.code}
              </label>
            ))}
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="muted">已選 {selected.length} 個單位</span>
            <button type="submit">建立租約</button>
          </div>
        </form>
      </SectionBlock>

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <SectionBlock title="租約清單" description="重點顯示狀態與到期風險。">
        {leases.length === 0 ? (
          <EmptyState
            title="尚無租約"
            description="可先到住戶頁建立住戶，再回來建立第一筆租約。"
            action={<Link href={`/buildings/${id}/tenants`} className="btn">前往住戶頁</Link>}
          />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>租約</th>
                  <th>期間</th>
                  <th>狀態</th>
                  <th>風險提醒</th>
                  <th>快速操作</th>
                </tr>
              </thead>
              <tbody>
                {leases.map((x: any) => (
                  <tr key={x.lease.id}>
                    <td>{x.lease.id.slice(0, 8)}</td>
                    <td>
                      {x.lease.startDate} ~ {x.lease.endDate}
                    </td>
                    <td>
                      {x.lease.status === "ACTIVE" ? (
                        <StatusChip tone="active">啟用</StatusChip>
                      ) : (
                        <StatusChip tone="draft">草稿</StatusChip>
                      )}
                    </td>
                    <td>
                      {isExpiringSoon(x.lease.endDate) ? (
                        <StatusChip tone="risk">90天內到期</StatusChip>
                      ) : (
                        <StatusChip tone="neutral">目前正常</StatusChip>
                      )}
                    </td>
                    <td>
                      <Link href={`/leases/${x.lease.id}`} className="badge">查看詳情</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionBlock>
    </main>
  );
}
