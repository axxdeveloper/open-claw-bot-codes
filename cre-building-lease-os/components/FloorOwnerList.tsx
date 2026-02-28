"use client";

import { useRouter } from "next/navigation";

type FloorOwnerRow = {
  id: string;
  sharePercent: string | number;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  owner: { name: string };
};

export default function FloorOwnerList({ data }: { data: FloorOwnerRow[] }) {
  const router = useRouter();

  return (
    <div className="rounded border bg-white p-3">
      <h3 className="mb-2 font-semibold">Floor Owners</h3>
      <ul className="space-y-2 text-sm">
        {data.map((fo) => (
          <li key={fo.id} className="flex items-center justify-between rounded border p-2">
            <div>
              <div className="font-medium">{fo.owner.name}</div>
              <div className="text-xs text-gray-600">
                持分 {Number(fo.sharePercent)}% / {fo.startDate.slice(0, 10)}
                {fo.endDate ? ` ~ ${fo.endDate.slice(0, 10)}` : ""}
              </div>
            </div>
            <button
              className="rounded border px-2 py-1 text-xs"
              type="button"
              onClick={async () => {
                await fetch(`/api/floor-owners/${fo.id}`, { method: "DELETE" });
                router.refresh();
              }}
            >
              移除
            </button>
          </li>
        ))}
        {data.length === 0 && <li className="text-xs text-gray-500">尚未指派業主</li>}
      </ul>
    </div>
  );
}
