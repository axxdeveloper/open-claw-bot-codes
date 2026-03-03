import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FloorGenerateForm from "@/components/FloorGenerateForm";
import CreateTenantForm from "@/components/CreateTenantForm";
import CreateLeaseForm from "@/components/CreateLeaseForm";
import CreateVendorForm from "@/components/CreateVendorForm";
import CreateRepairForm from "@/components/CreateRepairForm";
import ImportSourceXlsxForm from "@/components/ImportSourceXlsxForm";

export default async function BuildingManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const [building, floors, tenants, units, commonAreas, vendors, latestBatch] =
    await Promise.all([
      prisma.building.findUnique({ where: { id } }),
      prisma.floor.findMany({ where: { buildingId: id }, orderBy: { sortIndex: "asc" } }),
      prisma.tenant.findMany({ where: { buildingId: id }, orderBy: { name: "asc" } }),
      prisma.unit.findMany({
        where: { buildingId: id, isCurrent: true },
        include: { floor: true },
        orderBy: [{ floor: { sortIndex: "asc" } }, { code: "asc" }],
      }),
      prisma.commonArea.findMany({ where: { buildingId: id }, orderBy: { name: "asc" } }),
      prisma.vendor.findMany({ where: { buildingId: id }, orderBy: { name: "asc" } }),
      prisma.importBatch.findFirst({
        where: { buildingId: id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  if (!building) return <main>找不到大樓</main>;

  return (
    <main className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{building.name} - 資料維護</h1>
          <p className="text-sm text-gray-500">建立/編輯操作統一集中在這裡，主頁面維持查看與查詢。</p>
        </div>
        <Link href={`/buildings/${id}`} className="text-sm underline">
          返回大樓總覽
        </Link>
      </div>

      <ImportSourceXlsxForm buildingId={id} />

      <section className="space-y-2 rounded border bg-white p-4">
        <h2 className="font-semibold">全資料匯出</h2>
        <p className="text-xs text-gray-500">scope=all 會將每個來源 tab 匯出為 CSV，並打包 zip。</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/buildings/${id}/export/csv?scope=all`}
            className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
          >
            匯出全部 tabs CSV（ZIP）
          </a>
          {latestBatch && (
            <a
              href={`/api/buildings/${id}/export/csv?scope=all&batchId=${latestBatch.id}`}
              className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
            >
              匯出最近批次（{latestBatch.id.slice(0, 8)}）
            </a>
          )}
        </div>
      </section>

      <FloorGenerateForm buildingId={id} />

      <section className="space-y-2">
        <h2 className="font-semibold">租戶維護</h2>
        <CreateTenantForm buildingId={id} />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">租約維護</h2>
        <CreateLeaseForm
          buildingId={id}
          tenants={tenants.map((tenant) => ({ id: tenant.id, name: tenant.name }))}
          units={units.map((unit) => ({ id: unit.id, code: unit.code, floorLabel: unit.floor.label }))}
        />
      </section>

      <section className="space-y-2 rounded border bg-white p-4">
        <h2 className="font-semibold">樓層單位進階操作</h2>
        <p className="text-xs text-gray-500">拆分/合併單位、草稿 occupancy、樓層業主指派等操作，請進入對應樓層。</p>
        <div className="flex flex-wrap gap-2">
          {floors.map((floor) => (
            <Link
              key={floor.id}
              href={`/buildings/${id}/floors/${floor.id}`}
              className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
            >
              {floor.label}
            </Link>
          ))}
          {floors.length === 0 && <div className="text-xs text-gray-500">尚無樓層可維護</div>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">維修與廠商維護</h2>
        <CreateVendorForm buildingId={id} />
        <CreateRepairForm
          buildingId={id}
          floors={floors.map((f) => ({ id: f.id, label: f.label }))}
          commonAreas={commonAreas.map((c) => ({ id: c.id, name: c.name }))}
          vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
        />
      </section>
    </main>
  );
}
