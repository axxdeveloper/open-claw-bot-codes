import { fail, ok } from "@/lib/api-response";
import { getEffectiveManagementFee } from "@/lib/domain";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const building = await prisma.building.findUnique({ where: { id } });
  if (!building) return fail("NOT_FOUND", "找不到大樓", 404);

  const leases = await prisma.lease.findMany({
    where: { buildingId: id },
    orderBy: { createdAt: "desc" },
    include: {
      tenant: true,
      leaseUnits: { include: { unit: true } },
    },
  });

  return ok(
    leases.map((lease) => ({
      ...lease,
      effectiveManagementFee: getEffectiveManagementFee(
        lease.managementFee ? Number(lease.managementFee) : null,
        building.managementFee ? Number(building.managementFee) : null,
      ),
    })),
  );
}
