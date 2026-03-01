"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader, SectionBlock, StatusChip } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

function statusLabel(status: string) {
  if (status === "ACTIVE") return "啟用";
  if (status === "TERMINATED") return "已終止";
  return "草稿";
}

function isImageAttachment(file: any) {
  const ct = String(file?.contentType || "").toLowerCase();
  if (ct.startsWith("image/")) return true;
  const name = String(file?.fileName || "").toLowerCase();
  return /\.(jpg|jpeg|png|webp|gif|heic|heif)$/.test(name);
}

export default function LeaseDetailPage() {
  const params = useParams<{ leaseId: string }>();
  const leaseId = params.leaseId;

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  const load = async (id: string) => {
    const r = await apiFetch<any>(`/leases/${id}`);
    if (r.ok) setData(r.data);
    else setError(apiErrorMessage(r.error));

    const a = await fetch(`/api/lease-attachments/${id}`, { credentials: "include" })
      .then((x) => x.json())
      .catch(() => ({ ok: false, data: [] }));
    setAttachments(a?.ok && Array.isArray(a?.data) ? a.data : []);
  };

  useEffect(() => {
    if (!leaseId) return;
    load(leaseId);
  }, [leaseId]);

  const patch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData(e.currentTarget);
    const r = await apiFetch(`/leases/${leaseId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: String(fd.get("status") || "DRAFT") }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    setSuccess("租約狀態已更新。");
    load(leaseId);
  };

  const uploadAttachments = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);

        const resp = await fetch(`/api/lease-attachments/${leaseId}`, {
          method: "POST",
          body: fd,
          credentials: "include",
        });

        const json = await resp.json().catch(() => ({}));
        if (!resp.ok || !json?.ok) {
          throw new Error(json?.error?.message || `上傳失敗：${file.name}`);
        }
      }

      setSuccess("附件已上傳");
      await load(leaseId);
    } catch (e: any) {
      setError(e?.message || "附件上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  if (!leaseId || !data) {
    return <main className="page">{error ? <div className="errorBox">{error}</div> : null}</main>;
  }

  const status = String(data.lease.status || "DRAFT");

  return (
    <main className="page">
      <PageHeader
        title={`租約詳情｜${leaseId.slice(0, 8)}`}
        description={`租期：${data.lease.startDate} ~ ${data.lease.endDate}`}
        action={<Link href={`/buildings/${data.lease.buildingId}/leases`} className="btn secondary">回租約清單</Link>}
      />


      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <SectionBlock title="租約附件（PDF / 照片）" description="可上傳合約檔、簽約現場照片、交屋點交照片；支援一次多檔上傳。">
        <div className="grid" style={{ gap: 10 }}>
          <label>
            上傳檔案
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => uploadAttachments(e.target.files)}
              disabled={uploading}
            />
          </label>
          <span className="muted">{uploading ? "上傳中..." : "支援 PDF 與照片（可多選）"}</span>

          {attachments.length === 0 ? (
            <div className="muted">尚無附件</div>
          ) : (
            <>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                {attachments.map((file: any) => (
                  <a key={file.id} href={file.fileUrl} target="_blank" className="badge" rel="noreferrer">
                    {file.fileName}
                  </a>
                ))}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: 10,
                }}
              >
                {attachments
                  .filter((file: any) => isImageAttachment(file))
                  .map((file: any) => (
                    <a key={`preview-${file.id}`} href={file.fileUrl} target="_blank" rel="noreferrer" className="card" style={{ padding: 6 }}>
                      <img src={file.fileUrl} alt={file.fileName} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 8 }} />
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{file.fileName}</div>
                    </a>
                  ))}
              </div>
            </>
          )}
        </div>
      </SectionBlock>

      <SectionBlock title="狀態調整" description="變更後會影響入住狀態與後續作業，請確認後送出。">
        <div className="muted" style={{ marginBottom: 8 }}>目前狀態：{statusLabel(status)}</div>
        <form className="row" onSubmit={patch} aria-label="update-lease-status-form">
          <select name="status" defaultValue={status}>
            <option value="DRAFT">草稿</option>
            <option value="ACTIVE">啟用</option>
            <option value="TERMINATED">終止</option>
          </select>
          <button type="submit">更新狀態</button>
        </form>
      </SectionBlock>

      <SectionBlock title="涉及單位與入住" description="此區塊可快速確認租約涵蓋範圍。">
        {(data.occupancies || []).map((o: any, idx: number) => (
          <div key={o.id} className="row" style={{ justifyContent: "space-between" }}>
            <span>單位 {idx + 1}</span>
            {o.status === "ACTIVE" ? (
              <StatusChip tone="active">啟用</StatusChip>
            ) : (
              <StatusChip tone="draft">草稿</StatusChip>
            )}
          </div>
        ))}
      </SectionBlock>
    </main>
  );
}
