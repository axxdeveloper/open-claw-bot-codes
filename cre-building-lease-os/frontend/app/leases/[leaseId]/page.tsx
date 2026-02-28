"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function LeaseDetailPage() {
  const params = useParams<{ leaseId: string }>();
  const leaseId = params.leaseId;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
    const fd = new FormData(e.currentTarget);
    const r = await apiFetch(`/leases/${leaseId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: String(fd.get("status") || "DRAFT") }),
    });
    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }
    load(leaseId);
  };

  if (!leaseId || !data) {
    return <main className="page">{error ? <div className="errorBox">{error}</div> : null}</main>;
  }

  return (
    <main className="page">
      <div className="card">
        <h1>Lease {leaseId.slice(0, 8)}</h1>
        <div className="row" style={{ marginTop: 8 }}>
          <span className="badge">Status: {data.lease.status}</span>
          <span className="muted">
            Period: {data.lease.startDate} ~ {data.lease.endDate}
          </span>
        </div>
        <p className="muted">Effective management fee: {data.effectiveManagementFee ?? "-"}</p>
      </div>

      <form className="card row" onSubmit={patch} aria-label="update-lease-status-form">
        <select name="status" defaultValue={data.lease.status}>
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="TERMINATED">TERMINATED</option>
        </select>
        <button type="submit">Update</button>
      </form>

      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Occupancies</h3>
        {(data.occupancies || []).map((o: any) => (
          <div key={o.id} className="row" style={{ justifyContent: "space-between" }}>
            <span>{o.unitId}</span>
            <span className="badge">{o.status}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
