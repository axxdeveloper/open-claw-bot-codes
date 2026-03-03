import Link from "next/link";
import { RepairStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CreateRepairForm from "@/components/CreateRepairForm";
import CreateVendorForm from "@/components/CreateVendorForm";

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
      include: { floor: true, commonArea: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!building) return <main>找不到大樓</main>;

  const newTicketStatuses: RepairStatus[] = [RepairStatus.DRAFT, RepairStatus.QUOTED];
  const inProgressStatuses: RepairStatus[] = [RepairStatus.APPROVED, RepairStatus.IN_PROGRESS];
  const completedStatuses: RepairStatus[] = [RepairStatus.COMPLETED, RepairStatus.ACCEPTED];

  const newTickets = repairs.filter((item) => newTicketStatuses.includes(item.status));
  const inProgress = repairs.filter((item) => inProgressStatuses.includes(item.status));
  const completed = repairs.filter((item) => completedStatuses.includes(item.status));

  return (
    <main className="space-y-4">
      <div className="text-xs text-gray-500">
        <Link href="/buildings" className="underline">大樓總覽</Link> / <Link href={`/buildings/${id}`} className="underline">{building.name}</Link> / 維修流程
      </div>

      <h1 className="text-2xl font-semibold">維修流程管理</h1>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">1) 通報與建立工單</h2>
        <CreateRepairForm
          buildingId={id}
          floors={floors.map((f) => ({ id: f.id, label: f.label }))}
          commonAreas={commonAreas.map((c) => ({ id: c.id, name: c.name }))}
          vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
        />
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">2) 指派廠商（可先新增廠商）</h2>
        <CreateVendorForm buildingId={id} />
        <div className="mt-3 text-xs text-gray-600">新工單列表：</div>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          {newTickets.map((item) => (
            <li key={item.id}>
              {item.item} / {item.floor?.label || item.commonArea?.name || "-"} / {item.vendorName} / {item.status}
            </li>
          ))}
          {newTickets.length === 0 && <li className="text-gray-500">目前沒有新工單</li>}
        </ul>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">3) 施工中</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {inProgress.map((item) => (
            <li key={item.id}>
              {item.item} / {item.vendorName} / 狀態 {item.status}
            </li>
          ))}
          {inProgress.length === 0 && <li className="text-gray-500">目前沒有施工中案件</li>}
        </ul>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">4) 完工紀錄</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {completed.map((item) => (
            <li key={item.id}>
              {item.item} / {item.vendorName} / 完成金額 {item.finalAmount ? Number(item.finalAmount) : "-"} / {item.status}
            </li>
          ))}
          {completed.length === 0 && <li className="text-gray-500">目前沒有完工案件</li>}
        </ul>
      </section>
    </main>
  );
}
