"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

type TenantScope = "all" | "with-lease" | "no-lease";

function parseScope(raw: string | null): TenantScope {
  if (raw === "with-lease" || raw === "no-lease") return raw;
  return "all";
}

export default function TenantsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const id = params.id;

  const [rows, setRows] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [scope, setScope] = useState<TenantScope>("all");

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

  const load = async (bid: string) => {
    const [tenantRes, leaseRes] = await Promise.all([
      apiFetch<any[]>(`/buildings/${bid}/tenants`),
      apiFetch<any[]>(`/buildings/${bid}/leases`),
    ]);

    if (tenantRes.ok) setRows(tenantRes.data);
    else setError(apiErrorMessage(tenantRes.error));

    if (leaseRes.ok) setLeases(leaseRes.data);
  };

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData(e.currentTarget);
    const r = await apiFetch(`/buildings/${id}/tenants`, {
      method: "POST",
      body: JSON.stringify({
        name: String(fd.get("name") || "").trim(),
        taxId: String(fd.get("taxId") || "").trim() || null,
        contactName: String(fd.get("contactName") || "").trim() || null,
        contactPhone: String(fd.get("contactPhone") || "").trim() || null,
        contactEmail: String(fd.get("contactEmail") || "").trim() || null,
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("住戶資料已建立，可直接前往建立租約。");
    (e.target as HTMLFormElement).reset();
    load(id);
  };

  const leaseMetaByTenant = useMemo(() => {
    const map = new Map<string, { active: number; draft: number; total: number }>();

    for (const row of leases) {
      const tenantId = row?.lease?.tenantId;
      if (!tenantId) continue;

      const meta = map.get(tenantId) || { active: 0, draft: 0, total: 0 };
      meta.total += 1;
      if (row?.lease?.status === "ACTIVE") meta.active += 1;
      if (row?.lease?.status === "DRAFT") meta.draft += 1;
      map.set(tenantId, meta);
    }

    return map;
  }, [leases]);

  const summary = useMemo(() => {
    const activeLeases = leases.filter((x) => x?.lease?.status === "ACTIVE").length;
    const tenantsWithLease = rows.filter((x) => leaseMetaByTenant.has(x.id)).length;

    return {
      tenantCount: rows.length,
      activeLeases,
      withLease: tenantsWithLease,
      noLease: Math.max(rows.length - tenantsWithLease, 0),
    };
  }, [leaseMetaByTenant, leases, rows]);

  const filteredRows = useMemo(() => {
    let list = rows;

    if (scope === "with-lease") list = list.filter((r) => leaseMetaByTenant.has(r.id));
    if (scope === "no-lease") list = list.filter((r) => !leaseMetaByTenant.has(r.id));

    const term = keyword.trim().toLowerCase();
    if (term) {
      list = list.filter((r) => {
        const text = `${r.name || ""} ${r.contactName || ""} ${r.contactPhone || ""} ${r.contactEmail || ""}`;
        return text.toLowerCase().includes(term);
      });
    }

    return list;
  }, [rows, keyword, leaseMetaByTenant, scope]);

  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title="住戶管理"
        description="維持聯絡資訊完整，才能快速處理租約、續約與維修溝通。"
        action={<Link href={`/buildings/${id}/leases`} className="btn">前往租約管理</Link>}
      />

      <SummaryCards
        items={[
          {
            label: "住戶總數",
            value: summary.tenantCount,
            hint: "本棟住戶名單",
            href: `/buildings/${id}/tenants`,
            testId: "drilldown-link-tenants-summary-total",
          },
          {
            label: "啟用租約",
            value: summary.activeLeases,
            hint: "正在履約",
            href: `/buildings/${id}/leases?filter=active`,
            testId: "drilldown-link-tenants-summary-active-leases",
          },
          {
            label: "尚未建租約",
            value: summary.noLease,
            hint: "可安排後續",
            href: `/buildings/${id}/tenants?scope=no-lease`,
            testId: "drilldown-link-tenants-summary-no-lease",
          },
          {
            label: "下一步",
            value: "補齊聯絡資料",
            hint: "降低聯繫風險",
            href: "#quick-add-tenant",
            testId: "drilldown-link-tenants-summary-next",
          },
        ]}
      />

      <SectionBlock
        title="新增住戶"
        description="只填必要資料即可，其他欄位可後續補齊。"
        className="taskCard"
      >
        <form className="grid" onSubmit={onSubmit} aria-label="create-tenant-form" id="quick-add-tenant" data-testid="create-tenant-form">
          <div className="split">
            <input name="name" placeholder="公司或住戶名稱（必填）" required data-testid="tenant-name-input" />
            <input name="taxId" placeholder="統編（選填）" />
          </div>
          <div className="split">
            <input name="contactName" placeholder="聯絡人" />
            <input name="contactPhone" placeholder="聯絡電話" />
          </div>
          <input name="contactEmail" placeholder="聯絡 Email" type="email" />
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="muted">建立後可直接在租約頁選取該住戶。</span>
            <button type="submit" data-testid="tenant-submit">新增住戶</button>
          </div>
        </form>
      </SectionBlock>

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <SectionBlock
        title="住戶清單"
        description="可搜尋名稱、聯絡人或聯絡方式。"
        action={
          <div className="row">
            <button
              type="button"
              data-testid="filter-chip-tenants-all"
              className={scope === "all" ? "" : "secondary"}
              onClick={() => applyQuery({ scope: null })}
            >
              全部
            </button>
            <button
              type="button"
              data-testid="filter-chip-tenants-with-lease"
              className={scope === "with-lease" ? "" : "secondary"}
              onClick={() => applyQuery({ scope: "with-lease" })}
            >
              有租約
            </button>
            <button
              type="button"
              data-testid="filter-chip-tenants-no-lease"
              className={scope === "no-lease" ? "" : "secondary"}
              onClick={() => applyQuery({ scope: "no-lease" })}
            >
              無租約
            </button>
            <input
              value={keyword}
              onChange={(e) => applyQuery({ search: e.target.value.trim() || null })}
              placeholder="搜尋住戶"
              aria-label="搜尋住戶"
              style={{ width: 220 }}
            />
          </div>
        }
      >
        {filteredRows.length === 0 ? (
          <EmptyState
            title="尚無住戶資料"
            description="先建立第一位住戶，才能進行租約綁定。"
            action={
              <>
                <Link href={`/buildings/${id}/tenants`} className="btn secondary" data-testid="drilldown-link-tenants-reset">清除篩選</Link>
                <Link href="#quick-add-tenant" className="btn" data-testid="drilldown-link-tenants-add-first">新增第一位住戶</Link>
              </>
            }
          />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>住戶名稱</th>
                  <th>聯絡人</th>
                  <th>聯絡方式</th>
                  <th>租約狀態</th>
                  <th>快速操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((t) => {
                  const meta = leaseMetaByTenant.get(t.id) || { active: 0, draft: 0, total: 0 };
                  return (
                    <tr key={t.id}>
                      <td>
                        <Link href={`/buildings/${id}/leases?tenantId=${t.id}`} data-testid={`drilldown-link-tenant-name-${t.id}`}>
                          {t.name}
                        </Link>
                      </td>
                      <td>{t.contactName || "未填寫"}</td>
                      <td>{t.contactPhone || t.contactEmail || "未填寫"}</td>
                      <td>
                        {meta.total === 0 ? (
                          <Link href={`/buildings/${id}/tenants?scope=no-lease`} data-testid={`drilldown-link-tenant-status-none-${t.id}`}>
                            無租約
                          </Link>
                        ) : (
                          <div className="row" style={{ gap: 6 }}>
                            {meta.active > 0 ? <Link href={`/buildings/${id}/leases?filter=active&tenantId=${t.id}`} data-testid={`drilldown-link-tenant-status-active-${t.id}`}>ACTIVE {meta.active}</Link> : null}
                            {meta.draft > 0 ? <Link href={`/buildings/${id}/leases?filter=draft&tenantId=${t.id}`} data-testid={`drilldown-link-tenant-status-draft-${t.id}`}>DRAFT {meta.draft}</Link> : null}
                          </div>
                        )}
                      </td>
                      <td>
                        <Link href={`/buildings/${id}/leases?tenantId=${t.id}`} className="badge" data-testid={`drilldown-link-tenant-create-lease-${t.id}`}>
                          建立租約
                        </Link>
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
