"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function LeasesPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [leases, setLeases] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async (bid: string) => {
    const [ls, ts, fs] = await Promise.all([
      apiFetch<any[]>(`/buildings/${bid}/leases`),
      apiFetch<any[]>(`/buildings/${bid}/tenants`),
      apiFetch<any[]>(`/buildings/${bid}/floors`),
    ]);

    if (ls.ok) setLeases(ls.data);
    if (ts.ok) setTenants(ts.data);

    if (fs.ok) {
      const floorData = await Promise.all(fs.data.map((f: any) => apiFetch<any>(`/floors/${f.id}`)));
      const allUnits = floorData
        .filter((x) => x.ok)
        .flatMap((x) => x.data.units || [])
        .map((u: any) => ({ id: u.id, code: u.code }));
      setUnits(allUnits);
    }
  };

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (selected.length === 0) {
      setError("請至少勾選一個租賃單位");
      return;
    }

    const fd = new FormData(e.currentTarget);

    const result = await apiFetch<any>(`/leases`, {
      method: "POST",
      body: JSON.stringify({
        buildingId: id,
        tenantId: String(fd.get("tenantId") || ""),
        unitIds: selected,
        status: String(fd.get("status") || "ACTIVE"),
        startDate: String(fd.get("startDate") || ""),
        endDate: String(fd.get("endDate") || ""),
        managementFee: fd.get("managementFee") ? Number(fd.get("managementFee")) : null,
      }),
    });

    if (!result.ok) {
      setError(apiErrorMessage(result.error));
      return;
    }

    setSuccess("租約已建立");
    setSelected([]);
    load(id);
  };

  if (!id) return null;

  return (
    <main className="page">
      <div className="card">
        <h1>Leases</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          建立 ACTIVE 租約會自動把對應 DRAFT occupancy 轉為 ACTIVE。
        </p>
      </div>

      {error && <div className="errorBox">{error}</div>}
      {success && <div className="successBox">{success}</div>}

      <form className="card grid" onSubmit={onSubmit} aria-label="create-lease-form">
        <label>
          Tenant
          <select name="tenantId" required>
            <option value="">tenant</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <div className="row">
          <label>
            Start Date
            <input name="startDate" type="date" required />
          </label>
          <label>
            End Date
            <input name="endDate" type="date" required />
          </label>
          <label>
            Status
            <select name="status" defaultValue="ACTIVE">
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
            </select>
          </label>
          <label>
            Management Fee
            <input name="managementFee" type="number" step="0.01" placeholder="fee" />
          </label>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))" }}>
          {units.map((u) => (
            <label key={u.id} className="card" style={{ padding: 8, boxShadow: "none" }}>
              <input
                type="checkbox"
                checked={selected.includes(u.id)}
                onChange={() =>
                  setSelected((prev) =>
                    prev.includes(u.id) ? prev.filter((x) => x !== u.id) : [...prev, u.id],
                  )
                }
              />{" "}
              {u.code}
            </label>
          ))}
        </div>
        <button type="submit">Create Lease</button>
      </form>

      <div className="card">
        {leases.length === 0 ? (
          <div className="muted">尚無租約</div>
        ) : (
          leases.map((x: any) => (
            <div key={x.lease.id} className="row" style={{ justifyContent: "space-between" }}>
              <Link href={`/leases/${x.lease.id}`}>{x.lease.id.slice(0, 8)}</Link>
              <span className="badge">{x.lease.status}</span>
              <span className="muted">fee={x.effectiveManagementFee ?? "-"}</span>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
