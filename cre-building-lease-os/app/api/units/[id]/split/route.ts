import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { splitAreaValidation } from "@/lib/domain";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { unitSplitSchema } from "@/lib/schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiUser();
  } catch {
    return fail("UNAUTHORIZED", "請先登入", 401);
  }

  const { id } = await params;
  const parsed = await parseBody(req, unitSplitSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "分割資料格式錯誤", 422, parsed.error);
  }

  const unit = await prisma.unit.findUnique({ where: { id } });
  if (!unit || !unit.isCurrent) {
    return fail("NOT_FOUND", "找不到可分割單位", 404);
  }

  const grossParts = parsed.data.parts.map((x) => x.grossArea);
  if (!splitAreaValidation(Number(unit.grossArea), grossParts)) {
    return fail("INVALID_AREA", "分割後 G 坪數總和需等於原單位", 400);
  }

  const data = await prisma.$transaction(async (tx) => {
    await tx.unit.update({
      where: { id },
      data: {
        isCurrent: false,
        replacedAt: new Date(),
      },
    });

    const children = await Promise.all(
      parsed.data.parts.map((part) =>
        tx.unit.create({
          data: {
            buildingId: unit.buildingId,
            floorId: unit.floorId,
            code: part.code,
            grossArea: new Prisma.Decimal(part.grossArea),
            netArea:
              part.netArea === null || part.netArea === undefined
                ? null
                : new Prisma.Decimal(part.netArea),
            balconyArea:
              part.balconyArea === null || part.balconyArea === undefined
                ? null
                : new Prisma.Decimal(part.balconyArea),
            sourceUnitId: unit.id,
          },
        }),
      ),
    );

    return { sourceUnitId: unit.id, children };
  });

  return ok(data, 201);
}
