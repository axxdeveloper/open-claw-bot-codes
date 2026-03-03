import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ManageEntryCta from "@/components/ManageEntryCta";

type SearchParams = {
  status?: string;
  scopeType?: string;
  floorId?: string;
  commonAreaId?: string;
};

export default async function RepairsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();
  const { id } = await params;
  const sp = await searchParams;

  const [building, floors, commonAreas, repairs] = await Promise.all([
    prisma.building.findUnique({ where: { id } }),
    prisma.floor.findMany({ where: { buildingId: id }, orderBy: { sortIndex: "asc" } }),
    prisma.commonArea.findMany({ where: { buildingId: id }, orderBy: { name: "asc" } }),
    prisma.repairRecord.findMany({
      where: {
        buildingId: id,
        ...(sp.status ? { status: sp.status as never } : {}),
        ...(sp.scopeType ? { scopeType: sp.scopeType as never } : {}),
        ...(sp.floorId ? { floorId: sp.floorId } : {}),
        ...(sp.commonAreaId ? { commonAreaId: sp.commonAreaId } : {}),
      },
      include: {
        floor: true,
        commonArea: true,
        repairAttachments: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!building) return <main>找不到大樓</main>;

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{building.name} - Repairs History</h1>
        <Link href={`/buildings/${id}`} className="text-sm underline">
          返回總覽
        </Link>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="mb-2 font-semibold">篩選</h2>
        <form className="grid gap-2 md:grid-cols-4" method="GET">
          <select name="status" defaultValue={sp.status || ""} className="rounded border px-2 py-1 text-sm">
            <option value="">全部狀態</option>
            <option value="DRAFT">DRAFT</option>
            <option value="QUOTED">QUOTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <select name="scopeType" defaultValue={sp.scopeType || ""} className="rounded border px-2 py-1 text-sm">
            <option value="">全部類型</option>
            <option value="FLOOR">FLOOR</option>
            <option value="COMMON_AREA">COMMON_AREA</option>
          </select>
          <select name="floorId" defaultValue={sp.floorId || ""} className="rounded border px-2 py-1 text-sm">
            <option value="">全部樓層</option>
            {floors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            name="commonAreaId"
            defaultValue={sp.commonAreaId || ""}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="">全部公共區域</option>
            {commonAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          <button className="rounded border px-2 py-1 text-sm md:col-span-4">套用篩選</button>
        </form>
      </div>

      <ManageEntryCta
        buildingId={id}
        hint="新增廠商與維修案件，請到資料維護區；此頁面優先提供查詢與篩選。"
      />

      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">項目</th>
              <th className="px-3 py-2 text-left">範圍</th>
              <th className="px-3 py-2 text-left">廠商</th>
              <th className="px-3 py-2 text-left">報價</th>
              <th className="px-3 py-2 text-left">狀態</th>
            </tr>
          </thead>
          <tbody>
            {repairs.map((repair) => (
              <tr key={repair.id} className="border-b last:border-0">
                <td className="px-3 py-2">{repair.item}</td>
                <td className="px-3 py-2 text-xs">
                  {repair.scopeType === "FLOOR"
                    ? `樓層 ${repair.floor?.label || "-"}`
                    : `公共區域 ${repair.commonArea?.name || "-"}`}
                </td>
                <td className="px-3 py-2">{repair.vendorName}</td>
                <td className="px-3 py-2">{Number(repair.quoteAmount)}</td>
                <td className="px-3 py-2">{repair.status}</td>
              </tr>
            ))}
            {repairs.length === 0 && (
              <tr>
                <td className="px-3 py-8 text-center text-gray-500" colSpan={5}>
                  無符合條件的維修紀錄
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
