import { fail, ok } from "@/lib/api-response";
import { generateFloorSpecs } from "@/lib/domain";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { floorGenerateSchema } from "@/lib/schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiUser();
  } catch {
    return fail("UNAUTHORIZED", "請先登入", 401);
  }

  const { id } = await params;
  const parsed = await parseBody(req, floorGenerateSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "樓層產生參數錯誤", 422, parsed.error);
  }

  const specs = generateFloorSpecs(
    parsed.data.basementFloors,
    parsed.data.aboveGroundFloors,
  );

  const result = await prisma.$transaction(async (tx) => {
    await tx.floor.deleteMany({ where: { buildingId: id } });
    return tx.floor.createManyAndReturn({
      data: specs.map((item) => ({
        buildingId: id,
        label: item.label,
        sortIndex: item.sortIndex,
      })),
    });
  });

  return ok(result, 201);
}
