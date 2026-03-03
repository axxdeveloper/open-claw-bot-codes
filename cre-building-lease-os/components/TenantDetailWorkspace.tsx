"use client";

import { useMemo, useState } from "react";
import InlineEditableField from "@/components/InlineEditableField";

type LeaseAttachment = {
  id: string;
  leaseId: string;
  leaseLabel: string;
  fileName: string;
  fileUrl: string;
  kind: string;
};

type TimelineRow = {
  id: string;
  unitLabel: string;
  status: string;
  startDate: string;
  endDate: string;
};

type Props = {
  buildingId: string;
  tenant: {
    id: string;
    name: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    taxId: string;
    notes: string;
  };
  leases: { id: string; period: string }[];
  attachments: LeaseAttachment[];
  timeline: TimelineRow[];
};

export default function TenantDetailWorkspace({ buildingId, tenant, leases, attachments, timeline }: Props) {
  const [profile, setProfile] = useState(tenant);
  const [files, setFiles] = useState(attachments);
  const [uploading, setUploading] = useState(false);

  const patchTenant = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/tenants/${tenant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.ok) throw new Error("更新失敗");
  };

  const leaseMap = useMemo(() => Object.fromEntries(leases.map((lease) => [lease.id, lease.period])), [leases]);

  return (
    <div className="space-y-4">
      <section className="rounded border bg-white">
        <div className="border-b px-3 py-2 text-sm font-semibold">租戶 Profile / 聯絡資訊（雙擊編輯）</div>
        <table className="w-full text-sm">
          <tbody>
            {[
              ["公司名稱", "name"],
              ["聯絡人", "contactName"],
              ["Email", "contactEmail"],
              ["電話", "contactPhone"],
              ["統編", "taxId"],
              ["備註", "notes"],
            ].map(([label, key]) => (
              <tr key={String(key)} className="border-b last:border-0">
                <th className="w-40 bg-gray-50 px-3 py-2 text-left font-medium">{label}</th>
                <td className="px-3 py-2">
                  <InlineEditableField
                    value={profile[key as keyof typeof profile] || ""}
                    onSave={async (value) => {
                      await patchTenant({ [key]: value || null });
                      setProfile((prev) => ({ ...prev, [key]: value }));
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">交屋 / 進駐時程</h2>
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-left">單位</th>
              <th className="px-2 py-1 text-left">狀態</th>
              <th className="px-2 py-1 text-left">起訖</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-2 py-1">{row.unitLabel}</td>
                <td className="px-2 py-1">{row.status}</td>
                <td className="px-2 py-1 text-xs">{row.startDate} ~ {row.endDate}</td>
              </tr>
            ))}
            {timeline.length === 0 && (
              <tr>
                <td className="px-2 py-4 text-center text-gray-500" colSpan={3}>尚無時程資料</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">租約連結 / PDF / 照片</h2>
        <form
          className="mb-3 grid gap-2 md:grid-cols-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setUploading(true);
            const form = new FormData(event.currentTarget);
            const leaseId = String(form.get("leaseId") || "");
            const file = form.get("file") as File | null;
            const kind = String(form.get("kind") || "OTHER");
            if (!leaseId || !file || !file.name) {
              setUploading(false);
              return;
            }
            const fileUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result || ""));
              reader.onerror = () => reject(new Error("讀檔失敗"));
              reader.readAsDataURL(file);
            });
            const res = await fetch(`/api/leases/${leaseId}/attachments`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileName: file.name, fileUrl, kind }),
            });
            const json = await res.json();
            if (json.ok) {
              setFiles((prev) => [
                {
                  id: json.data.id,
                  leaseId,
                  leaseLabel: leaseMap[leaseId] || leaseId.slice(0, 8),
                  fileName: json.data.fileName,
                  fileUrl: json.data.fileUrl,
                  kind: json.data.kind,
                },
                ...prev,
              ]);
              event.currentTarget.reset();
            }
            setUploading(false);
          }}
        >
          <select name="leaseId" className="rounded border px-2 py-1 text-sm" required>
            <option value="">選租約</option>
            {leases.map((lease) => (
              <option key={lease.id} value={lease.id}>{lease.period}</option>
            ))}
          </select>
          <select name="kind" className="rounded border px-2 py-1 text-sm">
            <option value="CONTRACT">PDF 合約</option>
            <option value="IMAGE">照片</option>
            <option value="OTHER">其他</option>
          </select>
          <input name="file" type="file" className="rounded border px-2 py-1 text-sm md:col-span-2" required />
          <button disabled={uploading} className="rounded border px-2 py-1 text-sm">{uploading ? "上傳中" : "上傳"}</button>
        </form>

        <div className="space-y-1 text-sm">
          {files.map((file) => (
            <div key={file.id} className="rounded border px-2 py-1">
              [{file.kind}] {file.leaseLabel} - <a href={file.fileUrl} className="underline" target="_blank">{file.fileName}</a>
            </div>
          ))}
          {files.length === 0 && <div className="text-gray-500">尚無附件</div>}
        </div>
      </section>
    </div>
  );
}
