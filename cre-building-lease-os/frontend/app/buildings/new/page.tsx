"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function NewBuildingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const payload = {
      name: String(fd.get("name") || ""),
      code: String(fd.get("code") || "") || null,
      address: String(fd.get("address") || "") || null,
      managementFee: fd.get("managementFee") ? Number(fd.get("managementFee")) : null,
    };

    const r = await apiFetch<any>("/buildings", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      setError(r.error.message);
      return;
    }

    await apiFetch(`/buildings/${r.data.id}/floors/generate`, {
      method: "POST",
      body: JSON.stringify({ basementFloors: 5, aboveGroundFloors: 20 }),
    });

    router.push(`/buildings/${r.data.id}/floors`);
  };

  return (
    <main className="card">
      <h1>Create Building</h1>
      <form onSubmit={onSubmit} className="grid">
        <input name="name" placeholder="name" required />
        <input name="code" placeholder="code" />
        <input name="address" placeholder="address" />
        <input name="managementFee" type="number" step="0.01" placeholder="management fee" />
        {error && <div style={{ color: "red" }}>{error}</div>}
        <button type="submit">Create</button>
      </form>
    </main>
  );
}
