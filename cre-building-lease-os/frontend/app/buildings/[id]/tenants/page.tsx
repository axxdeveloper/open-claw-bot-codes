"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function TenantsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [rows, setRows] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");

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

  const summary = useMemo(() => {
    const activeLeases = leases.filter((x) => x?.lease?.status === "ACTIVE").length;
    return {
      tenantCount: rows.length,
      activeLeases,
      noLease: Math.max(rows.length - activeLeases, 0),
    };
  }, [rows.length, leases]);

  const filteredRows = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((r) => {
      const text = `${r.name || ""} ${r.contactName || ""} ${r.contactPhone || ""} ${r.contactEmail || ""}`;
      return text.toLowerCase().includes(term);
    });
  }, [rows, keyword]);

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
          { label: "住戶總數", value: summary.tenantCount, hint: "本棟住戶名單" },
          { label: "啟用租約", value: summary.activeLeases, hint: "正在履約" },
          { label: "尚未建租約", value: summary.noLease, hint: "可安排後續" },
          { label: "下一步", value: "補齊聯絡資料", hint: "降低聯繫風險" },
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
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜尋住戶"
            aria-label="搜尋住戶"
            style={{ width: 220 }}
          />
        }
      >
        {filteredRows.length === 0 ? (
          <EmptyState
            title="尚無住戶資料"
            description="先建立第一位住戶，才能進行租約綁定。"
          />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>住戶名稱</th>
                  <th>聯絡人</th>
                  <th>聯絡方式</th>
                  <th>快速操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t.contactName || "未填寫"}</td>
                    <td>{t.contactPhone || t.contactEmail || "未填寫"}</td>
                    <td>
                      <Link href={`/buildings/${id}/leases?tenantId=${t.id}`} className="badge">
                        建立租約
                      </Link>
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
