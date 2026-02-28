"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function TenantsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async (bid: string) => {
    const r = await apiFetch<any[]>(`/buildings/${bid}/tenants`);
    if (r.ok) setRows(r.data);
    else setError(apiErrorMessage(r.error));
  };

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);
    const r = await apiFetch(`/buildings/${id}/tenants`, {
      method: "POST",
      body: JSON.stringify({
        name: String(fd.get("name") || ""),
        taxId: String(fd.get("taxId") || "") || null,
        contactName: String(fd.get("contactName") || "") || null,
        contactPhone: String(fd.get("contactPhone") || "") || null,
        contactEmail: String(fd.get("contactEmail") || "") || null,
      }),
    });

    if (!r.ok) {
      setError(apiErrorMessage(r.error));
      return;
    }

    (e.target as HTMLFormElement).reset();
    load(id);
  };

  if (!id) return null;

  return (
    <main className="page">
      <h1>Tenants</h1>
      <form className="card grid" onSubmit={onSubmit} aria-label="create-tenant-form">
        <input name="name" placeholder="name" required />
        <input name="taxId" placeholder="tax id" />
        <input name="contactName" placeholder="contact" />
        <input name="contactPhone" placeholder="phone" />
        <input name="contactEmail" placeholder="email" />
        <button type="submit">Add Tenant</button>
      </form>

      {error && <div className="errorBox">{error}</div>}

      <div className="card">
        {rows.map((t) => (
          <div key={t.id} className="row" style={{ justifyContent: "space-between" }}>
            <span>{t.name}</span>
            <span className="muted">{t.id}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
