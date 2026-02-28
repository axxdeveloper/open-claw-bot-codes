"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Building = { id: string; name: string; address?: string };

export default function BuildingsPage() {
  const [items, setItems] = useState<Building[]>([]);

  useEffect(() => {
    apiFetch<Building[]>("/buildings").then((r) => {
      if (r.ok) setItems(r.data);
    });
  }, []);

  return (
    <main className="grid">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Buildings</h1>
        <Link href="/buildings/new">+ New</Link>
      </div>
      {items.map((b) => (
        <Link key={b.id} href={`/buildings/${b.id}`} className="card">
          <b>{b.name}</b>
          <div style={{ color: "#666" }}>{b.address || "-"}</div>
        </Link>
      ))}
      {items.length === 0 && <div className="card">No data</div>}
    </main>
  );
}
