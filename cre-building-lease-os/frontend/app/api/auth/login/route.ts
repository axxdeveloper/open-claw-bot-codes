import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "cre_auth";
const DEFAULT_PASSWORD = "0910301562";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const password = String(body?.password || "").trim();
  const expected = process.env.AUTH_PAGE_PASSWORD || DEFAULT_PASSWORD;

  if (!password || password !== expected) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "UNAUTHORIZED", message: "密碼錯誤" },
      },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true, data: { authenticated: true } });
  res.cookies.set(COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "strict",
    secure: false,
    maxAge: 60 * 60 * 12,
    path: "/",
  });

  return res;
}
