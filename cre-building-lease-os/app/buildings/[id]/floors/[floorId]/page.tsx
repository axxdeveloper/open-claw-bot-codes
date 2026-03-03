import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AddUnitForm from "@/components/AddUnitForm";
import AssignFloorOwnerForm from "@/components/AssignFloorOwnerForm";

const PLACEHOLDER = "Not provided";

function formatDate(value: Date | null | undefined) {
  if (!value) return "Present";
  return value.toISOString().slice(0, 10);
}

function formatArea(value: number | null | undefined) {
  if (value == null) return "-";
  return Number(value).toLocaleString();
}

function fallback(value: string | null | undefined) {
  return value?.trim() || PLACEHOLDER;
}

export default async function FloorDetailPage({
  params,
}: {
  params: Promise<{ id: string; floorId: string }>;
}) {
  await requireUser();
  const { id, floorId } = await params;

  const [building, floor, owners, occupancies] = await Promise.all([
    prisma.building.findUnique({ where: { id } }),
    prisma.floor.findUnique({
      where: { id: floorId },
      include: {
        units: {
          where: { isCurrent: true },
          orderBy: { code: "asc" },
        },
        floorOwners: {
          include: { owner: true },
          orderBy: { startDate: "desc" },
        },
        floorFiles: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.owner.findMany({ where: { buildingId: id }, orderBy: { name: "asc" } }),
    prisma.occupancy.findMany({
      where: { buildingId: id, unit: { floorId } },
      include: {
        tenant: true,
        lease: {
          include: {
            leaseAttachments: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
        unit: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!building || !floor) return <main>找不到樓層</main>;

  const unitsCount = floor.units.length;
  const totalGrossArea = floor.units.reduce((sum, unit) => sum + Number(unit.grossArea || 0), 0);
  const totalNetArea = floor.units.reduce((sum, unit) => sum + Number(unit.netArea || 0), 0);

  const tenantMap = new Map(occupancies.map((row) => [row.tenant.id, row.tenant]));
  const tenants = Array.from(tenantMap.values());
  const activeOccupancy = occupancies.find((row) => row.status === "ACTIVE") || occupancies[0];
  const secondaryTenant = tenants.find((tenant) => tenant.id !== activeOccupancy?.tenant.id) || tenants[0];

  const contactRows = [
    {
      id: "primary",
      role: "Primary Contact",
      name: fallback(activeOccupancy?.tenant.contactName || activeOccupancy?.tenant.name),
      phone: fallback(activeOccupancy?.tenant.contactPhone),
      email: fallback(activeOccupancy?.tenant.contactEmail),
    },
    {
      id: "finance",
      role: "Finance / Billing",
      name: fallback(secondaryTenant?.contactName || secondaryTenant?.name),
      phone: fallback(secondaryTenant?.contactPhone),
      email: fallback(secondaryTenant?.contactEmail),
    },
    {
      id: "ops",
      role: "Site Operations",
      name: fallback(activeOccupancy?.tenant.name || secondaryTenant?.name),
      phone: fallback(activeOccupancy?.tenant.contactPhone || secondaryTenant?.contactPhone),
      email: fallback(activeOccupancy?.tenant.contactEmail || secondaryTenant?.contactEmail),
    },
  ];

  const leaseMap = new Map<string, (typeof occupancies)[number]["lease"]>();
  for (const row of occupancies) {
    if (row.lease && !leaseMap.has(row.lease.id)) {
      leaseMap.set(row.lease.id, row.lease);
    }
  }
  const leases = Array.from(leaseMap.values()).filter(
    (lease): lease is NonNullable<(typeof occupancies)[number]["lease"]> => Boolean(lease),
  );

  const leaseAttachments = leases.flatMap((lease) =>
    lease.leaseAttachments.map((attachment) => ({
      ...attachment,
      leaseLabel: `${formatDate(lease.startDate)} to ${formatDate(lease.endDate)} (${lease.status})`,
    })),
  );

  const unitPhotos = floor.floorFiles.filter((file) => file.kind === "IMAGE" || file.kind === "FLOORPLAN");

  const ownershipDisplay =
    floor.floorOwners.length > 0
      ? floor.floorOwners.map((row) => fallback(row.owner.name)).join(" / ")
      : PLACEHOLDER;

  const rawDoorNumberText = building.address?.trim() || "";
  const doorNumberRows = rawDoorNumberText
    ? rawDoorNumberText
        .split(/\n|;|；/)
        .map((row) => row.trim())
        .filter(Boolean)
    : [];

  return (
    <main className="space-y-4 pb-6">
      <section className="rounded-xl border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-4 text-white md:p-5">
        <div className="text-xs text-slate-200">
          <Link href="/buildings" className="underline underline-offset-2">
            Buildings
          </Link>{" "}
          /{" "}
          <Link href={`/buildings/${id}`} className="underline underline-offset-2">
            {building.name}
          </Link>{" "}
          / {floor.label}
        </div>

        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-slate-300">Floor Context</p>
            <h1 className="text-2xl font-semibold md:text-3xl">{floor.label} - Unit Details</h1>
            <p className="text-sm text-slate-200">
              Data-first summary for ownership, tenants, contacts, lease documents, photos, and location references.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-100">
              <span className="rounded-full border border-slate-400/50 bg-slate-700/60 px-3 py-1">Units: {unitsCount}</span>
              <span className="rounded-full border border-slate-400/50 bg-slate-700/60 px-3 py-1">Active tenants: {tenants.length}</span>
              <span className="rounded-full border border-slate-400/50 bg-slate-700/60 px-3 py-1">Address: {fallback(building.address)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button type="button" className="rounded-md border border-white/50 px-3 py-1.5 text-sm hover:bg-white/10">
              Activity Log
            </button>
            <button type="button" className="rounded-md border border-white/50 px-3 py-1.5 text-sm hover:bg-white/10">
              Edit All Fields
            </button>
            <Link href={`/buildings/${id}/floors`} className="rounded-md border border-white/50 px-3 py-1.5 text-sm hover:bg-white/10">
              Back to Floors
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <article className="rounded-xl border bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">Ownership & Property</h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <InfoItem label="Building" value={building.name} />
              <InfoItem label="Floor" value={floor.label} />
              <InfoItem label="產權" value={ownershipDisplay} />
              <InfoItem
                label="坪數"
                value={
                  totalGrossArea || totalNetArea
                    ? `總坪數 ${formatArea(totalGrossArea)} 坪 / 室內 ${formatArea(totalNetArea)} 坪`
                    : PLACEHOLDER
                }
              />
            </div>

            <div className="mt-3 rounded-lg border bg-slate-50 p-3 text-sm">
              <p className="text-xs text-gray-500">門牌號碼（支援多筆 / 原樣呈現）</p>
              {rawDoorNumberText ? (
                <div className="mt-2 space-y-2">
                  <pre className="whitespace-pre-wrap break-words rounded border bg-white p-2 text-xs text-gray-700">{rawDoorNumberText}</pre>
                  <div className="flex flex-wrap gap-1">
                    {doorNumberRows.map((door, index) => (
                      <span key={`${door}-${index}`} className="rounded-full border bg-white px-2 py-0.5 text-xs text-gray-700">
                        {door}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-sm text-gray-500">{PLACEHOLDER}</p>
              )}
            </div>

            <table className="mt-4 w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left">Owner</th>
                  <th className="px-2 py-1 text-left">Share</th>
                  <th className="px-2 py-1 text-left">Term</th>
                </tr>
              </thead>
              <tbody>
                {floor.floorOwners.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="px-2 py-1">{fallback(row.owner.name)}</td>
                    <td className="px-2 py-1">{Number(row.sharePercent)}%</td>
                    <td className="px-2 py-1 text-xs">
                      {formatDate(row.startDate)} to {formatDate(row.endDate)}
                    </td>
                  </tr>
                ))}
                {floor.floorOwners.length === 0 && (
                  <tr>
                    <td className="px-2 py-3 text-center text-gray-500" colSpan={3}>
                      No ownership records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </article>

          <article className="rounded-xl border bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">Tenant Information</h2>
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left">Unit</th>
                  <th className="px-2 py-1 text-left">Area</th>
                  <th className="px-2 py-1 text-left">Tenants</th>
                </tr>
              </thead>
              <tbody>
                {floor.units.map((unit) => {
                  const unitOccupancies = occupancies.filter((row) => row.unitId === unit.id);
                  return (
                    <tr key={unit.id} className="border-b align-top last:border-0">
                      <td className="px-2 py-1">
                        {floor.label}-{unit.code}
                      </td>
                      <td className="px-2 py-1 text-xs">
                        Gross {formatArea(Number(unit.grossArea))} / Net {formatArea(unit.netArea ? Number(unit.netArea) : null)}
                      </td>
                      <td className="px-2 py-1 text-xs">
                        {unitOccupancies.map((occ) => (
                          <div key={occ.id}>
                            {fallback(occ.tenant.name)} ({occ.status})
                          </div>
                        ))}
                        {unitOccupancies.length === 0 && PLACEHOLDER}
                      </td>
                    </tr>
                  );
                })}
                {floor.units.length === 0 && (
                  <tr>
                    <td className="px-2 py-3 text-center text-gray-500" colSpan={3}>
                      No units on this floor yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </article>

          <article className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Contact Information</h2>
              <span className="text-xs text-gray-500">3 contact roles</span>
            </div>
            <div className="space-y-2">
              {contactRows.map((contact) => (
                <div key={contact.id} className="rounded-lg border bg-slate-50 p-3 text-sm">
                  <p className="text-xs text-gray-500">{contact.role}</p>
                  <div className="mt-1 grid gap-1 md:grid-cols-3">
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-gray-700">{contact.phone}</p>
                    <p className="break-all text-gray-700">{contact.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <details className="rounded-xl border bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold">Admin Tools (kept for existing workflows)</summary>
            <div className="mt-3 space-y-4">
              <section>
                <h3 className="mb-2 text-sm font-medium">Assign Floor Owner</h3>
                <AssignFloorOwnerForm floorId={floor.id} owners={owners.map((owner) => ({ id: owner.id, name: owner.name }))} />
              </section>
              <section>
                <h3 className="mb-2 text-sm font-medium">Add Unit</h3>
                <AddUnitForm floorId={floor.id} />
              </section>
            </div>
          </details>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <article className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Lease Agreement</h2>
              <button type="button" className="rounded border px-2 py-1 text-xs hover:bg-slate-50">
                Upload Revision
              </button>
            </div>

            <div className="space-y-2 text-sm">
              {leaseAttachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border p-3 hover:bg-slate-50"
                >
                  <p className="font-medium">{attachment.fileName}</p>
                  <p className="text-xs text-gray-500">
                    {attachment.kind} · {attachment.leaseLabel}
                  </p>
                </a>
              ))}
              {leaseAttachments.length === 0 && (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-gray-500">
                  No lease attachments yet.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Unit Photos</h2>
              <button type="button" className="rounded border px-2 py-1 text-xs hover:bg-slate-50">
                Add Photo
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {unitPhotos.map((file) => {
                const imageLike = file.fileUrl.startsWith("data:image") || file.kind === "IMAGE";
                return (
                  <a key={file.id} href={file.fileUrl} target="_blank" rel="noreferrer" className="rounded-lg border p-2 hover:bg-slate-50">
                    <div className="mb-2 h-24 overflow-hidden rounded bg-slate-100">
                      {imageLike ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={file.fileUrl} alt={file.fileName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-500">{file.kind}</div>
                      )}
                    </div>
                    <p className="line-clamp-1 text-xs font-medium">{file.fileName}</p>
                  </a>
                );
              })}
              <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed p-2 text-center text-xs text-gray-500">
                + Add photo placeholder
              </div>
            </div>
          </article>

          <article className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Location Mapping</h2>
              <button type="button" className="rounded border px-2 py-1 text-xs hover:bg-slate-50">
                Update Pin
              </button>
            </div>
            <div className="rounded-lg border bg-gradient-to-br from-slate-100 to-slate-200 p-4">
              <div className="flex h-36 items-center justify-center rounded border border-dashed border-slate-400 bg-white/60 text-sm text-slate-600">
                Map preview placeholder
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="rounded border px-2 py-1 text-xs hover:bg-white">
                  Open in Maps
                </button>
                <button type="button" className="rounded border px-2 py-1 text-xs hover:bg-white">
                  Copy Coordinates
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium">{value || PLACEHOLDER}</p>
    </div>
  );
}
