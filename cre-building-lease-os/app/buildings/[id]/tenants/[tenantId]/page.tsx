import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TenantDetailWorkspace from "@/components/TenantDetailWorkspace";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string; tenantId: string }>;
}) {
  await requireUser();
  const { id, tenantId } = await params;

  const [building, tenant] = await Promise.all([
    prisma.building.findUnique({ where: { id } }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        leases: {
          include: {
            leaseUnits: { include: { unit: { include: { floor: true } } } },
            leaseAttachments: true,
          },
          orderBy: { startDate: "desc" },
        },
        occupancies: {
          include: { unit: { include: { floor: true } } },
          orderBy: { startDate: "desc" },
        },
      },
    }),
  ]);

  if (!building || !tenant) return <main>找不到租戶資料</main>;

  const leaseRows = tenant.leases.map((lease) => ({
    id: lease.id,
    period: `${lease.startDate.toISOString().slice(0, 10)} ~ ${lease.endDate.toISOString().slice(0, 10)}`,
    status: lease.status,
    unitLabels: lease.leaseUnits.map((leaseUnit) => `${leaseUnit.unit.floor.label}-${leaseUnit.unit.code}`),
    totalGrossArea: lease.leaseUnits.reduce((sum, leaseUnit) => sum + Number(leaseUnit.unit.grossArea || 0), 0),
  }));

  const primaryLease = leaseRows.find((lease) => lease.status === "ACTIVE") || leaseRows[0];

  const fallbackUnitLabels = tenant.occupancies
    .map((occupancy) => `${occupancy.unit.floor.label}-${occupancy.unit.code}`)
    .filter((label, index, arr) => arr.indexOf(label) === index);

  return (
    <main className="space-y-4">
      <TenantDetailWorkspace
        buildingId={id}
        tenant={{
          id: tenant.id,
          name: tenant.name,
          contactName: tenant.contactName || "",
          contactEmail: tenant.contactEmail || "",
          contactPhone: tenant.contactPhone || "",
          taxId: tenant.taxId || "",
          notes: tenant.notes || "",
        }}
        header={{
          buildingName: building.name,
          tenantName: tenant.name,
          address: building.address || "",
          leaseStatus: primaryLease?.status || "-",
          areaLabel: primaryLease?.totalGrossArea ? `${primaryLease.totalGrossArea.toFixed(2)} 坪` : "-",
          unitSummary: (primaryLease?.unitLabels && primaryLease.unitLabels.length > 0 ? primaryLease.unitLabels : fallbackUnitLabels).join("、") || "-",
        }}
        leases={leaseRows.map((lease) => ({
          id: lease.id,
          period: lease.period,
          status: lease.status,
        }))}
        attachments={tenant.leases.flatMap((lease) =>
          lease.leaseAttachments.map((attachment) => ({
            id: attachment.id,
            leaseId: lease.id,
            leaseLabel: `${lease.startDate.toISOString().slice(0, 10)} ~ ${lease.endDate.toISOString().slice(0, 10)}`,
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
            kind: attachment.kind,
          })),
        )}
        timeline={tenant.occupancies.map((occupancy) => ({
          id: occupancy.id,
          unitLabel: `${occupancy.unit.floor.label}-${occupancy.unit.code}`,
          status: occupancy.status,
          startDate: occupancy.startDate.toISOString().slice(0, 10),
          endDate: occupancy.endDate?.toISOString().slice(0, 10) || "迄今",
        }))}
        breadcrumb={
          <div className="text-xs text-gray-500">
            <Link href="/buildings" className="underline">大樓總覽</Link> / <Link href={`/buildings/${id}`} className="underline">{building.name}</Link> / <Link href={`/buildings/${id}/tenants`} className="underline">租戶</Link> / {tenant.name}
          </div>
        }
      />
    </main>
  );
}
