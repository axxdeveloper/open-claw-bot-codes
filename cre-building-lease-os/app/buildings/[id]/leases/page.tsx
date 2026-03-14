import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CreateLeaseForm from "@/components/CreateLeaseForm";
import { getEffectiveManagementFee } from "@/lib/domain";

export default async function BuildingLeasesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const [building, tenants, units, leases] = await Promise.all([
    prisma.building.findUnique({ where: { id } }),
    prisma.tenant.findMany({ where: { buildingId: id }, orderBy: { name: "asc" } }),
    prisma.unit.findMany({
      where: { buildingId: id, isCurrent: true },
      include: { floor: true },
      orderBy: [{ floor: { sortIndex: "asc" } }, { code: "asc" }],
    }),
    prisma.lease.findMany({
      where: { buildingId: id },
      include: {
        tenant: true,
        leaseUnits: { include: { unit: { include: { floor: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!building) return <main>找不到大樓</main>;

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">租約管理</h1>
      <CreateLeaseForm
        buildingId={id}
        tenants={tenants.map((t) => ({ id: t.id, name: t.name }))}
        units={units.map((u) => ({ id: u.id, code: u.code, floorLabel: u.floor.label }))}
      />

      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">租戶</th>
              <th className="px-3 py-2 text-left">期間</th>
              <th className="px-3 py-2 text-left">單位</th>
              <th className="px-3 py-2 text-left">狀態</th>
              <th className="px-3 py-2 text-left">有效管理費</th>
            </tr>
          </thead>
          <tbody>
            {leases.map((lease) => (
              <tr key={lease.id} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <Link href={`/leases/${lease.id}`} className="underline">
                    {lease.tenant.name}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  {lease.startDate.toISOString().slice(0, 10)} ~ {lease.endDate.toISOString().slice(0, 10)}
                </td>
                <td className="px-3 py-2">
                  {lease.leaseUnits.map((lu) => `${lu.unit.floor.label}-${lu.unit.code}`).join(", ")}
                </td>
                <td className="px-3 py-2">{lease.status}</td>
                <td className="px-3 py-2">
                  {getEffectiveManagementFee(
                    lease.managementFee ? Number(lease.managementFee) : null,
                    building.managementFee ? Number(building.managementFee) : null,
                  ) ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
