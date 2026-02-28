"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type FloorLite = { id: string; label: string };
type CommonAreaLite = { id: string; name: string };
type VendorLite = { id: string; name: string };

export default function CreateRepairForm({
  buildingId,
  floors,
  commonAreas,
  vendors,
  defaultScopeType = "FLOOR",
  defaultFloorId,
}: {
  buildingId: string;
  floors: FloorLite[];
  commonAreas: CommonAreaLite[];
  vendors: VendorLite[];
  defaultScopeType?: "FLOOR" | "COMMON_AREA";
  defaultFloorId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const scopeType = String(form.get("scopeType") || "FLOOR");
    const floorId = String(form.get("floorId") || "");
    const commonAreaId = String(form.get("commonAreaId") || "");
    const vendorId = String(form.get("vendorId") || "");

    const payload = {
      buildingId,
      scopeType,
      floorId: scopeType === "FLOOR" ? floorId || null : null,
      commonAreaId: scopeType === "COMMON_AREA" ? commonAreaId || null : null,
      item: String(form.get("item") || ""),
      vendorId: vendorId || null,
      vendorName: String(form.get("vendorName") || ""),
      quoteAmount: Number(form.get("quoteAmount") || 0),
      status: String(form.get("status") || "DRAFT"),
      notes: String(form.get("notes") || "") || undefined,
    };

    const res = await fetch("/api/repairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!json.ok) {
      setError(json.error?.message ?? "新增維修紀錄失敗");
      return;
    }

    e.currentTarget.reset();
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-2 rounded border bg-white p-3 md:grid-cols-4">
      <select name="scopeType" defaultValue={defaultScopeType} className="rounded border px-2 py-1 text-sm">
        <option value="FLOOR">樓層</option>
        <option value="COMMON_AREA">公共區域</option>
      </select>
      <select name="floorId" defaultValue={defaultFloorId ?? ""} className="rounded border px-2 py-1 text-sm">
        <option value="">選擇樓層</option>
        {floors.map((f) => (
          <option value={f.id} key={f.id}>
            {f.label}
          </option>
        ))}
      </select>
      <select name="commonAreaId" className="rounded border px-2 py-1 text-sm">
        <option value="">選擇公共區域</option>
        {commonAreas.map((c) => (
          <option value={c.id} key={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input name="item" placeholder="維修項目" className="rounded border px-2 py-1 text-sm" required />
      <select name="vendorId" className="rounded border px-2 py-1 text-sm">
        <option value="">不指定廠商檔案</option>
        {vendors.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
      <input name="vendorName" placeholder="廠商名稱 (必填)" className="rounded border px-2 py-1 text-sm" required />
      <input name="quoteAmount" type="number" step="0.01" placeholder="報價金額" className="rounded border px-2 py-1 text-sm" required />
      <select name="status" defaultValue="DRAFT" className="rounded border px-2 py-1 text-sm">
        <option value="DRAFT">DRAFT</option>
        <option value="QUOTED">QUOTED</option>
        <option value="APPROVED">APPROVED</option>
        <option value="IN_PROGRESS">IN_PROGRESS</option>
        <option value="COMPLETED">COMPLETED</option>
      </select>
      <input name="notes" placeholder="備註" className="rounded border px-2 py-1 text-sm md:col-span-4" />
      {error && <p className="text-sm text-red-600 md:col-span-4">{error}</p>}
      <button className="rounded border px-2 py-1 text-sm md:col-span-4">新增維修紀錄</button>
    </form>
  );
}
