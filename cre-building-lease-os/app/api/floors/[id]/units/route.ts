import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { unitCreateSchema } from "@/lib/schemas";

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
  const parsed = await parseBody(req, unitCreateSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "資料格式錯誤", 422, parsed.error);
  }

  const floor = await prisma.floor.findUnique({ where: { id } });
  if (!floor) return fail("NOT_FOUND", "找不到樓層", 404);

  try {
    const data = await prisma.unit.create({
      data: {
        floorId: id,
        buildingId: floor.buildingId,
        code: parsed.data.code,
        grossArea: new Prisma.Decimal(parsed.data.grossArea),
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
    return ok(data, 201);
  } catch (error) {
    return fail("CREATE_FAILED", "建立單位失敗", 400, error);
  }
}
