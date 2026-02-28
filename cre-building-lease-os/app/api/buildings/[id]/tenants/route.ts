import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { tenantCreateSchema } from "@/lib/schemas";

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
  const data = await prisma.tenant.findMany({
    where: { buildingId: id },
    orderBy: { createdAt: "desc" },
  });
  return ok(data);
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
  const parsed = await parseBody(req, tenantCreateSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "租戶資料格式錯誤", 422, parsed.error);
  }

  const data = await prisma.tenant.create({
    data: {
      ...parsed.data,
      buildingId: id,
    },
  });

  return ok(data, 201);
}
