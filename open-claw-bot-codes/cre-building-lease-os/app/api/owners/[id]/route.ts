import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { ownerPatchSchema } from "@/lib/schemas";

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
  const parsed = await parseBody(req, ownerPatchSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "業主資料格式錯誤", 422, parsed.error);
  }

  const data = await prisma.owner.update({
    where: { id },
    data: parsed.data,
  });

  return ok(data);
}
