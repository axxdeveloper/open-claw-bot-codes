import { AcceptanceResult, RepairScopeType, RepairStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildFloorOwnerAssignment } from "../lib/owner-service";
import {
  assertAcceptedTransition,
  buildRepairFilters,
} from "../lib/repair-service";
import {
  floorOwnerAssignSchema,
  ownerCreateSchema,
  repairCreateSchema,
} from "../lib/schemas";

describe("Add-on Spec v0.2", () => {
  it("Zod validation: scopeType=FLOOR requires floorId", () => {
    const result = repairCreateSchema.safeParse({
      buildingId: "b1",
      scopeType: RepairScopeType.FLOOR,
      item: "空調維修",
      vendorName: "廠商A",
      quoteAmount: 1000,
      status: RepairStatus.DRAFT,
    });

    expect(result.success).toBe(false);
  });

  it("Create owner + assign floor", () => {
    const owner = ownerCreateSchema.parse({
      name: "宏盛資產",
      contactName: "王經理",
      contactPhone: "02-0000-0000",
    });
    expect(owner.name).toBe("宏盛資產");

    const assignmentPayload = floorOwnerAssignSchema.parse({
      ownerId: "owner-1",
      sharePercent: 60,
      startDate: "2026-01-01",
    });

    const assignment = buildFloorOwnerAssignment({
      floorId: "floor-1",
      ownerId: assignmentPayload.ownerId,
      sharePercent: assignmentPayload.sharePercent,
      startDate: assignmentPayload.startDate,
    });

    expect(assignment.floorId).toBe("floor-1");
    expect(assignment.sharePercent).toBe(60);
  });

  it("Create repair floor/common area + filter query", () => {
    const floorRepair = repairCreateSchema.safeParse({
      buildingId: "b1",
      scopeType: RepairScopeType.FLOOR,
      floorId: "f10",
      item: "10F 空調主機",
      vendorName: "全方位機電",
      quoteAmount: 200000,
      status: RepairStatus.QUOTED,
    });

    const commonAreaRepair = repairCreateSchema.safeParse({
      buildingId: "b1",
      scopeType: RepairScopeType.COMMON_AREA,
      commonAreaId: "ca-lobby",
      item: "大廳地坪",
      vendorName: "大都會修繕",
      quoteAmount: 160000,
      status: RepairStatus.APPROVED,
    });

    expect(floorRepair.success).toBe(true);
    expect(commonAreaRepair.success).toBe(true);

    const where = buildRepairFilters({
      status: RepairStatus.APPROVED,
      scopeType: RepairScopeType.COMMON_AREA,
      commonAreaId: "ca-lobby",
    });

    expect(where).toEqual({
      status: RepairStatus.APPROVED,
      scopeType: RepairScopeType.COMMON_AREA,
      commonAreaId: "ca-lobby",
    });
  });

  it("ACCEPTED transition enforces acceptance fields", () => {
    expect(() =>
      assertAcceptedTransition({
        status: RepairStatus.ACCEPTED,
      }),
    ).toThrow("ACCEPTANCE_RESULT_REQUIRED");

    expect(() =>
      assertAcceptedTransition({
        status: RepairStatus.ACCEPTED,
        acceptanceResult: AcceptanceResult.PASS,
      }),
    ).toThrow("INSPECTOR_NAME_REQUIRED");

    expect(() =>
      assertAcceptedTransition({
        status: RepairStatus.ACCEPTED,
        acceptanceResult: AcceptanceResult.PASS,
        inspectorName: "李主任",
      }),
    ).not.toThrow();
  });
});
