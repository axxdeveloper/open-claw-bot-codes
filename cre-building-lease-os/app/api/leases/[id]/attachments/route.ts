import { FileKind } from "@prisma/client";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const leaseAttachmentCreateSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  kind: z.nativeEnum(FileKind).optional(),
});

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
  const lease = await prisma.lease.findUnique({ where: { id } });
  if (!lease) return fail("NOT_FOUND", "找不到租約", 404);

  const parsed = await parseBody(req, leaseAttachmentCreateSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "附件格式錯誤", 422, parsed.error);
  }

  const data = await prisma.leaseAttachment.create({
    data: {
      leaseId: id,
      fileName: parsed.data.fileName,
      fileUrl: parsed.data.fileUrl,
      kind: parsed.data.kind || FileKind.OTHER,
    },
  });

  return ok(data);
}
