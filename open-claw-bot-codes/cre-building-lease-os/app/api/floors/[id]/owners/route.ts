import { fail, ok } from "@/lib/api-response";
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
  const data = await prisma.floorOwner.findMany({
    where: { floorId: id },
    include: { owner: true },
    orderBy: { startDate: "desc" },
  });

  return ok(data);
}
