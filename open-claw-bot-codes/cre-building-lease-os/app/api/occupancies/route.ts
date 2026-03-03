import { OccupancyStatus } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { occupancyCreateSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    await requireApiUser();
  } catch {
    return fail("UNAUTHORIZED", "請先登入", 401);
  }

  const parsed = await parseBody(req, occupancyCreateSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "進駐資料格式錯誤", 422, parsed.error);
  }

  if (parsed.data.status === OccupancyStatus.ACTIVE && !parsed.data.leaseId) {
    return fail("LEASE_REQUIRED", "ACTIVE occupancy 需綁定 lease", 400);
  }

  const data = await prisma.occupancy.create({
    data: {
      ...parsed.data,
      status: parsed.data.status,
      startDate: parsed.data.startDate ?? new Date(),
    },
  });

  return ok(data, 201);
}
