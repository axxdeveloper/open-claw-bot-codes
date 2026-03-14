"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageHeader, SectionBlock, StatusChip, SummaryCards } from "@/components/TaskLayout";
import { apiErrorMessage, apiFetch } from "@/lib/api";

function statusLabel(status: string) {
  if (status === "ACTIVE") return "啟用";
  if (status === "TERMINATED") return "已終止";
  return "草稿";
}

export default function LeaseDetailPage() {
  const params = useParams<{ leaseId: string }>();
  const leaseId = params.leaseId;

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async (id: string) => {
    const r = await apiFetch<any>(`/leases/${id}`);
    if (r.ok) setData(r.data);
    else setError(apiErrorMessage(r.error));
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

  const summary = useMemo(() => {
    if (!data) {
      return {
        unitCount: 0,
        managementFee: "-",
      };
    }

    return {
      unitCount: (data.occupancies || []).length,
      managementFee: data.effectiveManagementFee ?? "-",
    };
  }, [data]);

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

      <SummaryCards
        items={[
          { label: "租約狀態", value: statusLabel(status), hint: "可在下方調整" },
          { label: "覆蓋單位", value: summary.unitCount, hint: "本租約包含單位數" },
          { label: "管理費", value: summary.managementFee, hint: "目前生效值" },
          { label: "風險", value: status === "TERMINATED" ? "需補位" : "正常", hint: "依狀態追蹤" },
        ]}
      />

      {error ? <div className="errorBox">{error}</div> : null}
      {success ? <div className="successBox">{success}</div> : null}

      <SectionBlock title="狀態調整" description="變更後會影響入住狀態與後續作業，請確認後送出。">
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
