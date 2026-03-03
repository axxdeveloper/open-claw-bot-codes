import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TenantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const [building, tenants] = await Promise.all([
    prisma.building.findUnique({ where: { id } }),
    prisma.tenant.findMany({
      where: { buildingId: id },
      orderBy: { createdAt: "desc" },
      include: { leases: true },
    }),
  ]);

  if (!building) return <main>找不到大樓</main>;

  return (
    <main className="space-y-4">
      <div className="text-xs text-gray-500">
        <Link href="/buildings" className="underline">
          大樓總覽
        </Link>{" "}
        / <Link href={`/buildings/${id}`} className="underline">{building.name}</Link> / 租戶
      </div>

      <h1 className="text-2xl font-semibold">租戶名單</h1>

      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">租戶</th>
              <th className="px-3 py-2 text-left">聯絡窗口</th>
              <th className="px-3 py-2 text-left">聯絡方式</th>
              <th className="px-3 py-2 text-left">租約數</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <Link href={`/buildings/${id}/tenants/${tenant.id}`} className="underline">
                    {tenant.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{tenant.contactName || "-"}</td>
                <td className="px-3 py-2 text-xs">{tenant.contactEmail || "-"} / {tenant.contactPhone || "-"}</td>
                <td className="px-3 py-2">{tenant.leases.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
