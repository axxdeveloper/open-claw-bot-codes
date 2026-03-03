import { OccupancyStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ManageEntryCta from "@/components/ManageEntryCta";

export default async function StackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const floors = await prisma.floor.findMany({
    where: { buildingId: id },
    orderBy: { sortIndex: "desc" },
    include: {
      units: {
        where: { isCurrent: true },
        orderBy: { code: "asc" },
        include: {
          occupancies: {
            where: { status: OccupancyStatus.ACTIVE },
            include: { tenant: true, lease: true },
            orderBy: { startDate: "desc" },
          },
        },
      },
    },
  });

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Stacking 圖 (列表版)</h1>
      <p className="text-sm text-gray-500">僅顯示 ACTIVE occupancy</p>
      <ManageEntryCta buildingId={id} hint="若需調整租戶/單位資料，請前往資料維護區。" />

      <div className="space-y-3">
        {floors.map((floor) => (
          <div key={floor.id} className="rounded border bg-white p-4">
            <h2 className="mb-2 font-semibold">{floor.label}</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {floor.units.map((unit) => {
                const active = unit.occupancies[0];
                return (
                  <div key={unit.id} className="rounded border p-2 text-sm">
                    <div className="font-semibold">{unit.code}</div>
                    {active ? (
                      <div className="text-blue-700">
                        {active.tenant.name} / Lease {active.leaseId?.slice(0, 8)}
                      </div>
                    ) : (
                      <div className="text-gray-400">空置</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
