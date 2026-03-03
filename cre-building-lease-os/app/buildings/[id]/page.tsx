import Link from "next/link";
import { RepairStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BuildingDetailWorkspace from "@/components/BuildingDetailWorkspace";

export default async function BuildingOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const building = await prisma.building.findUnique({ where: { id } });
  if (!building) return <main>找不到大樓</main>;

  const floors = await prisma.floor.findMany({
    where: { buildingId: id },
    orderBy: { sortIndex: "asc" },
    include: {
      units: { where: { isCurrent: true }, orderBy: { code: "asc" } },
      commonAreas: { orderBy: { name: "asc" } },
      repairRecords: { select: { status: true } },
    },
  });

  return (
    <main className="space-y-4">
      <div className="text-xs text-gray-500">
        <Link href="/buildings" className="underline">
          大樓總覽
        </Link>{" "}
        / {building.name}
      </div>

      <BuildingDetailWorkspace
        buildingId={id}
        initial={{
          name: building.name,
          code: building.code || "",
          address: building.address || "",
          managementFee: building.managementFee ? String(Number(building.managementFee)) : "",
        }}
        floors={floors.map((floor) => ({
          id: floor.id,
          label: floor.label,
          unitCodes: floor.units.map((unit) => `${building.address || ""} ${floor.label}-${unit.code}`.trim()),
          commonAreas: floor.commonAreas.map((area) => area.name),
          openRepairs: floor.repairRecords.filter((repair) => repair.status !== RepairStatus.COMPLETED && repair.status !== RepairStatus.ACCEPTED).length,
          completedRepairs: floor.repairRecords.filter((repair) => repair.status === RepairStatus.COMPLETED || repair.status === RepairStatus.ACCEPTED).length,
        }))}
      />
    </main>
  );
}
