import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
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
  const data = await prisma.repairAttachment.findMany({
    where: { repairId: id },
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
  const repair = await prisma.repairRecord.findUnique({ where: { id } });
  if (!repair) return fail("NOT_FOUND", "找不到維修紀錄", 404);

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return fail("VALIDATION_ERROR", "請提供 file 欄位", 422);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".bin";
  const fileName = `${randomUUID()}${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "repairs");
  await mkdir(uploadDir, { recursive: true });

  const fullPath = path.join(uploadDir, fileName);
  await writeFile(fullPath, bytes);

  const fileUrl = `/uploads/repairs/${fileName}`;
  const data = await prisma.repairAttachment.create({
    data: {
      repairId: id,
      fileName: file.name,
      fileUrl,
    },
  });

  return ok(data, 201);
}
