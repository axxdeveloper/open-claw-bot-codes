import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ManageEntryCta from "@/components/ManageEntryCta";

export default async function TenantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const tenants = await prisma.tenant.findMany({
    where: { buildingId: id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">租戶名單</h1>
      <ManageEntryCta buildingId={id} hint="新增租戶或修正聯絡資料，請到資料維護區。" />
      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">名稱</th>
              <th className="px-3 py-2 text-left">聯絡人</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">電話</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="px-3 py-2">{t.name}</td>
                <td className="px-3 py-2">{t.contactName || "-"}</td>
                <td className="px-3 py-2">{t.contactEmail || "-"}</td>
                <td className="px-3 py-2">{t.contactPhone || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
