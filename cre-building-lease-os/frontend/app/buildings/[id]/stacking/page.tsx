"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import HeroBanner from "@/components/HeroBanner";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function StackingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      const [floorsRes, tenantsRes, occRes] = await Promise.all([
        apiFetch<any[]>(`/buildings/${id}/floors`),
        apiFetch<any[]>(`/buildings/${id}/tenants`),
        apiFetch<any[]>(`/buildings/${id}/occupancies`),
      ]);

      if (!floorsRes.ok) {
        setError(apiErrorMessage(floorsRes.error));
        return;
      }

      const tenantsById = new Map<string, string>();
      if (tenantsRes.ok) {
        for (const t of tenantsRes.data) tenantsById.set(t.id, t.name);
      }

      const occByUnit = new Map<string, any>();
      if (occRes.ok) {
        for (const o of occRes.data) {
          const prev = occByUnit.get(o.unitId);
          if (!prev || prev.status !== "ACTIVE") {
            occByUnit.set(o.unitId, o);
          }
        }
      }

      const list: any[] = [];
      for (const f of floorsRes.data.slice().reverse()) {
        const detail = await apiFetch<any>(`/floors/${f.id}`);
        if (!detail.ok) continue;

        const units = (detail.data.units || []).map((u: any) => {
          const occ = occByUnit.get(u.id);
          const tenantName = occ?.tenantId ? tenantsById.get(occ.tenantId) : null;
          return {
            ...u,
            occupancyStatus: occ?.status || null,
            tenantName: tenantName || null,
          };
        });

        list.push({ floor: f.label, units });
      }
      setRows(list);
    })();
  }, [id]);

  if (!id) return null;

  return (
    <main className="page">
      <HeroBanner
        image="/brand/hero-office.jpg"
        title="Stacking / 樓層租用總覽"
        subtitle="由高樓層往下快速檢視單位與 occupancy 現況。"
        chips={["Real-time occupancy", "Tenant visibility"]}
      />

      {error && <div className="errorBox">{error}</div>}

      {rows.map((row) => (
        <div className="card" key={row.floor}>
          <h3 style={{ marginBottom: 8 }}>{row.floor}</h3>
          {row.units.length === 0 ? (
            <div className="muted">尚無單位</div>
          ) : (
            row.units.map((u: any) => (
              <div className="row" key={u.id} style={{ justifyContent: "space-between" }}>
                <span>
                  <b>{u.code}</b>
                  {u.tenantName ? ` — ${u.tenantName}` : " — 空置"}
                </span>
                {u.occupancyStatus ? (
                  <span className="badge">{u.occupancyStatus}</span>
                ) : (
                  <span className="muted">N/A</span>
                )}
              </div>
            ))
          )}
        </div>
      ))}
    </main>
  );
}
