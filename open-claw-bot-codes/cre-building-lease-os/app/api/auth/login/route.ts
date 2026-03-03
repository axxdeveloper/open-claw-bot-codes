import { createSession, verifyPassword } from "@/lib/auth";
import { fail, ok } from "@/lib/api-response";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  const parsed = await parseBody(req, loginSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "登入資料格式錯誤", 422, parsed.error);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user) {
    return fail("INVALID_CREDENTIALS", "帳號或密碼錯誤", 401);
  }

  const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return fail("INVALID_CREDENTIALS", "帳號或密碼錯誤", 401);
  }

  await createSession(user.id);
  return ok({ user: { id: user.id, email: user.email } });
}
