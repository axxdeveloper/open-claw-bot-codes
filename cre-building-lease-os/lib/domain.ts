import { OccupancyStatus } from "@prisma/client";

export type FloorSpec = { label: string; sortIndex: number };

export function floorLabelToSortIndex(label: string) {
  const normalized = label.trim().toUpperCase();
  if (/^B\d+$/.test(normalized)) {
    return -Number(normalized.slice(1));
  }
  if (/^\d+F$/.test(normalized)) {
    return Number(normalized.slice(0, -1));
  }
  throw new Error(`Invalid floor label: ${label}`);
}

export function generateFloorSpecs(
  basementFloors: number,
  aboveGroundFloors: number,
): FloorSpec[] {
  const result: FloorSpec[] = [];

  for (let i = basementFloors; i >= 1; i--) {
    result.push({ label: `B${i}`, sortIndex: -i });
  }

  for (let i = 1; i <= aboveGroundFloors; i++) {
    result.push({ label: `${i}F`, sortIndex: i });
  }

  return result;
}

export function isDateRangeOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
) {
  return aStart <= bEnd && bStart <= aEnd;
}

export function getEffectiveManagementFee(
  leaseManagementFee: number | null | undefined,
  buildingManagementFee: number | null | undefined,
) {
  if (leaseManagementFee !== null && leaseManagementFee !== undefined) {
    return leaseManagementFee;
  }
  return buildingManagementFee ?? null;
}

export function splitAreaValidation(
  originalGross: number,
  grossParts: number[],
  precision = 2,
) {
  const sum = grossParts.reduce((acc, n) => acc + n, 0);
  const factor = 10 ** precision;
  return Math.round(sum * factor) === Math.round(originalGross * factor);
}

export function shouldPromoteDraftOccupancy(targetLeaseStatus: string) {
  return targetLeaseStatus === "ACTIVE";
}

export function nextOccupancyStatus(targetLeaseStatus: string) {
  return shouldPromoteDraftOccupancy(targetLeaseStatus)
    ? OccupancyStatus.ACTIVE
    : OccupancyStatus.DRAFT;
}
