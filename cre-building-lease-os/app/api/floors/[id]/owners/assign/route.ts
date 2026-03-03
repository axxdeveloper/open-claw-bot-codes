import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { buildFloorOwnerAssignment } from "@/lib/owner-service";
import { prisma } from "@/lib/prisma";
import { floorOwnerAssignSchema } from "@/lib/schemas";

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
  const parsed = await parseBody(req, floorOwnerAssignSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "樓層指派業主資料格式錯誤", 422, parsed.error);
  }

  const floor = await prisma.floor.findUnique({ where: { id } });
  if (!floor) return fail("NOT_FOUND", "找不到樓層", 404);

  const owner = await prisma.owner.findUnique({ where: { id: parsed.data.ownerId } });
  if (!owner || owner.buildingId !== floor.buildingId) {
    return fail("INVALID_OWNER", "業主不屬於此大樓", 400);
  }

  const data = await prisma.floorOwner.create({
    data: {
      ...buildFloorOwnerAssignment({
        floorId: id,
        ownerId: parsed.data.ownerId,
        sharePercent: parsed.data.sharePercent,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        notes: parsed.data.notes,
      }),
      sharePercent: new Prisma.Decimal(parsed.data.sharePercent),
    },
    include: { owner: true },
  });

  return ok(data, 201);
}
