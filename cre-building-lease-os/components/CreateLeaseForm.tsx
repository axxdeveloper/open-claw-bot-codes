"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type TenantLite = { id: string; name: string };
type UnitLite = { id: string; code: string; floorLabel: string };

export default function CreateLeaseForm({
  buildingId,
  tenants,
  units,
}: {
  buildingId: string;
  tenants: TenantLite[];
  units: UnitLite[];
}) {
  const router = useRouter();
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleUnit = (id: string) => {
    setSelectedUnits((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (selectedUnits.length === 0) {
      setError("請至少選擇一個單位");
      return;
    }

    const form = new FormData(e.currentTarget);
    const payload = {
      buildingId,
      tenantId: String(form.get("tenantId") || ""),
      unitIds: selectedUnits,
      status: String(form.get("status") || "ACTIVE"),
      startDate: String(form.get("startDate") || ""),
      endDate: String(form.get("endDate") || ""),
      managementFee: form.get("managementFee")
        ? Number(form.get("managementFee"))
        : null,
      rent: form.get("rent") ? Number(form.get("rent")) : null,
      deposit: form.get("deposit") ? Number(form.get("deposit")) : null,
    };

    const res = await fetch("/api/leases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!json.ok) {
      setError(json.error?.message ?? "建立租約失敗");
      return;
    }

    router.push(`/leases/${json.data.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded border bg-white p-4">
      <h2 className="font-semibold">建立租約</h2>
      <div className="grid gap-2 md:grid-cols-3">
        <select name="tenantId" className="rounded border px-3 py-2" required>
          <option value="">選擇租戶</option>
          {tenants.map((t) => (
            <option value={t.id} key={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input name="startDate" type="date" className="rounded border px-3 py-2" required />
        <input name="endDate" type="date" className="rounded border px-3 py-2" required />
        <select name="status" defaultValue="ACTIVE" className="rounded border px-3 py-2">
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
        </select>
        <input name="managementFee" type="number" step="0.01" placeholder="管理費 (可空)" className="rounded border px-3 py-2" />
        <input name="rent" type="number" step="0.01" placeholder="租金" className="rounded border px-3 py-2" />
        <input name="deposit" type="number" step="0.01" placeholder="押金" className="rounded border px-3 py-2" />
      </div>

      <div>
        <div className="mb-1 text-sm font-medium">選擇單位</div>
        <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
          {units.map((u) => (
            <label key={u.id} className="flex items-center gap-1 rounded border px-2 py-1 text-xs">
              <input
                type="checkbox"
                checked={selectedUnits.includes(u.id)}
                onChange={() => toggleUnit(u.id)}
              />
              {u.floorLabel}-{u.code}
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="rounded bg-black px-3 py-2 text-white">建立租約</button>
    </form>
  );
}
