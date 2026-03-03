"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type OwnerLite = { id: string; name: string };

export default function AssignFloorOwnerForm({
  floorId,
  owners,
}: {
  floorId: string;
  owners: OwnerLite[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      ownerId: String(form.get("ownerId") || ""),
      sharePercent: Number(form.get("sharePercent") || 0),
      startDate: String(form.get("startDate") || "") || undefined,
      endDate: String(form.get("endDate") || "") || null,
      notes: String(form.get("notes") || "") || undefined,
    };

    const res = await fetch(`/api/floors/${floorId}/owners/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!json.ok) {
      setError(json.error?.message ?? "指派業主失敗");
      return;
    }

    e.currentTarget.reset();
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-2 rounded border bg-white p-3 md:grid-cols-5">
      <select name="ownerId" className="rounded border px-2 py-1 text-sm" required>
        <option value="">選擇業主</option>
        {owners.map((owner) => (
          <option value={owner.id} key={owner.id}>
            {owner.name}
          </option>
        ))}
      </select>
      <input
        name="sharePercent"
        type="number"
        step="0.01"
        placeholder="持分 %"
        className="rounded border px-2 py-1 text-sm"
        required
      />
      <input name="startDate" type="date" className="rounded border px-2 py-1 text-sm" />
      <input name="endDate" type="date" className="rounded border px-2 py-1 text-sm" />
      <input name="notes" placeholder="備註" className="rounded border px-2 py-1 text-sm" />
      {error && <p className="text-sm text-red-600 md:col-span-5">{error}</p>}
      <button className="rounded border px-2 py-1 text-sm md:col-span-5">指派業主到樓層</button>
    </form>
  );
}
