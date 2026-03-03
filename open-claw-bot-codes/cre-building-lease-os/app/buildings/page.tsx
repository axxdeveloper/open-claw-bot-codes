import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function BuildingsPage() {
  await requireUser();
  const buildings = await prisma.building.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { floors: true, units: true, leases: true } } },
  });

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">大樓列表</h1>
        <Link href="/buildings/new" className="rounded bg-black px-3 py-2 text-white">
          新增大樓
        </Link>
      </div>
      <div className="grid gap-3">
        {buildings.map((b) => (
          <Link key={b.id} href={`/buildings/${b.id}`} className="rounded border bg-white p-4 hover:bg-gray-50">
            <div className="font-semibold">{b.name}</div>
            <div className="text-sm text-gray-500">{b.address || "未填地址"}</div>
            <div className="mt-2 text-xs text-gray-600">
              樓層 {b._count.floors} / 單位 {b._count.units} / 租約 {b._count.leases}
            </div>
          </Link>
        ))}
        {buildings.length === 0 && (
          <div className="rounded border border-dashed p-8 text-center text-sm text-gray-500">
            尚無大樓，請先建立。
          </div>
        )}
      </div>
    </main>
  );
}
