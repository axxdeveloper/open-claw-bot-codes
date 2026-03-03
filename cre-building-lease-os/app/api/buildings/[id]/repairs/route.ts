import { RepairScopeType, RepairStatus } from "@prisma/client";
import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildRepairFilters } from "@/lib/repair-service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiUser();
  } catch {
    return fail("UNAUTHORIZED", "請先登入", 401);
  }

  const { id } = await params;
  const url = new URL(req.url);

  const status = url.searchParams.get("status") as RepairStatus | null;
  const scopeType = url.searchParams.get("scopeType") as RepairScopeType | null;
  const floorId = url.searchParams.get("floorId");
  const commonAreaId = url.searchParams.get("commonAreaId");

  const repairs = await prisma.repairRecord.findMany({
    where: {
      buildingId: id,
      ...buildRepairFilters({
        status: status ?? undefined,
        scopeType: scopeType ?? undefined,
        floorId: floorId ?? undefined,
        commonAreaId: commonAreaId ?? undefined,
      }),
    },
    include: {
      floor: true,
      commonArea: true,
      vendor: true,
      repairAttachments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(repairs);
}
