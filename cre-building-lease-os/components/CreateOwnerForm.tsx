"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateOwnerForm({ buildingId }: { buildingId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      taxId: String(form.get("taxId") || "") || undefined,
      contactName: String(form.get("contactName") || "") || undefined,
      contactEmail: String(form.get("contactEmail") || "") || undefined,
      contactPhone: String(form.get("contactPhone") || "") || undefined,
      notes: String(form.get("notes") || "") || undefined,
    };

    const res = await fetch(`/api/buildings/${buildingId}/owners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!json.ok) {
      setError(json.error?.message ?? "新增業主失敗");
      return;
    }

    e.currentTarget.reset();
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-2 rounded border bg-white p-4 md:grid-cols-3">
      <input name="name" placeholder="業主名稱" className="rounded border px-3 py-2" required />
      <input name="taxId" placeholder="統編" className="rounded border px-3 py-2" />
      <input name="contactName" placeholder="聯絡人" className="rounded border px-3 py-2" />
      <input name="contactEmail" placeholder="Email" className="rounded border px-3 py-2" />
      <input name="contactPhone" placeholder="電話" className="rounded border px-3 py-2" />
      <input name="notes" placeholder="備註" className="rounded border px-3 py-2" />
      {error && <p className="text-sm text-red-600 md:col-span-3">{error}</p>}
      <button className="rounded bg-black px-3 py-2 text-white md:col-span-3">新增業主</button>
    </form>
  );
}
