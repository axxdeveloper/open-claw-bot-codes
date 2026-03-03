"use client";

import Link from "next/link";
import { useState } from "react";
import InlineEditableField from "@/components/InlineEditableField";

type FloorRow = {
  id: string;
  label: string;
  unitCodes: string[];
  commonAreas: string[];
  openRepairs: number;
  completedRepairs: number;
};

type Props = {
  buildingId: string;
  initial: {
    name: string;
    code: string;
    address: string;
    managementFee: string;
  };
  floors: FloorRow[];
};

export default function BuildingDetailWorkspace({ buildingId, initial, floors }: Props) {
  const [building, setBuilding] = useState(initial);

  const patchBuilding = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/buildings/${buildingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.ok) throw new Error("更新失敗");
  };

  return (
    <div className="space-y-4">
      <section className="rounded border bg-white">
        <div className="border-b px-3 py-2 text-sm font-semibold">大樓資料（預設唯讀，雙擊可編輯）</div>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <th className="w-40 bg-gray-50 px-3 py-2 text-left font-medium">大樓名稱</th>
              <td className="px-3 py-2">
                <InlineEditableField
                  value={building.name}
                  onSave={async (value) => {
                    await patchBuilding({ name: value });
                    setBuilding((prev) => ({ ...prev, name: value }));
                  }}
                />
              </td>
            </tr>
            <tr className="border-b">
              <th className="bg-gray-50 px-3 py-2 text-left font-medium">大樓代碼</th>
              <td className="px-3 py-2">
                <InlineEditableField
                  value={building.code}
                  onSave={async (value) => {
                    await patchBuilding({ code: value || null });
                    setBuilding((prev) => ({ ...prev, code: value }));
                  }}
                />
              </td>
            </tr>
            <tr className="border-b">
              <th className="bg-gray-50 px-3 py-2 text-left font-medium">門牌 / 戶號</th>
              <td className="px-3 py-2">
                <InlineEditableField
                  value={building.address}
                  placeholder="例如：168號;168號-1;170號3F-A1"
                  onSave={async (value) => {
                    await patchBuilding({ address: value || null });
                    setBuilding((prev) => ({ ...prev, address: value }));
                  }}
                />
              </td>
            </tr>
            <tr>
              <th className="bg-gray-50 px-3 py-2 text-left font-medium">管理費（每坪）</th>
              <td className="px-3 py-2">
                <InlineEditableField
                  value={building.managementFee}
                  placeholder="0"
                  onSave={async (value) => {
                    await patchBuilding({ managementFee: value ? Number(value) : null });
                    setBuilding((prev) => ({ ...prev, managementFee: value }));
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="rounded border bg-white">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="text-sm font-semibold">樓層總表</div>
          <Link href={`/buildings/${buildingId}/manage`} className="text-xs underline">
            + 新增樓層/單位
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">樓層</th>
              <th className="px-3 py-2 text-left">門牌 / 戶號</th>
              <th className="px-3 py-2 text-left">公共設施</th>
              <th className="px-3 py-2 text-left">維修狀態</th>
            </tr>
          </thead>
          <tbody>
            {floors.map((floor) => (
              <tr key={floor.id} className="border-b align-top last:border-0">
                <td className="px-3 py-2">
                  <Link href={`/buildings/${buildingId}/floors/${floor.id}`} className="underline">
                    {floor.label}
                  </Link>
                </td>
                <td className="px-3 py-2 text-xs text-gray-700">{floor.unitCodes.join("、") || "-"}</td>
                <td className="px-3 py-2 text-xs text-gray-700">{floor.commonAreas.join("、") || "-"}</td>
                <td className="px-3 py-2 text-xs">
                  進行中 {floor.openRepairs} / 已完成 {floor.completedRepairs}
                </td>
              </tr>
            ))}
            {floors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                  尚無樓層資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
