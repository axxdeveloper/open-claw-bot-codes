import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { commonAreaPatchSchema } from "@/lib/schemas";

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
  const data = await prisma.commonArea.findUnique({
    where: { id },
    include: { floor: true, repairRecords: { orderBy: { createdAt: "desc" } } },
  });

  if (!data) return fail("NOT_FOUND", "找不到公共區域", 404);
  return ok(data);
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
  const parsed = await parseBody(req, commonAreaPatchSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "公共區域資料格式錯誤", 422, parsed.error);
  }

  const data = await prisma.commonArea.update({
    where: { id },
    data: parsed.data,
  });

  return ok(data);
}
