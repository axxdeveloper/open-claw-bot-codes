"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function TenantDetailPage() {
  const params = useParams<{ id: string; tenantId: string }>();
  const buildingId = params.id;
  const tenantId = params.tenantId;

  const [tenant, setTenant] = useState<any>(null);
  const [occupancies, setOccupancies] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [unitMap, setUnitMap] = useState<Record<string, { floorLabel: string; unitCode: string }>>({});
  const [error, setError] = useState<string | null>(null);

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

  if (!buildingId || !tenantId) return null;

  return (
    <main className="page">
      <PageHeader
        title={tenant?.name ? `${tenant.name}｜住戶詳情` : "住戶詳情"}
        description="這裡可查看完整聯絡資料、進駐樓層/單位與租約狀態。"
        action={<Link href={`/buildings/${buildingId}/tenants`} className="btn secondary">返回住戶清單</Link>}
      />

      {error ? <div className="errorBox">{error}</div> : null}

      {tenant ? (
        <>
          <SummaryCards
            items={[
              { label: "租約數", value: summary.leases, hint: "此住戶相關租約" },
              { label: "啟用租約", value: summary.activeLease, hint: "目前生效中" },
              { label: "進駐紀錄", value: summary.occupancies, hint: "含 Draft/Active" },
              { label: "Draft 進駐", value: summary.draftOcc, hint: "待補租約" },
            ]}
          />

          <SectionBlock title="基本資料" description="聯絡方式與統編資訊">
            <div className="tableWrap">
              <table className="table">
                <tbody>
                  <tr><th style={{ width: 180 }}>住戶名稱</th><td>{tenant.name || "-"}</td></tr>
                  <tr><th>統編</th><td>{tenant.taxId || "未填寫"}</td></tr>
                  <tr><th>聯絡人</th><td>{tenant.contactName || "未填寫"}</td></tr>
                  <tr><th>聯絡電話</th><td>{tenant.contactPhone || "未填寫"}</td></tr>
                  <tr><th>Email</th><td>{tenant.contactEmail || "未填寫"}</td></tr>
                  <tr><th>備註</th><td>{tenant.notes || "-"}</td></tr>
                </tbody>
              </table>
            </div>
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
                          <td>{o.status}</td>
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
