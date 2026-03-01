import { NextRequest, NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type RowOverride = {
  entryKey: string;
  address?: string;
  room?: string;
  household?: string;
  tenantName?: string;
};

type Store = Record<string, RowOverride[]>;

function storePath() {
  return path.join(process.cwd(), "uploads", "source113-overrides.json");
}

async function readStore(): Promise<Store> {
  try {
    const raw = await readFile(storePath(), "utf-8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(data: Store) {
  const p = storePath();
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET(_: NextRequest, ctx: { params: Promise<{ buildingId: string }> }) {
  const { buildingId } = await ctx.params;
  const data = await readStore();
  return NextResponse.json({ ok: true, data: data[buildingId] || [] });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ buildingId: string }> }) {
  const { buildingId } = await ctx.params;

  try {
    const body = await req.json();
    const patch: RowOverride = {
      entryKey: String(body?.entryKey || ""),
      address: body?.address == null ? undefined : String(body.address),
      room: body?.room == null ? undefined : String(body.room),
      household: body?.household == null ? undefined : String(body.household),
      tenantName: body?.tenantName == null ? undefined : String(body.tenantName),
    };

    if (!patch.entryKey) {
      return NextResponse.json({ ok: false, error: { message: "entryKey 必填" } }, { status: 400 });
    }

    const all = await readStore();
    const list = Array.isArray(all[buildingId]) ? all[buildingId] : [];
    const idx = list.findIndex((x) => x.entryKey === patch.entryKey);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...patch };
    } else {
      list.push(patch);
    }
    all[buildingId] = list;
    await writeStore(all);

    return NextResponse.json({ ok: true, data: patch });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: { message: e?.message || "儲存失敗" } }, { status: 500 });
  }
}
