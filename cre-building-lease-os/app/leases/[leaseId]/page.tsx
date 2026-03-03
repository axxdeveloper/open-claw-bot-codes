import { getEffectiveManagementFee } from "@/lib/domain";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PatchLeaseForm from "@/components/PatchLeaseForm";

export default async function LeaseDetailPage({
  params,
}: {
  params: Promise<{ leaseId: string }>;
}) {
  await requireUser();
  const { leaseId } = await params;

  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: {
      building: true,
      tenant: true,
      leaseUnits: { include: { unit: { include: { floor: true } } } },
      occupancies: { include: { tenant: true, unit: true } },
    },
  });

  if (!lease) return <main>找不到租約</main>;

  const effectiveManagementFee = getEffectiveManagementFee(
    lease.managementFee ? Number(lease.managementFee) : null,
    lease.building.managementFee ? Number(lease.building.managementFee) : null,
  );

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">租約 {lease.id.slice(0, 8)}</h1>
      <div className="rounded border bg-white p-4 text-sm">
        <p>大樓：{lease.building.name}</p>
        <p>租戶：{lease.tenant.name}</p>
        <p>
          期間：{lease.startDate.toISOString().slice(0, 10)} ~ {lease.endDate.toISOString().slice(0, 10)}
        </p>
        <p>狀態：{lease.status}</p>
        <p>有效管理費：{effectiveManagementFee ?? "-"}</p>
        <p>
          單位：
          {lease.leaseUnits.map((lu) => `${lu.unit.floor.label}-${lu.unit.code}`).join(", ")}
        </p>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="mb-2 font-semibold">更新租約狀態</h2>
        <PatchLeaseForm leaseId={lease.id} currentStatus={lease.status} />
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="mb-2 font-semibold">Occupancy（含 DRAFT/ACTIVE）</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {lease.occupancies.map((occ) => (
            <li key={occ.id}>
              {occ.unit.code} - {occ.tenant.name} - {occ.status}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
