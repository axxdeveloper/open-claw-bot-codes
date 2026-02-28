"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import HeroBanner from "@/components/HeroBanner";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function BuildingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/buildings/${id}`).then((r) => {
      if (r.ok) setData(r.data);
      else setError(apiErrorMessage(r.error));
    });
  }, [id]);

  if (!id) return null;

  return (
    <main className="page">
      <HeroBanner
        image="/brand/hero-lobby.jpg"
        title={data?.name || "Building"}
        subtitle={data?.address || "尚未填寫地址，請到基本資料補齊。"}
        chips={["Floors", "Tenants", "Leases", "Repairs"]}
      />

      {error && <div className="errorBox">{error}</div>}

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
        <Link className="card" href={`/buildings/${id}/floors`}>
          <h3>Floors</h3>
          <p className="muted">樓層與單位管理</p>
        </Link>
        <Link className="card" href={`/buildings/${id}/tenants`}>
          <h3>Tenants</h3>
          <p className="muted">租戶資料</p>
        </Link>
        <Link className="card" href={`/buildings/${id}/leases`}>
          <h3>Leases</h3>
          <p className="muted">租約管理</p>
        </Link>
        <Link className="card" href={`/buildings/${id}/owners`}>
          <h3>Owners</h3>
          <p className="muted">業主與持分</p>
        </Link>
        <Link className="card" href={`/buildings/${id}/common-areas`}>
          <h3>Common Areas</h3>
          <p className="muted">公共區域</p>
        </Link>
        <Link className="card" href={`/buildings/${id}/repairs`}>
          <h3>Repairs</h3>
          <p className="muted">修繕履歷</p>
        </Link>
        <Link className="card" href={`/buildings/${id}/stacking`}>
          <h3>Stacking</h3>
          <p className="muted">樓層盤點視圖</p>
        </Link>
      </div>
    </main>
  );
}
