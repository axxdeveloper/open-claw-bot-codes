import { OccupancyStatus, RepairStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BuildingsOverviewClient from "@/components/buildings/BuildingsOverviewClient";

function deriveCategory(name: string, address: string, code: string): "Commercial" | "Residential" | "Mixed Use" | "Unknown" {
  const normalized = `${name} ${address} ${code}`.toLowerCase();

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

export default async function BuildingsPage() {
  await requireUser();

  const buildings = await prisma.building.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      units: { where: { isCurrent: true }, select: { id: true } },
      occupancies: { where: { status: OccupancyStatus.ACTIVE }, select: { id: true } },
      repairRecords: {
        where: { status: { in: [RepairStatus.DRAFT, RepairStatus.QUOTED, RepairStatus.APPROVED, RepairStatus.IN_PROGRESS] } },
        select: { id: true },
      },
    },
  });

  const items = buildings.map((building) => {
    const totalUnits = building.units.length;
    const activeOccupancies = building.occupancies.length;
    const pendingRequests = building.repairRecords.length;

    return {
      id: building.id,
      name: building.name,
      address: building.address || "未填地址",
      totalUnits,
      activeOccupancies,
      pendingRequests,
      category: deriveCategory(building.name, building.address || "", building.code || ""),
    };
  });

  return <BuildingsOverviewClient buildings={items} />;
}
