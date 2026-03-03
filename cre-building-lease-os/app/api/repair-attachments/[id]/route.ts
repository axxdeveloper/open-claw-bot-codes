import { unlink } from "fs/promises";
import path from "path";
import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiUser();
  } catch {
    return fail("UNAUTHORIZED", "請先登入", 401);
  }

  const { id } = await params;
  const existing = await prisma.repairAttachment.findUnique({ where: { id } });
  if (!existing) return fail("NOT_FOUND", "找不到附件", 404);

  await prisma.repairAttachment.delete({ where: { id } });

  if (existing.fileUrl.startsWith("/uploads/")) {
    const fullPath = path.join(
      process.cwd(),
      "public",
      existing.fileUrl.replace(/^\//, ""),
    );
    await unlink(fullPath).catch(() => undefined);
  }

  return ok({ deleted: true });
}
