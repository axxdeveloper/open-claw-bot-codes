"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateVendorForm({ buildingId }: { buildingId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      contactName: String(form.get("contactName") || "") || undefined,
      contactPhone: String(form.get("contactPhone") || "") || undefined,
      contactEmail: String(form.get("contactEmail") || "") || undefined,
      notes: String(form.get("notes") || "") || undefined,
    };

    const res = await fetch(`/api/buildings/${buildingId}/vendors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!json.ok) {
      setError(json.error?.message ?? "新增廠商失敗");
      return;
    }

    e.currentTarget.reset();
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-2 rounded border bg-white p-3 md:grid-cols-4">
      <input name="name" placeholder="廠商名稱" className="rounded border px-2 py-1 text-sm" required />
      <input name="contactName" placeholder="聯絡人" className="rounded border px-2 py-1 text-sm" />
      <input name="contactPhone" placeholder="電話" className="rounded border px-2 py-1 text-sm" />
      <input name="contactEmail" placeholder="Email" className="rounded border px-2 py-1 text-sm" />
      <input name="notes" placeholder="備註" className="rounded border px-2 py-1 text-sm md:col-span-4" />
      {error && <p className="text-sm text-red-600 md:col-span-4">{error}</p>}
      <button className="rounded border px-2 py-1 text-sm md:col-span-4">新增廠商</button>
    </form>
  );
}
