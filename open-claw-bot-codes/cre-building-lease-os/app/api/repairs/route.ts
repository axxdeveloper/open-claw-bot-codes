import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import {
  assertAcceptedTransition,
  assertRepairScopeConsistency,
  normalizeAcceptedAt,
} from "@/lib/repair-service";
import { repairCreateSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    await requireApiUser();
  } catch {
    return fail("UNAUTHORIZED", "請先登入", 401);
  }

  const parsed = await parseBody(req, repairCreateSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "維修紀錄資料格式錯誤", 422, parsed.error);
  }

  try {
    assertRepairScopeConsistency(parsed.data);
    assertAcceptedTransition(parsed.data);
  } catch (error) {
    return fail("BUSINESS_RULE_VIOLATION", "維修紀錄規則驗證失敗", 400, String(error));
  }

  const data = await prisma.repairRecord.create({
    data: {
      buildingId: parsed.data.buildingId,
      scopeType: parsed.data.scopeType,
      floorId: parsed.data.floorId,
      commonAreaId: parsed.data.commonAreaId,
      item: parsed.data.item,
      description: parsed.data.description,
      vendorId: parsed.data.vendorId,
      vendorName: parsed.data.vendorName,
      vendorTaxId: parsed.data.vendorTaxId,
      quoteAmount: new Prisma.Decimal(parsed.data.quoteAmount),
      approvedAmount:
        parsed.data.approvedAmount === undefined || parsed.data.approvedAmount === null
          ? null
          : new Prisma.Decimal(parsed.data.approvedAmount),
      finalAmount:
        parsed.data.finalAmount === undefined || parsed.data.finalAmount === null
          ? null
          : new Prisma.Decimal(parsed.data.finalAmount),
      status: parsed.data.status,
      acceptanceResult: parsed.data.acceptanceResult,
      inspectorName: parsed.data.inspectorName,
      reportedAt: parsed.data.reportedAt ?? new Date(),
      startedAt: parsed.data.startedAt,
      completedAt: parsed.data.completedAt,
      acceptedAt: normalizeAcceptedAt({
        status: parsed.data.status,
        acceptedAt: parsed.data.acceptedAt,
      }),
      notes: parsed.data.notes,
    },
    include: {
      floor: true,
      commonArea: true,
      vendor: true,
    },
  });

  return ok(data, 201);
}
