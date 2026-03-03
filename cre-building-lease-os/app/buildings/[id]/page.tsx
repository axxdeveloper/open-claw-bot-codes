import Link from "next/link";
import { LeaseStatus, OccupancyStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function BuildingOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const building = await prisma.building.findUnique({ where: { id } });
  if (!building) return <main>找不到大樓</main>;

  const [floors, units, tenants, leases, activeOccupancies] = await Promise.all([
    prisma.floor.count({ where: { buildingId: id } }),
    prisma.unit.count({ where: { buildingId: id, isCurrent: true } }),
    prisma.tenant.count({ where: { buildingId: id } }),
    prisma.lease.count({ where: { buildingId: id, status: LeaseStatus.ACTIVE } }),
    prisma.occupancy.count({
      where: { buildingId: id, status: OccupancyStatus.ACTIVE },
    }),
  ]);

  return (
    <main className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{building.name}</h1>
        <p className="text-sm text-gray-500">{building.address || "未填地址"}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["樓層", floors],
          ["現行單位", units],
          ["租戶", tenants],
          ["ACTIVE 租約", leases],
          ["ACTIVE 進駐", activeOccupancies],
        ].map(([label, value]) => (
          <div key={label} className="rounded border bg-white p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <Link href={`/buildings/${id}/floors`} className="rounded border bg-white p-3 hover:bg-gray-50">
          樓層與單位（檢視）
        </Link>
        <Link href={`/buildings/${id}/owners`} className="rounded border bg-white p-3 hover:bg-gray-50">
          樓層業主
        </Link>
        <Link href={`/buildings/${id}/tenants`} className="rounded border bg-white p-3 hover:bg-gray-50">
          租戶名單
        </Link>
        <Link href={`/buildings/${id}/leases`} className="rounded border bg-white p-3 hover:bg-gray-50">
          租約列表
        </Link>
        <Link href={`/buildings/${id}/common-areas`} className="rounded border bg-white p-3 hover:bg-gray-50">
          公共區域
        </Link>
        <Link href={`/buildings/${id}/repairs`} className="rounded border bg-white p-3 hover:bg-gray-50">
          維修歷史
        </Link>
        <Link href={`/buildings/${id}/stacking`} className="rounded border bg-white p-3 hover:bg-gray-50">
          Stacking
        </Link>
        <Link href={`/buildings/${id}/manage`} className="rounded border border-black bg-black p-3 text-white hover:opacity-90">
          資料維護（新增/編輯）
        </Link>
      </div>
    </main>
  );
}
