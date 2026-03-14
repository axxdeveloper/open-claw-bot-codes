import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AddUnitForm from "@/components/AddUnitForm";
import SplitUnitForm from "@/components/SplitUnitForm";
import MergeUnitsForm from "@/components/MergeUnitsForm";
import DraftOccupancyForm from "@/components/DraftOccupancyForm";
import AssignFloorOwnerForm from "@/components/AssignFloorOwnerForm";
import FloorOwnerList from "@/components/FloorOwnerList";
import CreateRepairForm from "@/components/CreateRepairForm";

export default async function FloorDetailPage({
  params,
}: {
  params: Promise<{ id: string; floorId: string }>;
}) {
  await requireUser();
  const { id, floorId } = await params;

  const [floor, tenants, owners, occupancies, commonAreas, vendors, repairs] =
    await Promise.all([
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
      prisma.tenant.findMany({ where: { buildingId: id }, orderBy: { name: "asc" } }),
      prisma.owner.findMany({ where: { buildingId: id }, orderBy: { name: "asc" } }),
      prisma.occupancy.findMany({
        where: {
          buildingId: id,
          unit: { floorId },
        },
        orderBy: { createdAt: "desc" },
        include: {
          tenant: true,
        },
      }),
      prisma.commonArea.findMany({ where: { buildingId: id }, orderBy: { name: "asc" } }),
      prisma.vendor.findMany({ where: { buildingId: id }, orderBy: { name: "asc" } }),
      prisma.repairRecord.findMany({
        where: { buildingId: id, floorId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  if (!floor) return <main>找不到樓層</main>;

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{floor.label} - 單位管理</h1>
        <Link href={`/buildings/${id}/floors`} className="text-sm underline">
          返回樓層列表
        </Link>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold">Floor Owners</h2>
        <AssignFloorOwnerForm
          floorId={floorId}
          owners={owners.map((owner) => ({ id: owner.id, name: owner.name }))}
        />
        <FloorOwnerList
          data={floor.floorOwners.map((fo) => ({
            id: fo.id,
            sharePercent: Number(fo.sharePercent),
            startDate: fo.startDate.toISOString(),
            endDate: fo.endDate?.toISOString() ?? null,
            notes: fo.notes,
            owner: { name: fo.owner.name },
          }))}
        />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Floor Repairs History</h2>
        <CreateRepairForm
          buildingId={id}
          floors={[{ id: floorId, label: floor.label }]}
          commonAreas={commonAreas.map((c) => ({ id: c.id, name: c.name }))}
          vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
          defaultScopeType="FLOOR"
          defaultFloorId={floorId}
        />
        <div className="rounded border bg-white p-3">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {repairs.map((repair) => (
              <li key={repair.id}>
                {repair.item} / {repair.status} / {repair.vendorName} / 報價 {Number(repair.quoteAmount)}
              </li>
            ))}
            {repairs.length === 0 && <li className="text-gray-500">尚無樓層維修紀錄</li>}
          </ul>
        </div>
      </section>

      <AddUnitForm floorId={floorId} />

      <MergeUnitsForm units={floor.units.map((u) => ({ id: u.id, code: u.code }))} />

      <div className="grid gap-3">
        {floor.units.map((unit) => {
          const latestOccupancy = occupancies.find((o) => o.unitId === unit.id);
          return (
            <div key={unit.id} className="grid gap-3 rounded border bg-white p-4 md:grid-cols-3">
              <div>
                <div className="text-lg font-semibold">{unit.code}</div>
                <div className="text-sm text-gray-600">
                  G {Number(unit.grossArea)} / N {unit.netArea ? Number(unit.netArea) : "-"} /
                  陽台 {unit.balconyArea ? Number(unit.balconyArea) : "-"}
                </div>
                {latestOccupancy && (
                  <div className="mt-1 text-xs text-blue-700">
                    Occupancy: {latestOccupancy.status} / {latestOccupancy.tenant.name}
                  </div>
                )}
              </div>
              <SplitUnitForm unitId={unit.id} />
              <DraftOccupancyForm
                buildingId={id}
                unitId={unit.id}
                tenants={tenants.map((t) => ({ id: t.id, name: t.name }))}
              />
            </div>
          );
        })}

        {floor.units.length === 0 && (
          <div className="rounded border border-dashed p-8 text-center text-sm text-gray-500">
            無單位資料
          </div>
        )}
      </div>
    </main>
  );
}
