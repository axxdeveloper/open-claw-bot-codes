"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function FloorDetailPage() {
  const params = useParams<{ id: string; floorId: string }>();
  const id = params.id;
  const floorId = params.floorId;

  const [floor, setFloor] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [floorOwners, setFloorOwners] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);

  const load = async () => {
    const [f, t, o, fo, r] = await Promise.all([
      apiFetch<any>(`/floors/${floorId}`),
      apiFetch<any[]>(`/buildings/${id}/tenants`),
      apiFetch<any[]>(`/buildings/${id}/owners`),
      apiFetch<any[]>(`/floors/${floorId}/owners`),
      apiFetch<any[]>(`/buildings/${id}/repairs?floorId=${floorId}`),
    ]);

    if (f.ok) {
      setFloor(f.data.floor);
      setUnits(f.data.units || []);
    }
    if (t.ok) setTenants(t.data);
    if (o.ok) setOwners(o.data);
    if (fo.ok) setFloorOwners(fo.data);
    if (r.ok) setRepairs(r.data);
  };

  useEffect(() => {
    if (!id || !floorId) return;
    load();
  }, [id, floorId]);

  if (!id || !floorId) return null;

  const addUnit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await apiFetch(`/floors/${floorId}/units`, {
      method: "POST",
      body: JSON.stringify({
        code: String(fd.get("code") || ""),
        grossArea: Number(fd.get("grossArea") || 0),
        netArea: fd.get("netArea") ? Number(fd.get("netArea")) : null,
        balconyArea: fd.get("balconyArea") ? Number(fd.get("balconyArea")) : null,
      }),
    });
    load();
  };

  const assignOwner = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await apiFetch(`/floors/${floorId}/owners/assign`, {
      method: "POST",
      body: JSON.stringify({
        ownerId: String(fd.get("ownerId") || ""),
        sharePercent: Number(fd.get("sharePercent") || 0),
      }),
    });
    load();
  };

  const createRepair = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await apiFetch(`/repairs`, {
      method: "POST",
      body: JSON.stringify({
        buildingId: id,
        scopeType: "FLOOR",
        floorId,
        item: String(fd.get("item") || ""),
        vendorName: String(fd.get("vendorName") || ""),
        quoteAmount: Number(fd.get("quoteAmount") || 0),
        status: "DRAFT",
      }),
    });
    load();
  };

  const splitUnit = async (unitId: string) => {
    const p1 = prompt("part1 code,gross", "A1-1,50");
    const p2 = prompt("part2 code,gross", "A1-2,50");
    if (!p1 || !p2) return;
    const [c1, g1] = p1.split(",");
    const [c2, g2] = p2.split(",");
    await apiFetch(`/units/${unitId}/split`, {
      method: "POST",
      body: JSON.stringify({
        parts: [
          { code: c1.trim(), grossArea: Number(g1) },
          { code: c2.trim(), grossArea: Number(g2) },
        ],
      }),
    });
    load();
  };

  const assignDraftOccupancy = async (unitId: string) => {
    const tenantId = prompt("tenantId");
    if (!tenantId) return;
    await apiFetch(`/occupancies`, {
      method: "POST",
      body: JSON.stringify({
        buildingId: id,
        unitId,
        tenantId,
        status: "DRAFT",
      }),
    });
    alert("DRAFT occupancy created");
  };

  return (
    <main className="grid">
      <h1>Floor {floor?.label}</h1>

      <div className="card grid">
        <b>Floor Owners</b>
        <form onSubmit={assignOwner} style={{ display: "flex", gap: 8 }}>
          <select name="ownerId" required>
            <option value="">owner</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <input name="sharePercent" type="number" step="0.01" placeholder="share %" required />
          <button>Assign</button>
        </form>
        {floorOwners.map((fo) => (
          <div key={fo.id}>
            {fo.owner?.name || fo.ownerId} - {fo.sharePercent}%
            <button
              style={{ marginLeft: 8 }}
              onClick={async () => {
                await apiFetch(`/floor-owners/${fo.id}`, { method: "DELETE" });
                load();
              }}
            >
              delete
            </button>
          </div>
        ))}
      </div>

      <div className="card grid">
        <b>Floor Repairs</b>
        <form onSubmit={createRepair} style={{ display: "flex", gap: 8 }}>
          <input name="item" placeholder="item" required />
          <input name="vendorName" placeholder="vendor" required />
          <input name="quoteAmount" type="number" step="0.01" placeholder="quote" required />
          <button>Add</button>
        </form>
        {repairs.map((r) => (
          <div key={r.id}>{r.item} / {r.status} / {r.vendorName}</div>
        ))}
      </div>

      <form onSubmit={addUnit} className="card" style={{ display: "flex", gap: 8 }}>
        <input name="code" placeholder="code" required />
        <input name="grossArea" type="number" step="0.01" placeholder="gross" required />
        <input name="netArea" type="number" step="0.01" placeholder="net" />
        <input name="balconyArea" type="number" step="0.01" placeholder="balcony" />
        <button>Add Unit</button>
      </form>

      <div className="card">
        <table className="table">
          <thead><tr><th>Unit</th><th>Area</th><th>Actions</th></tr></thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id}>
                <td>{u.code}</td>
                <td>G {u.grossArea}</td>
                <td>
                  <button onClick={() => splitUnit(u.id)}>Split</button>
                  <button onClick={() => assignDraftOccupancy(u.id)} style={{ marginLeft: 8 }}>Assign DRAFT</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ fontSize: 12 }}>
        Tenant IDs for DRAFT assignment: {tenants.map((t) => `${t.name}:${t.id.slice(0,8)}`).join(" | ")}
      </div>
    </main>
  );
}
