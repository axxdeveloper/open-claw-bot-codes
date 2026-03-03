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
import { repairPatchSchema } from "@/lib/schemas";

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
  const repair = await prisma.repairRecord.findUnique({
    where: { id },
    include: {
      floor: true,
      commonArea: true,
      vendor: true,
      repairAttachments: true,
    },
  });

  if (!repair) return fail("NOT_FOUND", "找不到維修紀錄", 404);
  return ok(repair);
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
  const parsed = await parseBody(req, repairPatchSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "維修紀錄資料格式錯誤", 422, parsed.error);
  }

  const existing = await prisma.repairRecord.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "找不到維修紀錄", 404);

  const merged = {
    scopeType: parsed.data.scopeType ?? existing.scopeType,
    floorId:
      parsed.data.floorId !== undefined ? parsed.data.floorId : existing.floorId,
    commonAreaId:
      parsed.data.commonAreaId !== undefined
        ? parsed.data.commonAreaId
        : existing.commonAreaId,
    status: parsed.data.status ?? existing.status,
    acceptanceResult:
      parsed.data.acceptanceResult !== undefined
        ? parsed.data.acceptanceResult
        : existing.acceptanceResult,
    inspectorName:
      parsed.data.inspectorName !== undefined
        ? parsed.data.inspectorName
        : existing.inspectorName,
  };

  try {
    assertRepairScopeConsistency(merged);
    assertAcceptedTransition(merged);
  } catch (error) {
    return fail("BUSINESS_RULE_VIOLATION", "維修紀錄規則驗證失敗", 400, String(error));
  }

  const data = await prisma.repairRecord.update({
    where: { id },
    data: {
      scopeType: parsed.data.scopeType,
      floorId: parsed.data.floorId,
      commonAreaId: parsed.data.commonAreaId,
      item: parsed.data.item,
      description: parsed.data.description,
      vendorId: parsed.data.vendorId,
      vendorName: parsed.data.vendorName,
      vendorTaxId: parsed.data.vendorTaxId,
      quoteAmount:
        parsed.data.quoteAmount === undefined
          ? undefined
          : new Prisma.Decimal(parsed.data.quoteAmount),
      approvedAmount:
        parsed.data.approvedAmount === undefined
          ? undefined
          : parsed.data.approvedAmount === null
            ? null
            : new Prisma.Decimal(parsed.data.approvedAmount),
      finalAmount:
        parsed.data.finalAmount === undefined
          ? undefined
          : parsed.data.finalAmount === null
            ? null
            : new Prisma.Decimal(parsed.data.finalAmount),
      status: parsed.data.status,
      acceptanceResult: parsed.data.acceptanceResult,
      inspectorName: parsed.data.inspectorName,
      reportedAt: parsed.data.reportedAt,
      startedAt: parsed.data.startedAt,
      completedAt: parsed.data.completedAt,
      acceptedAt:
        parsed.data.status === undefined && parsed.data.acceptedAt === undefined
          ? undefined
          : normalizeAcceptedAt({
              status: merged.status,
              acceptedAt: parsed.data.acceptedAt ?? existing.acceptedAt,
            }),
      notes: parsed.data.notes,
    },
  });

  return ok(data);
}
