import * as XLSX from "xlsx";

export const REQUIRED_SOURCE_SHEETS = [
  "點交時間表",
  "113",
  "商戶樓層明細",
  "商戶緊急聯絡電話",
  "產業人數表",
  "商戶戶MAIL",
  "簽收表",
] as const;

const HEADER_HINTS = [
  "樓層",
  "商戶",
  "租戶",
  "客戶名稱",
  "公司名稱",
  "戶號",
  "戶別",
  "室號",
  "聯絡",
  "電話",
  "mail",
  "信箱",
];

export type ParsedSourceRow = {
  rowIndex: number;
  rowValues: string[];
  rowObject: Record<string, string>;
};

export type ParsedSourceSheet = {
  name: string;
  sheetOrder: number;
  columns: string[];
  headerRowIndex: number;
  rows: ParsedSourceRow[];
};

export type StructuredCandidate = {
  tenantName: string | null;
  floorLabel: string | null;
  unitCode: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
};

export function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\r\n?/g, "\n").trim();
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[：:／/()（）\-_.，,、]/g, "");
}

function dedupeColumns(rawColumns: string[]): string[] {
  const seen = new Map<string, number>();
  return rawColumns.map((column, idx) => {
    const base = column || `欄位${idx + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    if (count === 0) return base;
    return `${base} (${count + 1})`;
  });
}

function scoreHeaderRow(row: string[]): number {
  let score = 0;
  for (const cell of row) {
    const normalized = normalizeCell(cell);
    if (!normalized) continue;
    if (HEADER_HINTS.some((hint) => normalized.includes(hint))) {
      score += 1;
    }
  }
  return score;
}

export function detectHeaderRowIndex(matrix: string[][]): number {
  const scanRows = Math.min(matrix.length, 20);
  let bestIndex = -1;
  let bestScore = -1;

  for (let i = 0; i < scanRows; i += 1) {
    const row = matrix[i] ?? [];
    const score = scoreHeaderRow(row);
    if (score > bestScore) {
      bestIndex = i;
      bestScore = score;
    }
  }

  if (bestScore > 0 && bestIndex >= 0) {
    return bestIndex;
  }

  const firstNonEmpty = matrix.findIndex((row) => row.some((cell) => normalizeCell(cell) !== ""));
  return firstNonEmpty >= 0 ? firstNonEmpty : 0;
}

function cleanMatrix(sheet: XLSX.WorkSheet): string[][] {
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  });

  return rows.map((row) => row.map((cell) => normalizeCell(cell)));
}

export function parseWorkbook(workbook: XLSX.WorkBook): ParsedSourceSheet[] {
  return workbook.SheetNames.map((sheetName, sheetOrder) => {
    const worksheet = workbook.Sheets[sheetName];
    const matrix = cleanMatrix(worksheet);
    const headerRowIndex = detectHeaderRowIndex(matrix);
    const rawColumns = matrix[headerRowIndex] ?? [];
    const widestRowLength = Math.max(rawColumns.length, ...matrix.map((row) => row.length), 0);

    const columns = dedupeColumns(
      Array.from({ length: widestRowLength }, (_, idx) => rawColumns[idx] ?? `欄位${idx + 1}`),
    );

    const rows: ParsedSourceRow[] = [];

    for (let i = headerRowIndex + 1; i < matrix.length; i += 1) {
      const row = matrix[i] ?? [];
      const filled = Array.from({ length: columns.length }, (_, idx) => row[idx] ?? "");
      const hasContent = filled.some((cell) => normalizeCell(cell) !== "");
      if (!hasContent) continue;

      const rowObject = Object.fromEntries(columns.map((column, idx) => [column, normalizeCell(filled[idx])])) as Record<
        string,
        string
      >;

      rows.push({
        rowIndex: i + 1,
        rowValues: filled.map((v) => normalizeCell(v)),
        rowObject,
      });
    }

    return {
      name: sheetName,
      sheetOrder,
      columns,
      headerRowIndex: headerRowIndex + 1,
      rows,
    };
  });
}

function pickValue(rowObject: Record<string, string>, aliases: string[]): string | null {
  const aliasSet = new Set(aliases.map((key) => normalizeKey(key)));

  for (const [key, value] of Object.entries(rowObject)) {
    if (!value) continue;
    if (aliasSet.has(normalizeKey(key)) || aliases.some((alias) => normalizeKey(key).includes(normalizeKey(alias)))) {
      return value.trim();
    }
  }

  return null;
}

export function normalizeTenantName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function parseFloorLabel(rawFloor: string | null): string | null {
  if (!rawFloor) return null;
  const value = rawFloor.toUpperCase();

  const bMatch = value.match(/B\s*(\d{1,2})/);
  if (bMatch) return `B${Number(bMatch[1])}`;

  const floorMatch = value.match(/(\d{1,3})\s*F/);
  if (floorMatch) return `${Number(floorMatch[1])}F`;

  const plainNumber = value.match(/^(\d{1,3})$/);
  if (plainNumber) return `${Number(plainNumber[1])}F`;

  return null;
}

export function floorLabelToSortIndex(label: string): number {
  const upper = label.toUpperCase();
  const basement = upper.match(/^B(\d{1,2})$/);
  if (basement) return -Number(basement[1]);
  const above = upper.match(/^(\d{1,3})F$/);
  if (above) return Number(above[1]);
  return 999;
}

function parseUnitCode(rawUnit: string | null): string | null {
  if (!rawUnit) return null;
  const normalized = rawUnit.replace(/\s+/g, "").trim();
  if (!normalized) return null;
  const first = normalized.split(/[、,，/&~～]/).find(Boolean);
  return first ?? null;
}

function parseEmail(rawEmail: string | null): string | null {
  if (!rawEmail) return null;
  const match = rawEmail.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] ?? null;
}

function parsePhone(rawPhone: string | null): string | null {
  if (!rawPhone) return null;
  const compact = rawPhone.replace(/\s+/g, " ").trim();
  if (!compact) return null;
  const match = compact.match(/[+\d][\d\-#()\s]{5,}/);
  return match ? match[0].trim() : compact;
}

export function extractStructuredCandidate(rowObject: Record<string, string>): StructuredCandidate {
  const tenantRaw = pickValue(rowObject, ["商戶", "租戶名稱", "客戶名稱", "公司名稱", "樓層/公司名稱"]);
  const floorRaw = pickValue(rowObject, ["樓層", "樓層/公司名稱"]);
  const unitRaw = pickValue(rowObject, ["戶號", "戶別", "室號"]);

  const contactName = pickValue(rowObject, ["主要聯絡人", "聯絡人", "第一聯絡人"]);
  const contactPhone = parsePhone(pickValue(rowObject, ["公司電話", "電話", "手機"]));
  const contactEmail = parseEmail(pickValue(rowObject, ["信件", "信箱", "mail", "email"]));

  return {
    tenantName: tenantRaw ? normalizeTenantName(tenantRaw) : null,
    floorLabel: parseFloorLabel(floorRaw),
    unitCode: parseUnitCode(unitRaw),
    contactName: contactName ? normalizeTenantName(contactName) : null,
    contactPhone,
    contactEmail,
  };
}

export function toCsvRow(cells: unknown[]): string {
  return cells
    .map((cell) => {
      const value = normalizeCell(cell).replace(/"/g, '""');
      return `"${value}"`;
    })
    .join(",");
}
