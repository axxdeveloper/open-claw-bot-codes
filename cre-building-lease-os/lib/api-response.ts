import { NextResponse } from "next/server";

export type ApiEnvelope<T = unknown> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { code: string; message: string; details?: unknown };
    };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiEnvelope<T>>({ ok: true, data }, { status });
}

export function fail(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
) {
  return NextResponse.json<ApiEnvelope>(
    {
      ok: false,
      error: { code, message, details },
    },
    { status },
  );
}

export async function withApi<T>(handler: () => Promise<T>) {
  try {
    const data = await handler();
    return ok(data);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return fail("INTERNAL_ERROR", message, 500);
  }
}
