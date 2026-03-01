import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "cre_auth";
const DEFAULT_PASSWORD = "0910301562";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get("password") || "").trim();
  const next = String(form.get("next") || "/buildings");
  const expected = process.env.AUTH_PAGE_PASSWORD || DEFAULT_PASSWORD;

  const targetPath = next.startsWith("/") ? next : "/buildings";
  if (!password || password !== expected) {
    const failPath = `/login?next=${encodeURIComponent(targetPath)}&error=1`;
    return new NextResponse(null, {
      status: 303,
      headers: { Location: failPath },
    });
  }

  const res = new NextResponse(null, {
    status: 303,
    headers: { Location: targetPath },
  });
  res.cookies.set(COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "strict",
    secure: false,
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return res;
}
