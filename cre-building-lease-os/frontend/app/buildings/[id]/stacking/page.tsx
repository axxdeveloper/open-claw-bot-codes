"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function StackingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    (async () => {
      const floorsRes = await apiFetch<any[]>(`/buildings/${id}/floors`);
      if (!floorsRes.ok) return;

      const list: any[] = [];
      for (const f of floorsRes.data.slice().reverse()) {
        const detail = await apiFetch<any>(`/floors/${f.id}`);
        if (!detail.ok) continue;
        list.push({
          floor: f.label,
          units: detail.data.units || [],
        });
      }
      setRows(list);
    })();
  }, [id]);

  return (
    <main className="grid">
      <h1>Stacking (list)</h1>
      {rows.map((row) => (
        <div className="card" key={row.floor}>
          <b>{row.floor}</b>
          <div>{row.units.map((u: any) => u.code).join(", ") || "-"}</div>
        </div>
      ))}
    </main>
  );
}
