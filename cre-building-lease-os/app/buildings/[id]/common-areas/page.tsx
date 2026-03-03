import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CreateCommonAreaForm from "@/components/CreateCommonAreaForm";

export default async function CommonAreasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const [building, floors, commonAreas] = await Promise.all([
    prisma.building.findUnique({ where: { id } }),
    prisma.floor.findMany({ where: { buildingId: id }, orderBy: { sortIndex: "asc" } }),
    prisma.commonArea.findMany({
      where: { buildingId: id },
      include: { floor: true, _count: { select: { repairRecords: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!building) return <main>找不到大樓</main>;

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{building.name} - 公共區域</h1>
        <Link href={`/buildings/${id}`} className="text-sm underline">
          返回總覽
        </Link>
      </div>

      <CreateCommonAreaForm
        buildingId={id}
        floors={floors.map((f) => ({ id: f.id, label: f.label }))}
      />

      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">名稱</th>
              <th className="px-3 py-2 text-left">樓層</th>
              <th className="px-3 py-2 text-left">維修數</th>
            </tr>
          </thead>
          <tbody>
            {commonAreas.map((area) => (
              <tr key={area.id} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <Link className="underline" href={`/buildings/${id}/common-areas/${area.id}`}>
                    {area.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{area.floor?.label || "-"}</td>
                <td className="px-3 py-2">{area._count.repairRecords}</td>
              </tr>
            ))}
            {commonAreas.length === 0 && (
              <tr>
                <td className="px-3 py-8 text-center text-gray-500" colSpan={3}>
                  尚無公共區域資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
