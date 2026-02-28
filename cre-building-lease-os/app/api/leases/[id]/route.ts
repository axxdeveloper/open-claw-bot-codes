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
import { leasePatchSchema } from "@/lib/schemas";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiUser();
  } catch {
    return fail("UNAUTHORIZED", "請先登入", 401);
  }

  const { id } = await params;
  const lease = await prisma.lease.findUnique({
    where: { id },
    include: {
      building: true,
      tenant: true,
      leaseUnits: { include: { unit: { include: { floor: true } } } },
      occupancies: true,
    },
  });

  if (!lease) return fail("NOT_FOUND", "找不到租約", 404);

  return ok({
    ...lease,
    effectiveManagementFee: getEffectiveManagementFee(
      lease.managementFee ? Number(lease.managementFee) : null,
      lease.building.managementFee ? Number(lease.building.managementFee) : null,
    ),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiUser();
  } catch {
    return fail("UNAUTHORIZED", "請先登入", 401);
  }

  const { id } = await params;
  const parsed = await parseBody(req, leasePatchSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "資料格式錯誤", 422, parsed.error);
  }

  const existing = await prisma.lease.findUnique({
    where: { id },
    include: { leaseUnits: true },
  });

  if (!existing) return fail("NOT_FOUND", "找不到租約", 404);

  const startDate = parsed.data.startDate ?? existing.startDate;
  const endDate = parsed.data.endDate ?? existing.endDate;
  const targetStatus = parsed.data.status ?? existing.status;
  const unitIds = parsed.data.unitIds ?? existing.leaseUnits.map((x) => x.unitId);

  if (startDate > endDate) {
    return fail("INVALID_DATE_RANGE", "租約日期區間錯誤", 400);
  }

  if (targetStatus === LeaseStatus.ACTIVE) {
    try {
      await assertNoOverlappingActiveLeases({
        unitIds,
        startDate,
        endDate,
        excludeLeaseId: id,
      });
    } catch (error) {
      return fail("OVERLAPPING_ACTIVE_LEASE", "同一單位不可有重疊 ACTIVE 租約", 409, error);
    }
  }

  const data = await prisma.$transaction(async (tx) => {
    const lease = await tx.lease.update({
      where: { id },
      data: {
        status: targetStatus,
        startDate,
        endDate,
        managementFee:
          parsed.data.managementFee === undefined
            ? undefined
            : parsed.data.managementFee === null
              ? null
              : new Prisma.Decimal(parsed.data.managementFee),
        rent:
          parsed.data.rent === undefined
            ? undefined
            : parsed.data.rent === null
              ? null
              : new Prisma.Decimal(parsed.data.rent),
        deposit:
          parsed.data.deposit === undefined
            ? undefined
            : parsed.data.deposit === null
              ? null
              : new Prisma.Decimal(parsed.data.deposit),
      },
      include: {
        building: true,
      },
    });

    if (parsed.data.unitIds) {
      await tx.leaseUnit.deleteMany({ where: { leaseId: id } });
      await tx.leaseUnit.createMany({
        data: parsed.data.unitIds.map((unitId) => ({ leaseId: id, unitId })),
      });
    }

    await syncOccupancyForLease({
      tx,
      leaseId: id,
      buildingId: lease.buildingId,
      tenantId: lease.tenantId,
      unitIds,
      leaseStatus: targetStatus as LeaseStatus,
      startDate,
      endDate,
    });

    return {
      ...lease,
      effectiveManagementFee: getEffectiveManagementFee(
        lease.managementFee ? Number(lease.managementFee) : null,
        lease.building.managementFee ? Number(lease.building.managementFee) : null,
      ),
    };
  });

  return ok(data);
}
