"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function LeaseDetailPage() {
  const params = useParams<{ leaseId: string }>();
  const leaseId = params.leaseId;
  const [data, setData] = useState<any>(null);

  const load = (id: string) => apiFetch<any>(`/leases/${id}`).then((r) => r.ok && setData(r.data));

  useEffect(() => {
    if (!leaseId) return;
    load(leaseId);
  }, [leaseId]);

  const patch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await apiFetch(`/leases/${leaseId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: String(fd.get("status") || "DRAFT") }),
    });
    load(leaseId);
  };

  if (!leaseId || !data) return null;

  return (
    <main className="grid">
      <h1>Lease {leaseId.slice(0,8)}</h1>
      <div className="card">
        <div>Status: {data.lease.status}</div>
        <div>Period: {data.lease.startDate} ~ {data.lease.endDate}</div>
        <div>Effective management fee: {data.effectiveManagementFee ?? "-"}</div>
      </div>
      <form className="card" onSubmit={patch} style={{ display: "flex", gap: 8 }}>
        <select name="status" defaultValue={data.lease.status}>
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="TERMINATED">TERMINATED</option>
        </select>
        <button>Update</button>
      </form>
      <div className="card">
        <b>Occupancies</b>
        {(data.occupancies || []).map((o: any) => <div key={o.id}>{o.unitId} / {o.status}</div>)}
      </div>
    </main>
  );
}
