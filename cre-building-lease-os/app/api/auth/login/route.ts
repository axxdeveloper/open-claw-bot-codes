import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { fail, ok } from "@/lib/api-response";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/schemas";

async function getOrCreatePasswordUser(email: string, password: string) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
      },
    });
  }
  return user;
}

export async function POST(req: Request) {
  const parsed = await parseBody(req, loginSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "登入資料格式錯誤", 422, parsed.error);
  }

  const inputPassword = parsed.data.password;
  const primaryPassword = process.env.AUTH_PAGE_PASSWORD || "0910301562";
  const testPassword = process.env.AUTH_PAGE_PASSWORD_TEST || "0912505345";

  if (inputPassword === primaryPassword || inputPassword === testPassword) {
    const isPrimary = inputPassword === primaryPassword;
    const user = await getOrCreatePasswordUser(
      isPrimary ? "owner@cre.local" : "tester@cre.local",
      inputPassword,
    );

    await createSession(user.id);
    return ok({ user: { id: user.id, email: user.email } });
  }

  if (!parsed.data.email) {
    return fail("INVALID_CREDENTIALS", "密碼錯誤", 401);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user) {
    return fail("INVALID_CREDENTIALS", "帳號或密碼錯誤", 401);
  }

  const isValid = await verifyPassword(inputPassword, user.passwordHash);
  if (!isValid) {
    return fail("INVALID_CREDENTIALS", "帳號或密碼錯誤", 401);
  }

  await createSession(user.id);
  return ok({ user: { id: user.id, email: user.email } });
}
