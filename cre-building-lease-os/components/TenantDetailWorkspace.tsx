"use client";

import { ReactNode, useMemo, useState } from "react";
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
  breadcrumb?: ReactNode;
  header: {
    buildingName: string;
    tenantName: string;
    address: string;
    leaseStatus: string;
    areaLabel: string;
    unitSummary: string;
  };
  tenant: {
    id: string;
    name: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    taxId: string;
    notes: string;
  };
  leases: { id: string; period: string; status: string }[];
  attachments: LeaseAttachment[];
  timeline: TimelineRow[];
};

const PLACEHOLDER = "-";

export default function TenantDetailWorkspace({ buildingId, breadcrumb, header, tenant, leases, attachments, timeline }: Props) {
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

  const contacts = useMemo(() => {
    const rows = [
      {
        id: "primary",
        role: "主要聯絡人",
        name: profile.contactName || profile.name || PLACEHOLDER,
        phone: profile.contactPhone || PLACEHOLDER,
        email: profile.contactEmail || PLACEHOLDER,
      },
      {
        id: "finance",
        role: "財務 / 稅務",
        name: profile.name || PLACEHOLDER,
        phone: profile.contactPhone || PLACEHOLDER,
        email: profile.contactEmail || PLACEHOLDER,
      },
      {
        id: "ops",
        role: "現場 / 營運",
        name: profile.contactName || profile.name || PLACEHOLDER,
        phone: profile.contactPhone || PLACEHOLDER,
        email: PLACEHOLDER,
      },
    ];

    return rows.slice(0, 3);
  }, [profile]);

  const statusTone = (status: string) => {
    if (status === "ACTIVE") return "bg-green-50 text-green-700 border-green-200";
    if (status === "TERMINATED" || status === "ENDED") return "bg-gray-100 text-gray-600 border-gray-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-4 text-white md:p-5">
        <div className="mb-2 text-slate-200">{breadcrumb}</div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-300">租戶檔案</p>
              <h1 className="text-2xl font-semibold md:text-3xl">{header.tenantName || PLACEHOLDER}</h1>
              <p className="text-sm text-slate-200">{header.buildingName || PLACEHOLDER}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-400/50 bg-slate-600/50 px-3 py-1">地址：{header.address || PLACEHOLDER}</span>
              <span className="rounded-full border border-slate-400/50 bg-slate-600/50 px-3 py-1">面積：{header.areaLabel || PLACEHOLDER}</span>
              <span className={`rounded-full border px-3 py-1 ${statusTone(header.leaseStatus)}`}>租約：{header.leaseStatus || PLACEHOLDER}</span>
            </div>
          </div>
          <div className="flex gap-2 self-start">
            <button type="button" className="rounded-md border border-white/50 px-3 py-1.5 text-sm hover:bg-white/10">列印摘要</button>
            <button type="button" className="rounded-md border border-white/50 px-3 py-1.5 text-sm hover:bg-white/10">編輯租戶</button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <article className="rounded-xl border bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">單位資訊</h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <InfoItem label="大樓" value={header.buildingName} />
              <InfoItem label="租用單位" value={header.unitSummary} />
              <InfoItem label="目前租約狀態" value={header.leaseStatus} />
              <InfoItem label="管理範圍面積" value={header.areaLabel} />
            </div>
            <div className="mt-4 rounded-lg border bg-slate-50 p-3">
              <h3 className="mb-2 text-sm font-medium">交屋 / 進駐時程</h3>
              <table className="w-full text-sm">
                <thead className="border-b">
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
            </div>
          </article>

          <article className="rounded-xl border bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">租戶資料</h2>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["公司名稱", "name"],
                  ["聯絡人", "contactName"],
                  ["電子郵件", "contactEmail"],
                  ["電話", "contactPhone"],
                  ["統編", "taxId"],
                  ["備註", "notes"],
                ].map(([label, key]) => (
                  <tr key={String(key)} className="border-b last:border-0">
                    <th className="w-36 bg-gray-50 px-3 py-2 text-left font-medium">{label}</th>
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
          </article>

          <article className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">文件與媒體</h2>
              <span className="text-xs text-gray-500">綁定大樓：{buildingId.slice(0, 8)}</span>
            </div>

            <form
              className="mb-4 grid gap-2 md:grid-cols-5"
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
                  <option key={lease.id} value={lease.id}>{lease.period} ({lease.status})</option>
                ))}
              </select>
              <select name="kind" className="rounded border px-2 py-1 text-sm">
                <option value="CONTRACT">PDF 合約</option>
                <option value="IMAGE">照片</option>
                <option value="OTHER">其他</option>
              </select>
              <input name="file" type="file" className="rounded border px-2 py-1 text-sm md:col-span-2" required />
              <button disabled={uploading} className="rounded border px-2 py-1 text-sm">{uploading ? "上傳中" : "上傳檔案"}</button>
            </form>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {files.map((file) => {
                const imageLike = file.kind === "IMAGE" || file.fileUrl.startsWith("data:image");
                return (
                  <a key={file.id} href={file.fileUrl} target="_blank" className="rounded-lg border p-2 hover:bg-slate-50">
                    <div className="mb-2 h-24 overflow-hidden rounded bg-slate-100">
                      {imageLike ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={file.fileUrl} alt={file.fileName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-500">{file.kind}</div>
                      )}
                    </div>
                    <p className="line-clamp-1 text-sm font-medium">{file.fileName}</p>
                    <p className="text-xs text-gray-500">{file.leaseLabel}</p>
                  </a>
                );
              })}
            </div>
            {files.length === 0 && <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">尚無附件，請先上傳租約或照片。</div>}
          </article>
        </div>

        <div className="space-y-4">
          <article className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">聯絡人清單</h2>
              <button type="button" className="rounded border px-2 py-1 text-xs">新增聯絡人</button>
            </div>
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div key={contact.id} className="rounded-lg border bg-slate-50 p-3 text-sm">
                  <p className="text-xs text-gray-500">{contact.role}</p>
                  <p className="font-medium">{contact.name || PLACEHOLDER}</p>
                  <p className="text-xs text-gray-600">{contact.phone || PLACEHOLDER}</p>
                  <p className="text-xs text-gray-600">{contact.email || PLACEHOLDER}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">快捷操作</h2>
            <div className="grid gap-2 text-sm">
              <button type="button" className="rounded border px-3 py-2 text-left hover:bg-slate-50">+ 建立追蹤事項（即將推出）</button>
              <button type="button" className="rounded border px-3 py-2 text-left hover:bg-slate-50">+ 匯出租戶摘要（即將推出）</button>
              <button type="button" className="rounded border px-3 py-2 text-left hover:bg-slate-50">+ 發送聯絡提醒（即將推出）</button>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium">{value || PLACEHOLDER}</p>
    </div>
  );
}
