"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { EmptyState, PageHeader, SectionBlock, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function VendorsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [vendors, setVendors] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    const r = await apiFetch<any[]>(`/buildings/${id}/vendors`);
    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }
    setVendors(r.data);
  };

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  const createVendor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      taxId: String(fd.get("taxId") || "").trim() || null,
      contactName: String(fd.get("contactName") || "").trim() || null,
      phone: String(fd.get("phone") || "").trim() || null,
      email: String(fd.get("email") || "").trim() || null,
      notes: String(fd.get("notes") || "").trim() || null,
    };

    if (!payload.name) {
      setError("廠商名稱必填");
      return;
    }

    const r = await apiFetch(`/buildings/${id}/vendors`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("廠商已新增。現在可在修繕案件中指派。");
    (e.target as HTMLFormElement).reset();
    load();
  };

  if (!id) return null;

  return (
    <main className="page">
      <PageHeader
        title="廠商管理"
        description="先維護廠商名錄，再在修繕需求單中指派廠商處理。"
        action={<Link href={`/buildings/${id}/repairs`} className="btn">前往修繕需求單</Link>}
      />

      <SummaryCards
        items={[
          { label: "廠商數", value: vendors.length, hint: "可指派於修繕需求" },
        ]}
      />

      <SectionBlock title="新增廠商" description="維護完整聯絡資料，後續派工與驗收更順。">
        <form className="grid" onSubmit={createVendor}>
          <div className="split">
            <input name="name" placeholder="廠商名稱（必填）" required />
            <input name="taxId" placeholder="統一編號" />
          </div>
          <div className="split">
            <input name="contactName" placeholder="聯絡人" />
            <input name="phone" placeholder="電話" />
          </div>
          <div className="split">
            <input name="email" placeholder="Email" />
            <input name="notes" placeholder="備註（可選）" />
          </div>
          <button type="submit">新增廠商</button>
        </form>
      </SectionBlock>

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <SectionBlock title="廠商名錄" description="點選可查看該廠商相關修繕案件。">
        {vendors.length === 0 ? (
          <EmptyState
            title="尚未建立廠商"
            description="請先新增至少一個廠商，修繕案件才可指派。"
          />
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>廠商</th>
                  <th>統編</th>
                  <th>聯絡人</th>
                  <th>電話</th>
                  <th>Email</th>
                  <th>查看</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id}>
                    <td>{v.name}</td>
                    <td>{v.taxId || "-"}</td>
                    <td>{v.contactName || "-"}</td>
                    <td>{v.phone || "-"}</td>
                    <td>{v.email || "-"}</td>
                    <td>
                      <Link href={`/buildings/${id}/repairs?vendorId=${v.id}`} className="badge">查看案件</Link>
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
