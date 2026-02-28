"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function FloorsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [floors, setFloors] = useState<any[]>([]);

  const load = (bid: string) =>
    apiFetch<any[]>(`/buildings/${bid}/floors`).then((r) => r.ok && setFloors(r.data));

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  const regenerate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await apiFetch(`/buildings/${id}/floors/generate`, {
      method: "POST",
      body: JSON.stringify({
        basementFloors: Number(fd.get("basementFloors") || 5),
        aboveGroundFloors: Number(fd.get("aboveGroundFloors") || 20),
      }),
    });
    load(id);
  };

  if (!id) return null;

  return (
    <main className="grid">
      <h1>Floors</h1>
      <form className="card" onSubmit={regenerate} style={{ display: "flex", gap: 8 }}>
        <input name="basementFloors" defaultValue={5} type="number" />
        <input name="aboveGroundFloors" defaultValue={20} type="number" />
        <button>Generate</button>
      </form>
      <div className="card">
        <table className="table">
          <thead><tr><th>Label</th><th>Sort</th></tr></thead>
          <tbody>
            {floors.map((f) => (
              <tr key={f.id}>
                <td><Link href={`/buildings/${id}/floors/${f.id}`}>{f.label}</Link></td>
                <td>{f.sortIndex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
