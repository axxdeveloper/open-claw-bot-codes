"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type FloorLite = { id: string; label: string };

export default function CreateCommonAreaForm({
  buildingId,
  floors,
}: {
  buildingId: string;
  floors: FloorLite[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const floorIdRaw = String(form.get("floorId") || "");

    const payload = {
      floorId: floorIdRaw || null,
      name: String(form.get("name") || ""),
      code: String(form.get("code") || "") || undefined,
      description: String(form.get("description") || "") || undefined,
      notes: String(form.get("notes") || "") || undefined,
    };

    const res = await fetch(`/api/buildings/${buildingId}/common-areas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!json.ok) {
      setError(json.error?.message ?? "新增公共區域失敗");
      return;
    }

    e.currentTarget.reset();
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-2 rounded border bg-white p-4 md:grid-cols-5">
      <input name="name" placeholder="公共區域名稱" className="rounded border px-3 py-2" required />
      <input name="code" placeholder="代碼" className="rounded border px-3 py-2" />
      <select name="floorId" className="rounded border px-3 py-2">
        <option value="">無指定樓層</option>
        {floors.map((f) => (
          <option value={f.id} key={f.id}>
            {f.label}
          </option>
        ))}
      </select>
      <input name="description" placeholder="描述" className="rounded border px-3 py-2" />
      <input name="notes" placeholder="備註" className="rounded border px-3 py-2" />
      {error && <p className="text-sm text-red-600 md:col-span-5">{error}</p>}
      <button className="rounded bg-black px-3 py-2 text-white md:col-span-5">新增公共區域</button>
    </form>
  );
}
