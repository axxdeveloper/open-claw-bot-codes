"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function CommonAreasPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [areas, setAreas] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);

  const load = async (bid: string) => {
    const [a, f] = await Promise.all([
      apiFetch<any[]>(`/buildings/${bid}/common-areas`),
      apiFetch<any[]>(`/buildings/${bid}/floors`),
    ]);
    if (a.ok) setAreas(a.data);
    if (f.ok) setFloors(f.data);
  };

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  const createArea = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await apiFetch(`/buildings/${id}/common-areas`, {
      method: "POST",
      body: JSON.stringify({
        name: String(fd.get("name") || ""),
        code: String(fd.get("code") || "") || null,
        floorId: String(fd.get("floorId") || "") || null,
      }),
    });
    load(id);
  };

  if (!id) return null;

  return (
    <main className="grid">
      <h1>Common Areas</h1>
      <form className="card" onSubmit={createArea} style={{ display: "flex", gap: 8 }}>
        <input name="name" placeholder="name" required />
        <input name="code" placeholder="code" />
        <select name="floorId">
          <option value="">(none)</option>
          {floors.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
        <button>Create</button>
      </form>
      <div className="card">
        {areas.map((a) => (
          <div key={a.id}>
            <Link href={`/buildings/${id}/common-areas/${a.id}`}>{a.name}</Link>
          </div>
        ))}
      </div>
    </main>
  );
}
