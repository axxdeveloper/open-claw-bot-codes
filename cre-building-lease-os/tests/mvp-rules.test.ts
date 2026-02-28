import { OccupancyStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  generateFloorSpecs,
  getEffectiveManagementFee,
  isDateRangeOverlap,
  nextOccupancyStatus,
  splitAreaValidation,
} from "../lib/domain";

describe("CRE MVP business rules", () => {
  it("樓層產生：B5=-5...B1=-1,1F=1", () => {
    const floors = generateFloorSpecs(5, 3);
    expect(floors[0]).toEqual({ label: "B5", sortIndex: -5 });
    expect(floors[4]).toEqual({ label: "B1", sortIndex: -1 });
    expect(floors[5]).toEqual({ label: "1F", sortIndex: 1 });
  });

  it("單位切割：子單位 G 坪總和需等於原單位", () => {
    expect(splitAreaValidation(100, [50, 50])).toBe(true);
    expect(splitAreaValidation(100, [60, 30])).toBe(false);
  });

  it("指派住戶：可先建立 DRAFT occupancy", () => {
    expect(nextOccupancyStatus("DRAFT")).toBe(OccupancyStatus.DRAFT);
  });

  it("建租約啟用：occupancy 需轉為 ACTIVE", () => {
    expect(nextOccupancyStatus("ACTIVE")).toBe(OccupancyStatus.ACTIVE);
  });

  it("重疊 ACTIVE 租約需阻擋（日期區間檢查）", () => {
    const existingStart = new Date("2026-01-01");
    const existingEnd = new Date("2026-12-31");
    const newStart = new Date("2026-06-01");
    const newEnd = new Date("2027-05-31");

    expect(isDateRangeOverlap(existingStart, existingEnd, newStart, newEnd)).toBe(true);
  });

  it("managementFee fallback：lease 空值沿用 building", () => {
    expect(getEffectiveManagementFee(null, 123)).toBe(123);
    expect(getEffectiveManagementFee(99, 123)).toBe(99);
  });
});
