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

  const floor = await prisma.floor.findUnique({
    where: { id },
    include: {
      building: true,
      units: {
        where: { isCurrent: true },
        orderBy: { code: "asc" },
      },
    },
  });

  if (!floor) return fail("NOT_FOUND", "找不到樓層", 404);
  return ok(floor);
}
