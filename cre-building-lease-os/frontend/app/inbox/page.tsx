"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, StatusChip, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

type InboxIssue = {
  id: string;
  kind: "draft-occupancy-missing-lease" | "tenant-missing-profile" | "repair-completed-not-accepted";
  title: string;
  detail: string;
  buildingId: string;
  buildingName: string;
  href: string;
};

export default function InboxPage() {
  const [issues, setIssues] = useState<InboxIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const buildingsRes = await apiFetch<any[]>("/buildings");
      if (!buildingsRes.ok) {
        setError(apiErrorMessage(buildingsRes.error));
        setLoading(false);
        return;
      }

      const allIssues: InboxIssue[] = [];

      await Promise.all(
        buildingsRes.data.map(async (building) => {
          const [floorsRes, tenantsRes, leasesRes, occRes, repairsRes] = await Promise.all([
            apiFetch<any[]>(`/buildings/${building.id}/floors`),
            apiFetch<any[]>(`/buildings/${building.id}/tenants`),
            apiFetch<any[]>(`/buildings/${building.id}/leases`),
            apiFetch<any[]>(`/buildings/${building.id}/occupancies`),
            apiFetch<any[]>(`/buildings/${building.id}/repairs`),
          ]);

          const tenants = tenantsRes.ok ? tenantsRes.data : [];
          const occupancies = occRes.ok ? occRes.data : [];
          const leases = leasesRes.ok ? leasesRes.data : [];
          const repairs = repairsRes.ok ? repairsRes.data : [];

          const tenantNameById = new Map<string, string>();
          tenants.forEach((t) => tenantNameById.set(t.id, t.name));

          const leaseUnitIds = new Set<string>();
          leases.forEach((x) => {
            const occRows = x.occupancies || [];
            occRows.forEach((o: any) => {
              if (o?.unitId) leaseUnitIds.add(o.unitId);
            });
          });

          const unitLabelById = new Map<string, string>();
          if (floorsRes.ok) {
            const floorDetails = await Promise.all(
              floorsRes.data.map((f) => apiFetch<any>(`/floors/${f.id}`)),
            );

            floorDetails.forEach((detail) => {
              if (!detail.ok) return;
              const floor = detail.data.floor;
              const units = detail.data.units || [];
              units.forEach((u: any) => {
                unitLabelById.set(u.id, `${floor?.label || "?"}-${u.code}`);
              });
            });
          }

          occupancies
            .filter((o) => o.status === "DRAFT" && !o.leaseId && !leaseUnitIds.has(o.unitId))
            .forEach((o) => {
              allIssues.push({
                id: `draft-occ-${o.id}`,
                kind: "draft-occupancy-missing-lease",
                title: "草稿入住尚未建立租約",
                detail: `${unitLabelById.get(o.unitId) || "未知單位"} / ${tenantNameById.get(o.tenantId) || "未知住戶"}`,
                buildingId: building.id,
                buildingName: building.name,
                href: `/buildings/${building.id}/leases?unitId=${o.unitId}&tenantId=${o.tenantId}`,
              });
            });

          tenants
            .filter((t) => !t.taxId || !t.contactName || (!t.contactPhone && !t.contactEmail))
            .forEach((t) => {
              allIssues.push({
                id: `tenant-${t.id}`,
                kind: "tenant-missing-profile",
                title: "住戶缺少聯絡資料或統編",
                detail: `${t.name} / ${t.taxId ? "統編已填" : "缺統編"} / ${t.contactName ? "有聯絡人" : "缺聯絡人"}`,
                buildingId: building.id,
                buildingName: building.name,
                href: `/buildings/${building.id}/tenants`,
              });
            });

          repairs
            .filter((r) => r.status === "COMPLETED")
            .forEach((r) => {
              allIssues.push({
                id: `repair-${r.id}`,
                kind: "repair-completed-not-accepted",
                title: "修繕已完成但尚未驗收",
                detail: `${r.item} / ${r.vendorName}`,
                buildingId: building.id,
                buildingName: building.name,
                href: `/buildings/${building.id}/repairs#repair-${r.id}`,
              });
            });
        }),
      );

      setIssues(allIssues);
      setLoading(false);
    })();
  }, []);

  const summary = useMemo(() => {
    return {
      draftMissingLease: issues.filter((x) => x.kind === "draft-occupancy-missing-lease").length,
      tenantMissingProfile: issues.filter((x) => x.kind === "tenant-missing-profile").length,
      completedNotAccepted: issues.filter((x) => x.kind === "repair-completed-not-accepted").length,
    };
  }, [issues]);

  const grouped = useMemo(() => {
    return {
      draft: issues.filter((x) => x.kind === "draft-occupancy-missing-lease"),
      tenant: issues.filter((x) => x.kind === "tenant-missing-profile"),
      repair: issues.filter((x) => x.kind === "repair-completed-not-accepted"),
    };
  }, [issues]);

  return (
    <main className="page" data-testid="inbox-page">
      <PageHeader
        title="Inbox｜資料完整度與待辦"
        description="聚焦缺漏項目：草稿入住未轉租約、住戶資料不完整、修繕未驗收。"
        action={<Link href="/buildings" className="btn secondary">回 Dashboard</Link>}
      />

      <SummaryCards
        items={[
          { label: "草稿入住缺租約", value: summary.draftMissingLease, hint: "優先補齊合約" },
          { label: "住戶資料缺漏", value: summary.tenantMissingProfile, hint: "缺聯絡資訊/統編" },
          { label: "修繕待驗收", value: summary.completedNotAccepted, hint: "已完成未結案" },
          { label: "總缺漏", value: issues.length, hint: "需持續追蹤" },
        ]}
      />

      {error ? <div className="errorBox">{error}</div> : null}
      {loading ? <div className="muted">收集缺漏項目中...</div> : null}

      {!loading && issues.length === 0 ? (
        <EmptyState
          title="目前沒有待補缺漏"
          description="太好了！資料完整度目前穩定，可回 Dashboard 繼續日常作業。"
        />
      ) : null}

      {!loading ? (
        <>
          <SectionBlock title="1) 草稿入住缺租約" description="這類資料容易造成後續對帳與續約風險。">
            {grouped.draft.length === 0 ? (
              <div className="muted">目前沒有此類缺漏。</div>
            ) : (
              grouped.draft.map((issue) => (
                <div className="row" key={issue.id} style={{ justifyContent: "space-between" }} data-testid="inbox-item-draft-occupancy">
                  <span>
                    <b>{issue.buildingName}</b>｜{issue.detail}
                  </span>
                  <Link className="badge" href={issue.href}>前往補齊租約</Link>
                </div>
              ))
            )}
          </SectionBlock>

          <SectionBlock title="2) 住戶資料缺漏" description="至少補齊聯絡人與統編，降低作業中斷風險。">
            {grouped.tenant.length === 0 ? (
              <div className="muted">目前沒有此類缺漏。</div>
            ) : (
              grouped.tenant.map((issue) => (
                <div className="row" key={issue.id} style={{ justifyContent: "space-between" }} data-testid="inbox-item-tenant-missing">
                  <span>
                    <b>{issue.buildingName}</b>｜{issue.detail}
                  </span>
                  <Link className="badge" href={issue.href}>前往住戶頁</Link>
                </div>
              ))
            )}
          </SectionBlock>

          <SectionBlock title="3) 修繕已完成但未驗收" description="完成不等於結案，請補齊驗收欄位。">
            {grouped.repair.length === 0 ? (
              <div className="muted">目前沒有此類缺漏。</div>
            ) : (
              grouped.repair.map((issue) => (
                <div className="row" key={issue.id} style={{ justifyContent: "space-between" }} data-testid="inbox-item-repair-pending-acceptance">
                  <span>
                    <b>{issue.buildingName}</b>｜{issue.detail}
                  </span>
                  <span className="row">
                    <StatusChip tone="risk">待驗收</StatusChip>
                    <Link className="badge" href={issue.href}>前往修繕頁</Link>
                  </span>
                </div>
              ))
            )}
          </SectionBlock>
        </>
      ) : null}
    </main>
  );
}
