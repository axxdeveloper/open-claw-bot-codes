"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function OwnersPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [owners, setOwners] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async (bid: string) => {
    const r = await apiFetch<any[]>(`/buildings/${bid}/owners`);
    if (r.ok) setOwners(r.data);
    else setError(apiErrorMessage(r.error));
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
    const r = await apiFetch(`/buildings/${id}/owners`, {
      method: "POST",
      body: JSON.stringify({
        name: String(fd.get("name") || "").trim(),
        taxId: String(fd.get("taxId") || "").trim() || null,
        contactName: String(fd.get("contactName") || "").trim() || null,
        contactPhone: String(fd.get("contactPhone") || "").trim() || null,
        contactEmail: String(fd.get("contactEmail") || "").trim() || null,
        notes: String(fd.get("notes") || "").trim() || null,
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("業主資料已建立，可至樓層頁指派持分。");
    (e.target as HTMLFormElement).reset();
    load(id);
  };

  const summary = useMemo(() => {
    const withContact = owners.filter((o) => o.contactName || o.contactPhone || o.contactEmail).length;
    return {
      total: owners.length,
      withContact,
      noContact: Math.max(owners.length - withContact, 0),
    };
  }, [owners]);

  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title="業主與持分管理"
        description="先維護業主主檔，再到樓層頁分配持分比例。"
        action={<Link href={`/buildings/${id}/floors`} className="btn secondary">前往樓層指派持分</Link>}
      />

      <SummaryCards
        items={[
          { label: "業主總數", value: summary.total, hint: "本棟已建檔" },
          { label: "聯絡資訊完整", value: summary.withContact, hint: "方便後續聯繫" },
          { label: "待補聯絡資訊", value: summary.noContact, hint: "建議盡快補齊" },
          { label: "下一步", value: "分配持分", hint: "到樓層頁操作" },
        ]}
      />

      <SectionBlock title="新增業主" description="建立主檔後即可在樓層頁指定持分比例。" className="taskCard">
        <form className="grid" onSubmit={onSubmit} aria-label="create-owner-form">
          <div className="split">
            <input name="name" placeholder="業主名稱（必填）" required />
            <input name="taxId" placeholder="統編（選填）" />
          </div>
          <div className="split">
            <input name="contactName" placeholder="聯絡人" />
            <input name="contactPhone" placeholder="聯絡電話" />
          </div>
          <input name="contactEmail" placeholder="聯絡 Email" type="email" />
          <textarea name="notes" placeholder="備註" />
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button type="submit">新增業主</button>
          </div>
        </form>
      </SectionBlock>

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <SectionBlock title="業主清單" description="快速查看聯絡資訊是否齊全。">
        {owners.length === 0 ? (
          <EmptyState title="尚無業主資料" description="先建立業主，再到樓層頁設定持分。" />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>業主名稱</th>
                  <th>聯絡人</th>
                  <th>聯絡方式</th>
                  <th>備註</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((o) => (
                  <tr key={o.id}>
                    <td>{o.name}</td>
                    <td>{o.contactName || "未填寫"}</td>
                    <td>{o.contactPhone || o.contactEmail || "未填寫"}</td>
                    <td>{o.notes || "-"}</td>
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
