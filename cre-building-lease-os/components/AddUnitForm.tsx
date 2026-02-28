"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AddUnitForm({ floorId }: { floorId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      code: String(form.get("code") || ""),
      grossArea: Number(form.get("grossArea") || 0),
      netArea: form.get("netArea") ? Number(form.get("netArea")) : null,
      balconyArea: form.get("balconyArea") ? Number(form.get("balconyArea")) : null,
    };

    const res = await fetch(`/api/floors/${floorId}/units`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.ok) {
      setError(json.error?.message ?? "新增單位失敗");
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  };

  return (
    <form className="grid gap-2 rounded border bg-white p-4 md:grid-cols-5" onSubmit={onSubmit}>
      <input name="code" placeholder="單位代號" className="rounded border px-3 py-2" required />
      <input name="grossArea" type="number" step="0.01" placeholder="G 坪" className="rounded border px-3 py-2" required />
      <input name="netArea" type="number" step="0.01" placeholder="N 坪" className="rounded border px-3 py-2" />
      <input name="balconyArea" type="number" step="0.01" placeholder="陽台坪" className="rounded border px-3 py-2" />
      <button className="rounded bg-black px-3 py-2 text-white">新增單位</button>
      {error && <p className="text-sm text-red-600 md:col-span-5">{error}</p>}
    </form>
  );
}
