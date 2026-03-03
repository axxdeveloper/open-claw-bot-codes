import { z } from "zod";

export async function parseBody<T>(req: Request, schema: z.ZodType<T>) {
  const payload = await req.json();
  const result = schema.safeParse(payload);
  if (!result.success) {
    return { error: result.error.flatten() } as const;
  }
  return { data: result.data } as const;
}
