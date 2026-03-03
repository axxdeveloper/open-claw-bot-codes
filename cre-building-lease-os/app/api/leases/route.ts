import { LeaseStatus, Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { getEffectiveManagementFee } from "@/lib/domain";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import {
  assertNoOverlappingActiveLeases,
  syncOccupancyForLease,
} from "@/lib/lease-service";
import { prisma } from "@/lib/prisma";
import { leaseCreateSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    await requireApiUser();
  } catch {
    return fail("UNAUTHORIZED", "請先登入", 401);
  }

  const parsed = await parseBody(req, leaseCreateSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "租約資料格式錯誤", 422, parsed.error);
  }

  const { buildingId, tenantId, unitIds, startDate, endDate, status } = parsed.data;
  if (startDate > endDate) {
    return fail("INVALID_DATE_RANGE", "租約日期區間錯誤", 400);
  }

  if (status === LeaseStatus.ACTIVE) {
    try {
      await assertNoOverlappingActiveLeases({ unitIds, startDate, endDate });
    } catch (error) {
      return fail("OVERLAPPING_ACTIVE_LEASE", "同一單位不可有重疊 ACTIVE 租約", 409, error);
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const lease = await tx.lease.create({
      data: {
        buildingId,
        tenantId,
        status,
        startDate,
        endDate,
        managementFee:
          parsed.data.managementFee === undefined || parsed.data.managementFee === null
            ? null
            : new Prisma.Decimal(parsed.data.managementFee),
        rent:
          parsed.data.rent === undefined || parsed.data.rent === null
            ? null
            : new Prisma.Decimal(parsed.data.rent),
        deposit:
          parsed.data.deposit === undefined || parsed.data.deposit === null
            ? null
            : new Prisma.Decimal(parsed.data.deposit),
      },
    });

    await tx.leaseUnit.createMany({
      data: unitIds.map((unitId) => ({ leaseId: lease.id, unitId })),
    });

    await syncOccupancyForLease({
      tx,
      leaseId: lease.id,
      buildingId,
      tenantId,
      unitIds,
      leaseStatus: status,
      startDate,
      endDate,
    });

    const building = await tx.building.findUnique({ where: { id: buildingId } });

    return {
      ...lease,
      effectiveManagementFee: getEffectiveManagementFee(
        lease.managementFee ? Number(lease.managementFee) : null,
        building?.managementFee ? Number(building.managementFee) : null,
      ),
    };
  });

  return ok(created, 201);
}
