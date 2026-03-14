import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { tenantCreateSchema } from "@/lib/schemas";

const tenantPatchSchema = tenantCreateSchema.partial();

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
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) return fail("NOT_FOUND", "找不到租戶", 404);
  return ok(tenant);
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
  const parsed = await parseBody(req, tenantPatchSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "資料格式錯誤", 422, parsed.error);
  }

  const data = await prisma.tenant.update({
    where: { id },
    data: parsed.data,
  });
  return ok(data);
}
