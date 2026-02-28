import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { buildingCreateSchema } from "@/lib/schemas";

export async function GET() {
  try {
    await requireApiUser();
  } catch {
    return fail("UNAUTHORIZED", "請先登入", 401);
  }

  const data = await prisma.building.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { floors: true, units: true, leases: true, tenants: true },
      },
    },
  });
  return ok(data);
}

export async function POST(req: Request) {
  try {
    await requireApiUser();
  } catch {
    return fail("UNAUTHORIZED", "請先登入", 401);
  }

  const parsed = await parseBody(req, buildingCreateSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "資料格式錯誤", 422, parsed.error);
  }

  try {
    const data = await prisma.building.create({
      data: {
        ...parsed.data,
        managementFee:
          parsed.data.managementFee === undefined || parsed.data.managementFee === null
            ? null
            : new Prisma.Decimal(parsed.data.managementFee),
      },
    });
    return ok(data, 201);
  } catch (error) {
    return fail("CREATE_FAILED", "建立大樓失敗", 400, error);
  }
}
