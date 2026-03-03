import JSZip from "jszip";
import { fail } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeCell, toCsvRow } from "@/lib/source-xlsx";

export const runtime = "nodejs";

function sanitizeFileName(input: string): string {
  return input
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiUser();
  } catch {
    return fail("UNAUTHORIZED", "請先登入", 401);
  }

  const { id } = await params;
  const url = new URL(req.url);

  const scope = url.searchParams.get("scope") ?? "";
  if (scope !== "all") {
    return fail("VALIDATION_ERROR", "目前僅支援 scope=all", 422);
  }

  const batchId = url.searchParams.get("batchId") ?? undefined;

  const batch = await prisma.importBatch.findFirst({
    where: {
      buildingId: id,
      ...(batchId ? { id: batchId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      sourceSheets: {
        orderBy: { sheetOrder: "asc" },
        include: {
          sourceRows: {
            orderBy: { rowIndex: "asc" },
          },
        },
      },
    },
  });

  if (!batch) {
    return fail("NOT_FOUND", "找不到可匯出的匯入批次", 404);
  }

  const zip = new JSZip();

  const summaryRows: string[] = [
    toCsvRow(["sheetOrder", "sheetName", "rowCount", "headerRow"]),
  ];

  for (const sheet of batch.sourceSheets) {
    const columns = Array.isArray(sheet.columns)
      ? sheet.columns.map((column) => normalizeCell(column))
      : [];

    const csvLines = [toCsvRow(columns)];

    for (const row of sheet.sourceRows) {
      const rowObject = row.rowObject as Record<string, unknown>;
      const csvCells = columns.map((column) => normalizeCell(rowObject?.[column]));
      csvLines.push(toCsvRow(csvCells));
    }

    const fileName = `${String(sheet.sheetOrder + 1).padStart(2, "0")}-${sanitizeFileName(sheet.name)}.csv`;
    zip.file(fileName, `${csvLines.join("\n")}\n`);

    summaryRows.push(
      toCsvRow([sheet.sheetOrder + 1, sheet.name, sheet.sourceRows.length, sheet.headerRow]),
    );
  }

  const repairs = await prisma.repairRecord.findMany({
    where: { buildingId: id },
    include: {
      floor: true,
      commonArea: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const repairHeader = [
    "id",
    "scopeType",
    "floorLabel",
    "commonAreaName",
    "item",
    "vendorName",
    "vendorTaxId",
    "quoteAmount",
    "approvedAmount",
    "finalAmount",
    "status",
    "reportedAt",
    "completedAt",
    "acceptedAt",
  ];
  const repairLines = [toCsvRow(repairHeader)];
  for (const repair of repairs) {
    repairLines.push(
      toCsvRow([
        repair.id,
        repair.scopeType,
        repair.floor?.label ?? "",
        repair.commonArea?.name ?? "",
        repair.item,
        repair.vendorName,
        repair.vendorTaxId ?? "",
        repair.quoteAmount,
        repair.approvedAmount ?? "",
        repair.finalAmount ?? "",
        repair.status,
        repair.reportedAt,
        repair.completedAt ?? "",
        repair.acceptedAt ?? "",
      ]),
    );
  }
  zip.file("all-data-repairs.csv", `${repairLines.join("\n")}\n`);
  summaryRows.push(toCsvRow(["all-data", "repairs", repairs.length, "n/a"]));

  zip.file("_summary.csv", `${summaryRows.join("\n")}\n`);

  const zipBuffer = await zip.generateAsync({
    type: "arraybuffer",
    compression: "DEFLATE",
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `building-${id}-all-tabs-${timestamp}.zip`;

  return new Response(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "X-Import-Batch-Id": batch.id,
      "Cache-Control": "no-store",
    },
  });
}
