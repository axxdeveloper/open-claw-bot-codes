import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { unitMergeSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    await requireApiUser();
  } catch {
    return fail("UNAUTHORIZED", "請先登入", 401);
  }

  const parsed = await parseBody(req, unitMergeSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "合併資料格式錯誤", 422, parsed.error);
  }

  const units = await prisma.unit.findMany({
    where: {
      id: { in: parsed.data.unitIds },
      isCurrent: true,
    },
  });

  if (units.length !== parsed.data.unitIds.length) {
    return fail("NOT_FOUND", "部分單位不存在或非當前版本", 404);
  }

  const floorId = units[0].floorId;
  const buildingId = units[0].buildingId;
  if (!units.every((x) => x.floorId === floorId && x.buildingId === buildingId)) {
    return fail("INVALID_MERGE", "僅可合併同樓層單位", 400);
  }

  const grossArea =
    parsed.data.grossArea ?? units.reduce((acc, x) => acc + Number(x.grossArea), 0);

  const data = await prisma.$transaction(async (tx) => {
    const merged = await tx.unit.create({
      data: {
        buildingId,
        floorId,
        code: parsed.data.code,
        grossArea: new Prisma.Decimal(grossArea),
        netArea:
          parsed.data.netArea === null || parsed.data.netArea === undefined
            ? null
            : new Prisma.Decimal(parsed.data.netArea),
        balconyArea:
          parsed.data.balconyArea === null || parsed.data.balconyArea === undefined
            ? null
            : new Prisma.Decimal(parsed.data.balconyArea),
      },
    });

    await tx.unit.updateMany({
      where: { id: { in: parsed.data.unitIds } },
      data: {
        isCurrent: false,
        replacedAt: new Date(),
        replacedByUnitId: merged.id,
      },
    });

    return merged;
  });

  return ok(data, 201);
}
