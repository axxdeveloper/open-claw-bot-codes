import { NextResponse } from "next/server";

const COOKIE_NAME = "cre_auth";

export async function POST() {
  const res = NextResponse.json({ ok: true, data: { loggedOut: true } });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: false,
    maxAge: 0,
    path: "/",
  });
  return res;
}
