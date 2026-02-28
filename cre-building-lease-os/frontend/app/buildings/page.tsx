"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HeroBanner from "@/components/HeroBanner";
import { apiFetch, apiErrorMessage } from "@/lib/api";

type Building = { id: string; name: string; address?: string };

export default function BuildingsPage() {
  const [items, setItems] = useState<Building[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Building[]>("/buildings").then((r) => {
      if (r.ok) setItems(r.data);
      else setError(apiErrorMessage(r.error));
    });
  }, []);

  return (
    <main className="page">
      <HeroBanner
        image="/brand/hero-building.jpg"
        title="商辦租賃總覽與營運儀表板"
        subtitle="以穩定、可維運的流程管理建物、樓層、租賃、修繕與業主管理。"
        chips={["Building Ops", "Lease", "Repairs", "Owners"]}
      />

      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>Buildings</h2>
        <Link href="/buildings/new" className="badge" aria-label="Create new building">
          + New Building
        </Link>
      </div>

      {error && <div className="errorBox">{error}</div>}

      {items.length === 0 ? (
        <div className="card muted">尚無資料，請先建立第一棟大樓。</div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
          {items.map((b) => (
            <Link key={b.id} href={`/buildings/${b.id}`} className="card">
              <h3>{b.name}</h3>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                {b.address || "尚未填寫地址"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
