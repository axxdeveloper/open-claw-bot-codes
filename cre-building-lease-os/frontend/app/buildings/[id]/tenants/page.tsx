"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function TenantsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [rows, setRows] = useState<any[]>([]);

  const load = (bid: string) => apiFetch<any[]>(`/buildings/${bid}/tenants`).then((r) => r.ok && setRows(r.data));

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await apiFetch(`/buildings/${id}/tenants`, {
      method: "POST",
      body: JSON.stringify({
        name: String(fd.get("name") || ""),
        taxId: String(fd.get("taxId") || "") || null,
        contactName: String(fd.get("contactName") || "") || null,
        contactPhone: String(fd.get("contactPhone") || "") || null,
        contactEmail: String(fd.get("contactEmail") || "") || null,
      }),
    });
    load(id);
  };

  if (!id) return null;

  return (
    <main className="grid">
      <h1>Tenants</h1>
      <form className="card" onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input name="name" placeholder="name" required />
        <input name="taxId" placeholder="tax id" />
        <input name="contactName" placeholder="contact" />
        <input name="contactPhone" placeholder="phone" />
        <input name="contactEmail" placeholder="email" />
        <button>Add Tenant</button>
      </form>
      <div className="card">
        {rows.map((t) => (
          <div key={t.id}>{t.name} ({t.id})</div>
        ))}
      </div>
    </main>
  );
}
