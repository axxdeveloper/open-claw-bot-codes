import fs from "node:fs/promises";
import path from "node:path";
import { OccupancyStatus, Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import { fail, ok } from "@/lib/api-response";
import { requireApiUser } from "@/lib/auth";
import { parseBody } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { sourceXlsxImportSchema } from "@/lib/schemas";
import {
  extractStructuredCandidate,
  floorLabelToSortIndex,
  normalizeTenantName,
  parseWorkbook,
  REQUIRED_SOURCE_SHEETS,
} from "@/lib/source-xlsx";

export const runtime = "nodejs";

const SOURCE_ROW_CHUNK = 250;

function resolveInputPath(payload: {
  filePath?: string;
  sourcePath?: string;
  xlsxPath?: string;
  path?: string;
}) {
  const raw = payload.filePath ?? payload.sourcePath ?? payload.xlsxPath ?? payload.path;
  return raw ? path.resolve(raw) : null;
}

function firstAvailableSortIndex(desired: number, existing: Set<number>) {
  if (!existing.has(desired)) {
    existing.add(desired);
    return desired;
  }

  const fallbackBase = existing.size > 0 ? Math.max(...existing) + 1 : desired;
  let candidate = fallbackBase;
  while (existing.has(candidate)) {
    candidate += 1;
  }
  existing.add(candidate);
  return candidate;
}

function chunkRows<T>(rows: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    chunks.push(rows.slice(i, i + chunkSize));
  }
  return chunks;
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
            take: 100,
          },
        },
      },
    },
  });

  if (!batch) {
    return fail("NOT_FOUND", "找不到匯入批次", 404);
  }

  return ok({
    batch,
    message: "每個 tab 先回傳前 100 筆原始列；可改用匯出 API 取得完整 CSV",
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiUser();
  } catch {
    return fail("UNAUTHORIZED", "請先登入", 401);
  }

  const { id } = await params;

  const parsed = await parseBody(req, sourceXlsxImportSchema);
  if ("error" in parsed) {
    return fail("VALIDATION_ERROR", "匯入參數格式錯誤", 422, parsed.error);
  }

  const sourcePath = resolveInputPath(parsed.data);
  if (!sourcePath) {
    return fail("VALIDATION_ERROR", "請提供 filePath/sourcePath/xlsxPath/path", 422);
  }

  const building = await prisma.building.findUnique({ where: { id } });
  if (!building) {
    return fail("NOT_FOUND", "找不到大樓", 404);
  }

  try {
    await fs.access(sourcePath);
  } catch {
    return fail("NOT_FOUND", `找不到來源檔案: ${sourcePath}`, 404);
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.readFile(sourcePath, {
      cellDates: false,
      raw: false,
      dense: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "無法讀取 XLSX";
    return fail("VALIDATION_ERROR", `XLSX 解析失敗: ${message}`, 422);
  }

  const parsedSheets = parseWorkbook(workbook);
  const requestedNames = new Set((parsed.data.sheetNames ?? []).map((name) => name.trim()).filter(Boolean));

  const includedSheets = parsedSheets.filter((sheet) => {
    if (requestedNames.size > 0) {
      return requestedNames.has(sheet.name);
    }
    if (parsed.data.keepOnlyRequiredTabs) {
      return REQUIRED_SOURCE_SHEETS.includes(sheet.name as (typeof REQUIRED_SOURCE_SHEETS)[number]);
    }
    return true;
  });

  if (includedSheets.length === 0) {
    return fail("VALIDATION_ERROR", "沒有可匯入的工作表（sheet）", 422);
  }

  const requiredMissing = REQUIRED_SOURCE_SHEETS.filter(
    (sheetName) => !workbook.SheetNames.includes(sheetName),
  );

  const imported = await prisma.$transaction(async (tx) => {
    const floorMap = new Map<string, string>();
    const tenantMap = new Map<string, string>();
    const unitMap = new Map<string, string>();
    const occupancyMap = new Set<string>();

    const existingFloors = await tx.floor.findMany({
      where: { buildingId: id },
      select: { id: true, label: true, sortIndex: true },
    });
    const existingTenants = await tx.tenant.findMany({
      where: { buildingId: id },
      select: { id: true, name: true },
    });
    const existingUnits = await tx.unit.findMany({
      where: { buildingId: id, isCurrent: true },
      select: { id: true, floorId: true, code: true },
    });
    const existingOccupancies = await tx.occupancy.findMany({
      where: {
        buildingId: id,
        status: { in: [OccupancyStatus.DRAFT, OccupancyStatus.ACTIVE] },
      },
      select: { tenantId: true, unitId: true },
    });

    const sortIndexSet = new Set(existingFloors.map((floor) => floor.sortIndex));

    for (const floor of existingFloors) {
      floorMap.set(floor.label, floor.id);
    }
    for (const tenant of existingTenants) {
      tenantMap.set(normalizeTenantName(tenant.name), tenant.id);
    }
    for (const unit of existingUnits) {
      unitMap.set(`${unit.floorId}::${unit.code}`, unit.id);
    }
    for (const occupancy of existingOccupancies) {
      occupancyMap.add(`${occupancy.tenantId}::${occupancy.unitId}`);
    }

    const batch = await tx.importBatch.create({
      data: {
        buildingId: id,
        sourcePath,
        sourceFile: path.basename(sourcePath),
        notes: parsed.data.notes,
      },
    });

    const structured = {
      tenantsCreated: 0,
      unitsCreated: 0,
      floorsCreated: 0,
      occupanciesCreated: 0,
      rowsWithStructuredData: 0,
    };

    for (const sheet of includedSheets) {
      const createdSheet = await tx.sourceSheet.create({
        data: {
          buildingId: id,
          importBatchId: batch.id,
          name: sheet.name,
          sheetOrder: sheet.sheetOrder,
          columns: sheet.columns,
          headerRow: sheet.headerRowIndex,
          rowCount: sheet.rows.length,
        },
      });

      for (const chunk of chunkRows(sheet.rows, SOURCE_ROW_CHUNK)) {
        await tx.sourceRow.createMany({
          data: chunk.map((row) => ({
            buildingId: id,
            importBatchId: batch.id,
            sourceSheetId: createdSheet.id,
            rowIndex: row.rowIndex,
            rowValues: row.rowValues,
            rowObject: row.rowObject,
          })),
        });
      }

      for (const row of sheet.rows) {
        const candidate = extractStructuredCandidate(row.rowObject);
        if (!candidate.tenantName) continue;

        structured.rowsWithStructuredData += 1;

        let tenantId = tenantMap.get(candidate.tenantName);
        if (!tenantId) {
          const createdTenant = await tx.tenant.create({
            data: {
              buildingId: id,
              name: candidate.tenantName,
              contactName: candidate.contactName ?? undefined,
              contactPhone: candidate.contactPhone ?? undefined,
              contactEmail: candidate.contactEmail ?? undefined,
              notes: `來源：${sheet.name} #${row.rowIndex}`,
            },
            select: { id: true },
          });
          tenantId = createdTenant.id;
          tenantMap.set(candidate.tenantName, tenantId);
          structured.tenantsCreated += 1;
        }

        if (!candidate.floorLabel || !candidate.unitCode) continue;

        let floorId = floorMap.get(candidate.floorLabel);
        if (!floorId) {
          const desiredSortIndex = floorLabelToSortIndex(candidate.floorLabel);
          const floorSortIndex = firstAvailableSortIndex(desiredSortIndex, sortIndexSet);
          const createdFloor = await tx.floor.create({
            data: {
              buildingId: id,
              label: candidate.floorLabel,
              sortIndex: floorSortIndex,
            },
            select: { id: true },
          });
          floorId = createdFloor.id;
          floorMap.set(candidate.floorLabel, floorId);
          structured.floorsCreated += 1;
        }

        const unitKey = `${floorId}::${candidate.unitCode}`;
        let unitId = unitMap.get(unitKey);
        if (!unitId) {
          const createdUnit = await tx.unit.create({
            data: {
              buildingId: id,
              floorId,
              code: candidate.unitCode,
              grossArea: new Prisma.Decimal(1),
            },
            select: { id: true },
          });
          unitId = createdUnit.id;
          unitMap.set(unitKey, unitId);
          structured.unitsCreated += 1;
        }

        const occupancyKey = `${tenantId}::${unitId}`;
        if (occupancyMap.has(occupancyKey)) continue;

        await tx.occupancy.create({
          data: {
            buildingId: id,
            tenantId,
            unitId,
            status: OccupancyStatus.DRAFT,
          },
        });
        occupancyMap.add(occupancyKey);
        structured.occupanciesCreated += 1;
      }
    }

    return {
      batch,
      structured,
    };
  });

  return ok(
    {
      message: "多 tab 匯入完成",
      importBatchId: imported.batch.id,
      sourcePath: imported.batch.sourcePath,
      sourceFile: imported.batch.sourceFile,
      includedSheets: includedSheets.map((sheet) => ({
        name: sheet.name,
        rowCount: sheet.rows.length,
        headerRow: sheet.headerRowIndex,
      })),
      requiredSheetStatus: {
        expected: REQUIRED_SOURCE_SHEETS,
        missing: requiredMissing,
      },
      structured: imported.structured,
    },
    201,
  );
}
