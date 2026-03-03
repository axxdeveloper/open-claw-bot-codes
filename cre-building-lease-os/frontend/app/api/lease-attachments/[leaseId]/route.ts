import { NextRequest, NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

type LeaseAttachment = {
  id: string;
  leaseId: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  createdAt: string;
};

function storePaths() {
  const root = process.cwd();
  const fileDir = path.join(root, "public", "lease-attachments");
  const metaPath = path.join(root, "uploads", "lease-attachments-meta.json");
  return { fileDir, metaPath };
}

async function readMeta(): Promise<LeaseAttachment[]> {
  const { metaPath } = storePaths();
  try {
    const raw = await readFile(metaPath, "utf-8");
    const rows = JSON.parse(raw);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

async function writeMeta(rows: LeaseAttachment[]) {
  const { metaPath } = storePaths();
  await mkdir(path.dirname(metaPath), { recursive: true });
  await writeFile(metaPath, JSON.stringify(rows, null, 2), "utf-8");
}

export async function GET(_: NextRequest, ctx: { params: Promise<{ leaseId: string }> }) {
  const { leaseId } = await ctx.params;
  const rows = await readMeta();
  const data = rows
    .filter((x) => x.leaseId === leaseId)
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ leaseId: string }> }) {
  const { leaseId } = await ctx.params;

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: { message: "缺少檔案" } }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = `${Date.now()}-${crypto.randomUUID()}-${file.name.replace(/[^\w.\-\u4e00-\u9fa5]/g, "_")}`;
    const { fileDir } = storePaths();
    await mkdir(fileDir, { recursive: true });

    const fullPath = path.join(fileDir, safeName);
    await writeFile(fullPath, bytes);

    const newRow: LeaseAttachment = {
      id: crypto.randomUUID(),
      leaseId,
      fileName: file.name,
      fileUrl: `/lease-attachments/${safeName}`,
      contentType: file.type || "application/octet-stream",
      createdAt: new Date().toISOString(),
    };

    const rows = await readMeta();
    rows.push(newRow);
    await writeMeta(rows);

    return NextResponse.json({ ok: true, data: newRow }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { message: e?.message || "上傳失敗" } },
      { status: 500 },
    );
  }
}
