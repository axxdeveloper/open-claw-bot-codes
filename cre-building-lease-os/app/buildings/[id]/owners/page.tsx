import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CreateOwnerForm from "@/components/CreateOwnerForm";

export default async function OwnersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const [building, owners, floors] = await Promise.all([
    prisma.building.findUnique({ where: { id } }),
    prisma.owner.findMany({
      where: { buildingId: id },
      orderBy: { createdAt: "desc" },
      include: {
        floorOwners: {
          include: { floor: true },
          orderBy: { startDate: "desc" },
        },
      },
    }),
    prisma.floor.findMany({ where: { buildingId: id }, orderBy: { sortIndex: "asc" } }),
  ]);

  if (!building) return <main>找不到大樓</main>;

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{building.name} - Owners</h1>
        <Link href={`/buildings/${id}`} className="text-sm underline">
          返回總覽
        </Link>
      </div>

      <CreateOwnerForm buildingId={id} />

      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">業主</th>
              <th className="px-3 py-2 text-left">聯絡資訊</th>
              <th className="px-3 py-2 text-left">已指派樓層</th>
            </tr>
          </thead>
          <tbody>
            {owners.map((owner) => (
              <tr key={owner.id} className="border-b last:border-0">
                <td className="px-3 py-2">{owner.name}</td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  {owner.contactName || "-"} / {owner.contactPhone || "-"} / {owner.contactEmail || "-"}
                </td>
                <td className="px-3 py-2 text-xs">
                  {owner.floorOwners.length
                    ? owner.floorOwners
                        .map((fo) => `${fo.floor.label}(${Number(fo.sharePercent)}%)`)
                        .join("、")
                    : "尚未指派"}
                </td>
              </tr>
            ))}
            {owners.length === 0 && (
              <tr>
                <td className="px-3 py-8 text-center text-gray-500" colSpan={3}>
                  尚無業主資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded border bg-white p-3 text-xs text-gray-600">
        可至任一樓層頁面（例如 {floors[0]?.label || "樓層"}）進行業主指派。
      </div>
    </main>
  );
}
