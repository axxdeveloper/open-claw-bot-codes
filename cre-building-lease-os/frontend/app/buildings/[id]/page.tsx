"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function BuildingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/buildings/${id}`).then((r) => r.ok && setData(r.data));
  }, [id]);

  if (!id) return null;

  return (
    <main className="grid">
      <h1>{data?.name || "Building"}</h1>
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <Link className="card" href={`/buildings/${id}/floors`}>Floors</Link>
        <Link className="card" href={`/buildings/${id}/tenants`}>Tenants</Link>
        <Link className="card" href={`/buildings/${id}/leases`}>Leases</Link>
        <Link className="card" href={`/buildings/${id}/owners`}>Owners</Link>
        <Link className="card" href={`/buildings/${id}/common-areas`}>Common Areas</Link>
        <Link className="card" href={`/buildings/${id}/repairs`}>Repairs</Link>
        <Link className="card" href={`/buildings/${id}/stacking`}>Stacking</Link>
      </div>
    </main>
  );
}
