import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FloorGenerateForm from "@/components/FloorGenerateForm";

export default async function BuildingFloorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const [building, floors] = await Promise.all([
    prisma.building.findUnique({ where: { id } }),
    prisma.floor.findMany({
      where: { buildingId: id },
      orderBy: { sortIndex: "asc" },
      include: {
        _count: {
          select: { units: true },
        },
      },
    }),
  ]);

  if (!building) return <main>找不到大樓</main>;

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">{building.name} - 樓層管理</h1>
      <FloorGenerateForm buildingId={id} />
      <div className="rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-2">樓層</th>
              <th className="px-3 py-2">sortIndex</th>
              <th className="px-3 py-2">現行單位數</th>
            </tr>
          </thead>
          <tbody>
            {floors.map((f) => (
              <tr key={f.id} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <Link href={`/buildings/${id}/floors/${f.id}`} className="underline">
                    {f.label}
                  </Link>
                </td>
                <td className="px-3 py-2">{f.sortIndex}</td>
                <td className="px-3 py-2">{f._count.units}</td>
              </tr>
            ))}
            {floors.length === 0 && (
              <tr>
                <td className="px-3 py-8 text-center text-gray-500" colSpan={3}>
                  尚未產生樓層
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
