"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function OwnersPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [owners, setOwners] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async (bid: string) => {
    const r = await apiFetch<any[]>(`/buildings/${bid}/owners`);
    if (r.ok) setOwners(r.data);
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
    const r = await apiFetch(`/buildings/${id}/owners`, {
      method: "POST",
      body: JSON.stringify({
        name: String(fd.get("name") || ""),
        taxId: String(fd.get("taxId") || "") || null,
        contactName: String(fd.get("contactName") || "") || null,
        contactPhone: String(fd.get("contactPhone") || "") || null,
        contactEmail: String(fd.get("contactEmail") || "") || null,
        notes: String(fd.get("notes") || "") || null,
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
      <h1>Owners</h1>
      <form className="card grid" onSubmit={onSubmit} aria-label="create-owner-form">
        <input name="name" placeholder="name" required />
        <input name="taxId" placeholder="taxId" />
        <input name="contactName" placeholder="contact name" />
        <input name="contactPhone" placeholder="phone" />
        <input name="contactEmail" placeholder="email" />
        <textarea name="notes" placeholder="notes" />
        <button type="submit">Add Owner</button>
      </form>

      {error && <div className="errorBox">{error}</div>}

      <div className="card">
        {owners.map((o) => (
          <div key={o.id} className="row" style={{ justifyContent: "space-between" }}>
            <span>{o.name}</span>
            <span className="muted">{o.contactName || "-"}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
