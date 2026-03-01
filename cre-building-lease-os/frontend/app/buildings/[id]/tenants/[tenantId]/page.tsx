"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

function statusLabel(status: string | null | undefined) {
  if (status === "ACTIVE") return "啟用中";
  if (status === "DRAFT") return "草稿";
  if (status === "INACTIVE") return "停用";
  if (status === "TERMINATED") return "已終止";
  if (status === "EXPIRED") return "已到期";
  return status || "-";
}

function normalizeName(value: string | null | undefined) {
  return String(value || "")
    .replace(/[\s\n\r]+/g, "")
    .replace(/臺/g, "台")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .toLowerCase();
}

export default function TenantDetailPage() {
  const params = useParams<{ id: string; tenantId: string }>();
  const buildingId = params.id;
  const tenantId = params.tenantId;

  const [tenant, setTenant] = useState<any>(null);
  const [occupancies, setOccupancies] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [unitMap, setUnitMap] = useState<Record<string, { floorLabel: string; unitCode: string }>>({});
  const [sourceRows, setSourceRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!buildingId || !tenantId) return;

    (async () => {
      const [tenantRes, occRes, leaseRes, floorsRes] = await Promise.all([
        apiFetch<any>(`/tenants/${tenantId}`),
        apiFetch<any[]>(`/buildings/${buildingId}/occupancies`),
        apiFetch<any[]>(`/buildings/${buildingId}/leases?tenantId=${tenantId}`),
        apiFetch<any[]>(`/buildings/${buildingId}/floors`),
      ]);

      if (!tenantRes.ok) {
        setError(apiErrorMessage(tenantRes.error));
        return;
      }
      setTenant(tenantRes.data);

      const allOcc = occRes.ok ? occRes.data : [];
      setOccupancies(allOcc.filter((x) => x.tenantId === tenantId));
      setLeases(leaseRes.ok ? leaseRes.data : []);

      if (floorsRes.ok) {
        const floors = floorsRes.data;
        const details = await Promise.all(floors.map((f) => apiFetch<any>(`/floors/${f.id}`)));
        const map: Record<string, { floorLabel: string; unitCode: string }> = {};
        details.forEach((d, idx) => {
          if (!d.ok) return;
          const floorLabel = floors[idx].label;
          (d.data.units || []).forEach((u: any) => {
            map[u.id] = { floorLabel, unitCode: u.code };
          });
        });
        setUnitMap(map);
      }

      const sourceRes = await fetch('/source113.json').then((r) => r.json()).catch(() => ({ rows: [] }));
      setSourceRows(Array.isArray(sourceRes?.rows) ? sourceRes.rows : []);
    })();
  }, [buildingId, tenantId]);

  const summary = useMemo(() => {
    const activeLease = leases.filter((x) => x?.lease?.status === "ACTIVE").length;
    const draftOcc = occupancies.filter((x) => x.status === "DRAFT").length;
    return {
      leases: leases.length,
      activeLease,
      occupancies: occupancies.length,
      draftOcc,
    };
  }, [leases, occupancies]);

  useEffect(() => {
    if (!tenant) return;
    setName(tenant.name || "");
    setTaxId(tenant.taxId || "");
    setContactName(tenant.contactName || "");
    setContactPhone(tenant.contactPhone || "");
    setContactEmail(tenant.contactEmail || "");
    setNotes(tenant.notes || "");
  }, [tenant]);

  const saveTenant = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("住戶名稱不可空白");
      return;
    }

    const r = await apiFetch(`/tenants/${tenantId}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: name.trim(),
        taxId: taxId.trim() || null,
        contactName: contactName.trim() || null,
        contactPhone: contactPhone.trim() || null,
        contactEmail: contactEmail.trim() || null,
        notes: notes.trim() || null,
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setTenant(r.data);
    setSuccess("住戶資料已更新");
  };

  const source113Records = useMemo(() => {
    if (!tenant?.name) return [];
    const tenantKey = normalizeName(tenant.name);
    return sourceRows.filter((r) => {
      const merchantKey = normalizeName(r.merchant);
      return merchantKey.includes(tenantKey) || tenantKey.includes(merchantKey);
    });
  }, [sourceRows, tenant]);

  if (!buildingId || !tenantId) return null;

  return (
    <main className="page">
      <PageHeader
        title={tenant?.name ? `${tenant.name}｜住戶詳情` : "住戶詳情"}
        description="這裡可查看完整聯絡資料、進駐樓層/單位與租約狀態。"
        action={<Link href={`/buildings/${buildingId}/tenants`} className="btn secondary">返回住戶清單</Link>}
      />

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      {tenant ? (
        <>
          <SummaryCards
            items={[
              { label: "租約數", value: summary.leases, hint: "此住戶相關租約" },
              { label: "啟用租約", value: summary.activeLease, hint: "目前生效中" },
              { label: "進駐紀錄", value: summary.occupancies, hint: "含草稿/啟用" },
              { label: "草稿進駐", value: summary.draftOcc, hint: "待補租約" },
            ]}
          />

          <SectionBlock title="基本資料" description="可直接在此頁編輯住戶聯絡與統編資訊。">
            <form className="grid" onSubmit={saveTenant} aria-label="edit-tenant-form" data-testid="edit-tenant-form">
              <div className="split">
                <label>
                  住戶名稱
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>
                  統編
                  <input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="未填寫" />
                </label>
              </div>

              <div className="split">
                <label>
                  聯絡人
                  <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="未填寫" />
                </label>
                <label>
                  聯絡電話
                  <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="未填寫" />
                </label>
              </div>

              <div className="split">
                <label>
                  電子郵件
                  <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="未填寫" />
                </label>
                <label>
                  備註
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="可補充來源與說明" />
                </label>
              </div>

              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button type="submit" data-testid="tenant-save">儲存住戶資料</button>
              </div>
            </form>
          </SectionBlock>

          <SectionBlock title="來源 113 明細" description="地址、室號、戶號與聯絡資訊（由 Excel 113 匯入）。">
            {source113Records.length === 0 ? (
              <div className="muted">此住戶目前沒有來源 113 明細</div>
            ) : (
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>樓層</th>
                      <th>地址</th>
                      <th>室號</th>
                      <th>戶號</th>
                      <th>公司電話</th>
                      <th>主要聯絡人</th>
                      <th>分機</th>
                      <th>手機</th>
                    </tr>
                  </thead>
                  <tbody>
                    {source113Records.map((r, idx) => (
                      <tr key={`${r.row || idx}-${idx}`}>
                        <td>{r.floor || "-"}</td>
                        <td>{r.address || "-"}</td>
                        <td>{r.room || "-"}</td>
                        <td>{r.household || "-"}</td>
                        <td>{r.companyPhone || "-"}</td>
                        <td>{r.contact || "-"}</td>
                        <td>{r.extension || "-"}</td>
                        <td>{r.mobile || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionBlock>

          <SectionBlock title="進駐樓層/單位" description="住戶目前或歷史進駐位置">
            {occupancies.length === 0 ? (
              <EmptyState
                title="尚無進駐紀錄"
                description="可到樓層頁先指派 Draft 住戶，或直接建立租約。"
                action={<Link href={`/buildings/${buildingId}/floors`} className="btn">前往樓層配置</Link>}
              />
            ) : (
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>樓層</th>
                      <th>單位</th>
                      <th>狀態</th>
                      <th>起日</th>
                      <th>迄日</th>
                    </tr>
                  </thead>
                  <tbody>
                    {occupancies.map((o) => {
                      const m = unitMap[o.unitId] || { floorLabel: "-", unitCode: "-" };
                      return (
                        <tr key={o.id}>
                          <td>{m.floorLabel}</td>
                          <td>{m.unitCode}</td>
                          <td>{statusLabel(o.status)}</td>
                          <td>{o.startDate || "-"}</td>
                          <td>{o.endDate || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionBlock>

          <SectionBlock title="租約" description="快速查看此住戶關聯租約">
            <Link href={`/buildings/${buildingId}/leases?tenantId=${tenantId}`} className="btn">查看租約明細</Link>
          </SectionBlock>
        </>
      ) : (
        <EmptyState title="載入住戶資料中" description="若超過數秒，請重新整理。" />
      )}
    </main>
  );
}
