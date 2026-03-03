import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { buildingPatchSchema } from "@/lib/schemas";

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
  const building = await prisma.building.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          floors: true,
          units: true,
          leases: true,
          tenants: true,
          occupancies: true,
        },
      },
    },
  });

  if (!building) return fail("NOT_FOUND", "找不到大樓", 404);
  return ok(building);
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
  const parsed = await parseBody(req, buildingPatchSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "資料格式錯誤", 422, parsed.error);
  }

  try {
    const data = await prisma.building.update({
      where: { id },
      data: {
        ...parsed.data,
        managementFee:
          parsed.data.managementFee === undefined
            ? undefined
            : parsed.data.managementFee === null
              ? null
              : new Prisma.Decimal(parsed.data.managementFee),
      },
    });
    return ok(data);
  } catch (error) {
    return fail("UPDATE_FAILED", "更新大樓失敗", 400, error);
  }
}
