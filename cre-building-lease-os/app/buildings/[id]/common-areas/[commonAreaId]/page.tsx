import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CommonAreaDetailPage({
  params,
}: {
  params: Promise<{ id: string; commonAreaId: string }>;
}) {
  await requireUser();
  const { id, commonAreaId } = await params;

  const area = await prisma.commonArea.findUnique({
    where: { id: commonAreaId },
    include: {
      floor: true,
      repairRecords: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!area) return <main>找不到公共區域</main>;

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{area.name}</h1>
        <Link href={`/buildings/${id}/common-areas`} className="text-sm underline">
          返回公共區域
        </Link>
      </div>

      <div className="rounded border bg-white p-4 text-sm">
        <p>樓層：{area.floor?.label || "-"}</p>
        <p>代碼：{area.code || "-"}</p>
        <p>描述：{area.description || "-"}</p>
        <p>備註：{area.notes || "-"}</p>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="mb-2 font-semibold">維修歷史</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {area.repairRecords.map((repair) => (
            <li key={repair.id}>
              {repair.item} / {repair.status} / 報價 {Number(repair.quoteAmount)}
            </li>
          ))}
          {area.repairRecords.length === 0 && <li className="text-gray-500">尚無維修紀錄</li>}
        </ul>
      </div>
    </main>
  );
}
