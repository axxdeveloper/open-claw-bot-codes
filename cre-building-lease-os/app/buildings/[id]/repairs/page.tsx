import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RepairsKanbanBoard from "@/components/RepairsKanbanBoard";

export default async function RepairsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const [building, floors, commonAreas, vendors, repairs] = await Promise.all([
    prisma.building.findUnique({ where: { id } }),
    prisma.floor.findMany({ where: { buildingId: id }, orderBy: { sortIndex: "asc" } }),
    prisma.commonArea.findMany({ where: { buildingId: id }, orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ where: { buildingId: id }, orderBy: { name: "asc" } }),
    prisma.repairRecord.findMany({
      where: { buildingId: id },
      include: { floor: true, commonArea: true, repairAttachments: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!building) return <main>找不到大樓</main>;

  return (
    <main className="space-y-4">
      <div className="text-xs text-gray-500">
        <Link href="/buildings" className="underline">
          大樓總覽
        </Link>{" "}
        /{" "}
        <Link href={`/buildings/${id}`} className="underline">
          {building.name}
        </Link>{" "}
        / 維修流程
      </div>

      <RepairsKanbanBoard
        buildingId={id}
        buildingName={building.name}
        floors={floors.map((f) => ({ id: f.id, label: f.label }))}
        commonAreas={commonAreas.map((c) => ({ id: c.id, name: c.name }))}
        vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
        repairs={repairs.map((item) => ({
          id: item.id,
          item: item.item,
          description: item.description,
          status: item.status,
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          quoteAmount: Number(item.quoteAmount),
          approvedAmount: item.approvedAmount ? Number(item.approvedAmount) : null,
          finalAmount: item.finalAmount ? Number(item.finalAmount) : null,
          reportedAt: item.reportedAt.toISOString(),
          createdAt: item.createdAt.toISOString(),
          floor: item.floor ? { id: item.floor.id, label: item.floor.label } : null,
          commonArea: item.commonArea ? { id: item.commonArea.id, name: item.commonArea.name } : null,
          repairAttachments: item.repairAttachments.map((file) => ({
            id: file.id,
            fileUrl: file.fileUrl,
            fileName: file.fileName,
          })),
        }))}
      />
    </main>
  );
}
