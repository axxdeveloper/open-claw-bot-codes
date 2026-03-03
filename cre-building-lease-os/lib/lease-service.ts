import { LeaseStatus, OccupancyStatus, Prisma } from "@prisma/client";
import { isDateRangeOverlap, nextOccupancyStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export async function assertNoOverlappingActiveLeases(params: {
  unitIds: string[];
  startDate: Date;
  endDate: Date;
  excludeLeaseId?: string;
}) {
  const { unitIds, startDate, endDate, excludeLeaseId } = params;

  const existing = await prisma.leaseUnit.findMany({
    where: {
      unitId: { in: unitIds },
      lease: {
        status: LeaseStatus.ACTIVE,
        ...(excludeLeaseId ? { id: { not: excludeLeaseId } } : {}),
      },
    },
    include: {
      lease: true,
      unit: true,
    },
  });

  const conflict = existing.find((item) =>
    isDateRangeOverlap(startDate, endDate, item.lease.startDate, item.lease.endDate),
  );

  if (conflict) {
    throw new Error(`CONFLICT_ACTIVE_LEASE:${conflict.unit.code}`);
  }
}

export async function syncOccupancyForLease(params: {
  tx: Prisma.TransactionClient;
  leaseId: string;
  buildingId: string;
  tenantId: string;
  unitIds: string[];
  leaseStatus: LeaseStatus;
  startDate: Date;
  endDate: Date;
}) {
  const { tx, leaseId, buildingId, tenantId, unitIds, leaseStatus, startDate, endDate } =
    params;

  if (leaseStatus !== LeaseStatus.ACTIVE) return;

  for (const unitId of unitIds) {
    const draft = await tx.occupancy.findFirst({
      where: {
        unitId,
        tenantId,
        status: OccupancyStatus.DRAFT,
      },
      orderBy: { createdAt: "desc" },
    });

    if (draft) {
      await tx.occupancy.update({
        where: { id: draft.id },
        data: {
          status: nextOccupancyStatus(leaseStatus),
          leaseId,
          startDate,
          endDate,
        },
      });
      continue;
    }

    await tx.occupancy.create({
      data: {
        buildingId,
        unitId,
        tenantId,
        leaseId,
        status: OccupancyStatus.ACTIVE,
        startDate,
        endDate,
      },
    });
  }
}
