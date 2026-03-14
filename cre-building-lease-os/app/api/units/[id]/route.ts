import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { unitPatchSchema } from "@/lib/schemas";

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
  const parsed = await parseBody(req, unitPatchSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "資料格式錯誤", 422, parsed.error);
  }

  try {
    const data = await prisma.unit.update({
      where: { id },
      data: {
        ...parsed.data,
        grossArea:
          parsed.data.grossArea === undefined
            ? undefined
            : new Prisma.Decimal(parsed.data.grossArea),
        netArea:
          parsed.data.netArea === undefined
            ? undefined
            : parsed.data.netArea === null
              ? null
              : new Prisma.Decimal(parsed.data.netArea),
        balconyArea:
          parsed.data.balconyArea === undefined
            ? undefined
            : parsed.data.balconyArea === null
              ? null
              : new Prisma.Decimal(parsed.data.balconyArea),
      },
    });
    return ok(data);
  } catch (error) {
    return fail("UPDATE_FAILED", "更新單位失敗", 400, error);
  }
}
