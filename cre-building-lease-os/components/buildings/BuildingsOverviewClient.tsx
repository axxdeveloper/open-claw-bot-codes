"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type BuildingCategory = "Commercial" | "Residential" | "Mixed Use" | "Unknown";
type FilterValue = "All" | "Commercial" | "Residential" | "Mixed Use";

type BuildingItem = {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  activeOccupancies: number;
  pendingRequests: number;
  category: BuildingCategory;
};

type Props = {
  buildings: BuildingItem[];
};

function formatRate(numerator: number, denominator: number) {
  if (denominator <= 0) return "--";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "All", label: "全部" },
  { value: "Commercial", label: "商辦" },
  { value: "Residential", label: "住宅" },
  { value: "Mixed Use", label: "住商混合" },
];

const CATEGORY_LABEL: Record<BuildingCategory, string> = {
  Commercial: "商辦",
  Residential: "住宅",
  "Mixed Use": "住商混合",
  Unknown: "未分類",
};

export default function BuildingsOverviewClient({ buildings }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("All");

  const visibleBuildings = useMemo(() => {
    return buildings.filter((b) => activeFilter === "All" || b.category === activeFilter);
  }, [activeFilter, buildings]);

  return (
    <main className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">大樓總覽</h1>
          <p className="text-sm text-gray-500">查看大樓清單與目前營運狀態</p>
        </div>
        <Link href="/buildings/new" className="w-full rounded bg-black px-3 py-2 text-center text-white md:w-auto">
          新增大樓
        </Link>
      </div>

      <div className="space-y-3 rounded border bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={`rounded-full border px-3 py-1 text-sm ${
                activeFilter === filter.value ? "border-black bg-black text-white" : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded border bg-white">
        <div className="hidden grid-cols-[56px_1.2fr_1.2fr_0.8fr_0.7fr_0.7fr_40px] gap-3 border-b bg-gray-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 md:grid">
          <div>照片</div>
          <div>大樓名稱</div>
          <div>地址</div>
          <div>類型</div>
          <div>出租率</div>
          <div>總單位數</div>
          <div />
        </div>

        {visibleBuildings.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">目前篩選條件下找不到任何大樓。</div>
        ) : (
          <div className="divide-y">
            {visibleBuildings.map((b) => {
              const occupancyText = formatRate(b.activeOccupancies, b.totalUnits);
              return (
                <Link key={b.id} href={`/buildings/${b.id}`} className="block px-4 py-3 hover:bg-gray-50">
                  <div className="grid items-center gap-3 md:grid-cols-[56px_1.2fr_1.2fr_0.8fr_0.7fr_0.7fr_40px]">
                    <div className="flex h-10 w-14 items-center justify-center rounded border border-dashed text-[10px] text-gray-400">
                      照片
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{b.name}</div>
                      <div className="text-xs text-gray-500 md:hidden">{b.address}</div>
                    </div>
                    <div className="hidden truncate text-sm text-gray-600 md:block">{b.address}</div>
                    <div className="text-sm text-gray-700">{CATEGORY_LABEL[b.category]}</div>
                    <div className="text-sm text-gray-700">{occupancyText}</div>
                    <div className="text-sm text-gray-700">{b.totalUnits}</div>
                    <div className="text-right text-lg text-gray-400">→</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
