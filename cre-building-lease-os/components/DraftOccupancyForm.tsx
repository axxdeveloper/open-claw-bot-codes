"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type TenantLite = { id: string; name: string };

export default function DraftOccupancyForm({
  buildingId,
  unitId,
  tenants,
}: {
  buildingId: string;
  unitId: string;
  tenants: TenantLite[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const tenantId = String(form.get("tenantId") || "");

    const res = await fetch("/api/occupancies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buildingId,
        unitId,
        tenantId,
        status: "DRAFT",
      }),
    });

    const json = await res.json();
    if (!json.ok) {
      setError(json.error?.message ?? "指派失敗");
      return;
    }

    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-1 rounded border bg-white p-3">
      <div className="text-xs font-semibold">指派住戶 (DRAFT)</div>
      <select name="tenantId" className="w-full rounded border px-2 py-1 text-xs" required>
        <option value="">選擇租戶</option>
        {tenants.map((t) => (
          <option value={t.id} key={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button className="rounded border px-2 py-1 text-xs">送出</button>
    </form>
  );
}
