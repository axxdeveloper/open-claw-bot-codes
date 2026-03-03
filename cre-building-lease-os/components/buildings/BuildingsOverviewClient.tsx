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

function categoryFromText(text: string): BuildingCategory {
  const normalized = text.toLowerCase();

  if (
    normalized.includes("mixed") ||
    normalized.includes("mixed use") ||
    normalized.includes("綜合") ||
    normalized.includes("複合")
  ) {
    return "Mixed Use";
  }

  if (
    normalized.includes("commercial") ||
    normalized.includes("office") ||
    normalized.includes("retail") ||
    normalized.includes("商辦") ||
    normalized.includes("商業")
  ) {
    return "Commercial";
  }

  if (
    normalized.includes("residential") ||
    normalized.includes("apartment") ||
    normalized.includes("housing") ||
    normalized.includes("住宅") ||
    normalized.includes("住家")
  ) {
    return "Residential";
  }

  return "Unknown";
}

function formatRate(numerator: number, denominator: number) {
  if (denominator <= 0) return "--";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Commercial", label: "Commercial" },
  { value: "Residential", label: "Residential" },
  { value: "Mixed Use", label: "Mixed Use" },
];

export default function BuildingsOverviewClient({ buildings }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("All");
  const [keyword, setKeyword] = useState("");

  const stats = useMemo(() => {
    const totalBuildings = buildings.length;
    const totalUnits = buildings.reduce((sum, b) => sum + b.totalUnits, 0);
    const activeOccupancies = buildings.reduce((sum, b) => sum + b.activeOccupancies, 0);
    const pendingRequests = buildings.reduce((sum, b) => sum + b.pendingRequests, 0);

    return {
      totalBuildings,
      totalUnits,
      occupancyRate: formatRate(activeOccupancies, totalUnits),
      pendingRequests,
    };
  }, [buildings]);

  const visibleBuildings = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return buildings.filter((b) => {
      const matchFilter = activeFilter === "All" || b.category === activeFilter;
      const matchSearch =
        q.length === 0 ||
        b.name.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q);

      return matchFilter && matchSearch;
    });
  }, [activeFilter, buildings, keyword]);

  return (
    <main className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Buildings Overview</h1>
          <p className="text-sm text-gray-500">Track occupancy and requests across your portfolio</p>
        </div>
        <Link href="/buildings/new" className="w-full rounded bg-black px-3 py-2 text-center text-white md:w-auto">
          新增大樓
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border bg-white p-4">
          <div className="text-xs text-gray-500">Total Buildings</div>
          <div className="mt-1 text-2xl font-semibold">{stats.totalBuildings}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-xs text-gray-500">Total Units</div>
          <div className="mt-1 text-2xl font-semibold">{stats.totalUnits}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-xs text-gray-500">Occupancy Rate</div>
          <div className="mt-1 text-2xl font-semibold">{stats.occupancyRate}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-xs text-gray-500">Pending Requests</div>
          <div className="mt-1 text-2xl font-semibold">{stats.pendingRequests}</div>
        </div>
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

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search building name or address"
          className="w-full rounded border px-3 py-2 text-sm outline-none ring-0 placeholder:text-gray-400 focus:border-black"
        />
      </div>

      <div className="overflow-hidden rounded border bg-white">
        <div className="hidden grid-cols-[56px_1.2fr_1.2fr_0.8fr_0.7fr_0.7fr_40px] gap-3 border-b bg-gray-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500 md:grid">
          <div>Photo</div>
          <div>Building Name</div>
          <div>Address</div>
          <div>Category</div>
          <div>Occupancy</div>
          <div>Total Units</div>
          <div />
        </div>

        {visibleBuildings.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No buildings found for current filters.</div>
        ) : (
          <div className="divide-y">
            {visibleBuildings.map((b) => {
              const occupancyText = formatRate(b.activeOccupancies, b.totalUnits);
              return (
                <Link key={b.id} href={`/buildings/${b.id}`} className="block px-4 py-3 hover:bg-gray-50">
                  <div className="grid items-center gap-3 md:grid-cols-[56px_1.2fr_1.2fr_0.8fr_0.7fr_0.7fr_40px]">
                    <div className="flex h-10 w-14 items-center justify-center rounded border border-dashed text-[10px] text-gray-400">
                      Photo
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{b.name}</div>
                      <div className="text-xs text-gray-500 md:hidden">{b.address}</div>
                    </div>
                    <div className="hidden truncate text-sm text-gray-600 md:block">{b.address}</div>
                    <div className="text-sm text-gray-700">{b.category === "Unknown" ? "Uncategorized" : b.category}</div>
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

