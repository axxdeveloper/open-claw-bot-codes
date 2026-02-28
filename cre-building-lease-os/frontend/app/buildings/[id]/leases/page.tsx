"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function LeasesPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [leases, setLeases] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const load = async (bid: string) => {
    const [ls, ts, fs] = await Promise.all([
      apiFetch<any[]>(`/buildings/${bid}/leases`),
      apiFetch<any[]>(`/buildings/${bid}/tenants`),
      apiFetch<any[]>(`/buildings/${bid}/floors`),
    ]);

    if (ls.ok) setLeases(ls.data);
    if (ts.ok) setTenants(ts.data);

    if (fs.ok) {
      const floorData = await Promise.all(
        fs.data.map((f: any) => apiFetch<any>(`/floors/${f.id}`)),
      );
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

    if (!result.ok) alert(result.error.message);
    else load(id);
  };

  if (!id) return null;

  return (
    <main className="grid">
      <h1>Leases</h1>
      <form className="card grid" onSubmit={onSubmit}>
        <select name="tenantId" required>
          <option value="">tenant</option>
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8 }}>
          <input name="startDate" type="date" required />
          <input name="endDate" type="date" required />
          <select name="status" defaultValue="ACTIVE">
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
          </select>
          <input name="managementFee" type="number" step="0.01" placeholder="fee" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {units.map((u) => (
            <label key={u.id}>
              <input
                type="checkbox"
                checked={selected.includes(u.id)}
                onChange={() => setSelected((prev) => prev.includes(u.id) ? prev.filter((x) => x !== u.id) : [...prev, u.id])}
              /> {u.code}
            </label>
          ))}
        </div>
        <button>Create Lease</button>
      </form>

      <div className="card">
        {leases.map((x: any) => (
          <div key={x.lease.id}>
            <Link href={`/leases/${x.lease.id}`}>{x.lease.id.slice(0,8)}</Link>
            {" "} / {x.lease.status} / fee={x.effectiveManagementFee ?? "-"}
          </div>
        ))}
      </div>
    </main>
  );
}
