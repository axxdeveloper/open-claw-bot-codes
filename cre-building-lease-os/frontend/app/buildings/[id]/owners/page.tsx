"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function OwnersPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [owners, setOwners] = useState<any[]>([]);

  const load = (bid: string) => apiFetch<any[]>(`/buildings/${bid}/owners`).then((r) => r.ok && setOwners(r.data));

  useEffect(() => {
    if (!id) return;
    load(id);
  }, [id]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await apiFetch(`/buildings/${id}/owners`, {
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
    load(id);
  };

  if (!id) return null;

  return (
    <main className="grid">
      <h1>Owners</h1>
      <form className="card" onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input name="name" placeholder="name" required />
        <input name="taxId" placeholder="taxId" />
        <input name="contactName" placeholder="contact name" />
        <input name="contactPhone" placeholder="phone" />
        <input name="contactEmail" placeholder="email" />
        <textarea name="notes" placeholder="notes" />
        <button>Add Owner</button>
      </form>
      <div className="card">
        {owners.map((o) => (
          <div key={o.id}>{o.name} / {o.contactName || "-"}</div>
        ))}
      </div>
    </main>
  );
}
