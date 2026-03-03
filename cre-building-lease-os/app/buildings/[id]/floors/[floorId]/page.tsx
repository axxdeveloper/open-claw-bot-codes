import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AddUnitForm from "@/components/AddUnitForm";
import AssignFloorOwnerForm from "@/components/AssignFloorOwnerForm";

export default async function FloorDetailPage({
  params,
}: {
  params: Promise<{ id: string; floorId: string }>;
}) {
  await requireUser();
  const { id, floorId } = await params;

  const [building, floor, owners, occupancies] = await Promise.all([
    prisma.building.findUnique({ where: { id } }),
    prisma.floor.findUnique({
      where: { id: floorId },
      include: {
        units: {
          where: { isCurrent: true },
          orderBy: { code: "asc" },
        },
        floorOwners: {
          include: { owner: true },
          orderBy: { startDate: "desc" },
        },
      },
    }),
    prisma.owner.findMany({ where: { buildingId: id }, orderBy: { name: "asc" } }),
    prisma.occupancy.findMany({
      where: { buildingId: id, unit: { floorId } },
      include: { tenant: true, lease: true, unit: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!building || !floor) return <main>找不到樓層</main>;

  return (
    <main className="space-y-4">
      <div className="text-xs text-gray-500">
        <Link href="/buildings" className="underline">
          大樓總覽
        </Link>{" "}
        / <Link href={`/buildings/${id}`} className="underline">{building.name}</Link> / {floor.label}
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{floor.label} 樓層明細</h1>
        <Link href={`/buildings/${id}/floors`} className="text-sm underline">
          返回樓層列表
        </Link>
      </div>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">所有權資料</h2>
        <AssignFloorOwnerForm floorId={floor.id} owners={owners.map((owner) => ({ id: owner.id, name: owner.name }))} />
        <table className="mt-3 w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-left">業主</th>
              <th className="px-2 py-1 text-left">持分</th>
              <th className="px-2 py-1 text-left">起迄</th>
            </tr>
          </thead>
          <tbody>
            {floor.floorOwners.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-2 py-1">{row.owner.name}</td>
                <td className="px-2 py-1">{Number(row.sharePercent)}%</td>
                <td className="px-2 py-1 text-xs">{row.startDate.toISOString().slice(0, 10)} ~ {row.endDate?.toISOString().slice(0, 10) || "迄今"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded border bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">地址 / 面積 / 租戶</h2>
          <span className="text-xs text-gray-500">+ 新增單位（add-row）</span>
        </div>
        <AddUnitForm floorId={floor.id} />
        <table className="mt-3 w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-left">地址/房號</th>
              <th className="px-2 py-1 text-left">面積</th>
              <th className="px-2 py-1 text-left">租戶列表</th>
            </tr>
          </thead>
          <tbody>
            {floor.units.map((unit) => {
              const unitOccupancies = occupancies.filter((row) => row.unitId === unit.id);
              return (
                <tr key={unit.id} className="border-b align-top last:border-0">
                  <td className="px-2 py-1">{building.address || ""} {floor.label}-{unit.code}</td>
                  <td className="px-2 py-1 text-xs">
                    Gross {Number(unit.grossArea)} / Net {unit.netArea ? Number(unit.netArea) : "-"}
                  </td>
                  <td className="px-2 py-1 text-xs">
                    {unitOccupancies.map((occ) => (
                      <div key={occ.id}>
                        {occ.tenant.name} ({occ.status})
                      </div>
                    ))}
                    {unitOccupancies.length === 0 && "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}
