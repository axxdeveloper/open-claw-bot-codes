import { destroySession } from "@/lib/auth";
import { ok } from "@/lib/api-response";

export async function POST() {
  await destroySession();
  return ok({ loggedOut: true });
}
