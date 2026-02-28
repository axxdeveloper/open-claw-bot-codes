"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function RepairsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [rows, setRows] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  const load = async (bid: string, q = "") => {
    const [r, f, a, v] = await Promise.all([
      apiFetch<any[]>(`/buildings/${bid}/repairs${q}`),
      apiFetch<any[]>(`/buildings/${bid}/floors`),
      apiFetch<any[]>(`/buildings/${bid}/common-areas`),
      apiFetch<any[]>(`/buildings/${bid}/vendors`),
    ]);
    if (r.ok) setRows(r.data);
    if (f.ok) setFloors(f.data);
    if (a.ok) setAreas(a.data);
    if (v.ok) setVendors(v.data);
  };

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  const filter = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = new URLSearchParams();
    ["status", "scopeType", "floorId", "commonAreaId"].forEach((k) => {
      const v = String(fd.get(k) || "");
      if (v) q.set(k, v);
    });
    load(id, q.toString() ? `?${q.toString()}` : "");
  };

  const createVendor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await apiFetch(`/buildings/${id}/vendors`, {
      method: "POST",
      body: JSON.stringify({ name: String(fd.get("name") || "") }),
    });
    load(id);
  };

  const createRepair = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const scopeType = String(fd.get("scopeType") || "FLOOR");
    await apiFetch(`/repairs`, {
      method: "POST",
      body: JSON.stringify({
        buildingId: id,
        scopeType,
        floorId: scopeType === "FLOOR" ? String(fd.get("floorId") || "") || null : null,
        commonAreaId:
          scopeType === "COMMON_AREA" ? String(fd.get("commonAreaId") || "") || null : null,
        item: String(fd.get("item") || ""),
        vendorId: String(fd.get("vendorId") || "") || null,
        vendorName: String(fd.get("vendorName") || ""),
        quoteAmount: Number(fd.get("quoteAmount") || 0),
        status: String(fd.get("status") || "DRAFT"),
      }),
    });
    load(id);
  };

  if (!id) return null;

  return (
    <main className="grid">
      <h1>Repairs</h1>
      <form className="card" onSubmit={filter} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select name="status"><option value="">all status</option><option>DRAFT</option><option>QUOTED</option><option>APPROVED</option><option>IN_PROGRESS</option><option>COMPLETED</option><option>ACCEPTED</option><option>REJECTED</option></select>
        <select name="scopeType"><option value="">all scope</option><option value="FLOOR">FLOOR</option><option value="COMMON_AREA">COMMON_AREA</option></select>
        <select name="floorId"><option value="">all floor</option>{floors.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
        <select name="commonAreaId"><option value="">all common area</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <button>Filter</button>
      </form>

      <form className="card" onSubmit={createVendor} style={{ display: "flex", gap: 8 }}>
        <input name="name" placeholder="new vendor name" required />
        <button>Add Vendor</button>
      </form>

      <form className="card" onSubmit={createRepair} style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <select name="scopeType" defaultValue="FLOOR"><option value="FLOOR">FLOOR</option><option value="COMMON_AREA">COMMON_AREA</option></select>
          <select name="floorId"><option value="">floor</option>{floors.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
          <select name="commonAreaId"><option value="">common area</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input name="item" placeholder="item" required />
          <select name="vendorId"><option value="">vendor id (optional)</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
          <input name="vendorName" placeholder="vendor name" required />
          <input name="quoteAmount" type="number" step="0.01" placeholder="quote" required />
          <select name="status" defaultValue="DRAFT"><option>DRAFT</option><option>QUOTED</option><option>APPROVED</option><option>IN_PROGRESS</option><option>COMPLETED</option></select>
        </div>
        <button>Create Repair</button>
      </form>

      <div className="card">
        <table className="table">
          <thead><tr><th>Item</th><th>Scope</th><th>Vendor</th><th>Status</th><th>Quote</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}><td>{r.item}</td><td>{r.scopeType}</td><td>{r.vendorName}</td><td>{r.status}</td><td>{r.quoteAmount}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
