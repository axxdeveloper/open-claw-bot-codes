import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { ownerCreateSchema } from "@/lib/schemas";

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
  const owners = await prisma.owner.findMany({
    where: { buildingId: id },
    orderBy: { createdAt: "desc" },
  });

  return ok(owners);
}

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
  const parsed = await parseBody(req, ownerCreateSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "業主資料格式錯誤", 422, parsed.error);
  }

  const data = await prisma.owner.create({
    data: {
      ...parsed.data,
      buildingId: id,
    },
  });

  return ok(data, 201);
}
