import {
  AcceptanceResult,
  LeaseStatus,
  OccupancyStatus,
  RepairScopeType,
  RepairStatus,
} from "@prisma/client";
import { z } from "zod";

export const buildingCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  address: z.string().optional(),
  managementFee: z.number().nonnegative().nullable().optional(),
});

export const buildingPatchSchema = buildingCreateSchema.partial();

export const floorGenerateSchema = z.object({
  basementFloors: z.number().int().min(0).max(20).default(5),
  aboveGroundFloors: z.number().int().min(1).max(200).default(20),
});

export const unitCreateSchema = z.object({
  code: z.string().min(1),
  grossArea: z.number().positive(),
  netArea: z.number().positive().nullable().optional(),
  balconyArea: z.number().nonnegative().nullable().optional(),
});

export const unitPatchSchema = unitCreateSchema.partial();

export const unitSplitSchema = z.object({
  parts: z.array(unitCreateSchema).min(2, "Split 需要至少 2 個子單位"),
});

export const unitMergeSchema = z.object({
  unitIds: z.array(z.string()).min(2),
  code: z.string().min(1),
  grossArea: z.number().positive().optional(),
  netArea: z.number().positive().nullable().optional(),
  balconyArea: z.number().nonnegative().nullable().optional(),
});

const partyBaseSchema = z.object({
  buildingId: z.string().optional(),
  name: z.string().min(1),
  taxId: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const tenantCreateSchema = partyBaseSchema;

export const ownerCreateSchema = partyBaseSchema;

export const ownerPatchSchema = ownerCreateSchema.partial();

export const floorOwnerAssignSchema = z.object({
  ownerId: z.string(),
  sharePercent: z.number().positive().max(100),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  notes: z.string().optional(),
});

export const vendorCreateSchema = partyBaseSchema;

export const vendorPatchSchema = vendorCreateSchema.partial();

export const commonAreaCreateSchema = z.object({
  buildingId: z.string().optional(),
  floorId: z.string().nullable().optional(),
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const commonAreaPatchSchema = commonAreaCreateSchema.partial();

export const occupancyCreateSchema = z.object({
  buildingId: z.string(),
  unitId: z.string(),
  tenantId: z.string(),
  leaseId: z.string().nullable().optional(),
  status: z.nativeEnum(OccupancyStatus).default(OccupancyStatus.DRAFT),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
});

export const occupancyPatchSchema = occupancyCreateSchema.partial();

export const leaseCreateSchema = z.object({
  buildingId: z.string(),
  tenantId: z.string(),
  unitIds: z.array(z.string()).min(1),
  status: z.nativeEnum(LeaseStatus).default(LeaseStatus.DRAFT),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  managementFee: z.number().nonnegative().nullable().optional(),
  rent: z.number().nonnegative().nullable().optional(),
  deposit: z.number().nonnegative().nullable().optional(),
});

export const leasePatchSchema = leaseCreateSchema
  .omit({ buildingId: true, tenantId: true, unitIds: true })
  .extend({
    unitIds: z.array(z.string()).min(1).optional(),
  })
  .partial();

const repairBaseSchema = z.object({
  buildingId: z.string(),
  scopeType: z.nativeEnum(RepairScopeType),
  floorId: z.string().nullable().optional(),
  commonAreaId: z.string().nullable().optional(),
  item: z.string().min(1),
  description: z.string().optional(),
  vendorId: z.string().nullable().optional(),
  vendorName: z.string().min(1),
  quoteAmount: z.number().positive(),
  approvedAmount: z.number().nonnegative().nullable().optional(),
  status: z.nativeEnum(RepairStatus).default(RepairStatus.DRAFT),
  acceptanceResult: z.nativeEnum(AcceptanceResult).nullable().optional(),
  inspectorName: z.string().optional(),
  reportedAt: z.coerce.date().optional(),
  startedAt: z.coerce.date().nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
  acceptedAt: z.coerce.date().nullable().optional(),
  notes: z.string().optional(),
});

export const repairCreateSchema = repairBaseSchema.superRefine((value, ctx) => {
  if (value.scopeType === RepairScopeType.FLOOR) {
    if (!value.floorId) {
      ctx.addIssue({
        code: "custom",
        message: "scopeType=FLOOR 時 floorId 必填",
        path: ["floorId"],
      });
    }
    if (value.commonAreaId) {
      ctx.addIssue({
        code: "custom",
        message: "scopeType=FLOOR 時 commonAreaId 必須為空",
        path: ["commonAreaId"],
      });
    }
  }

  if (value.scopeType === RepairScopeType.COMMON_AREA && !value.commonAreaId) {
    ctx.addIssue({
      code: "custom",
      message: "scopeType=COMMON_AREA 時 commonAreaId 必填",
      path: ["commonAreaId"],
    });
  }

  if (value.status === RepairStatus.ACCEPTED) {
    if (!value.acceptanceResult) {
      ctx.addIssue({
        code: "custom",
        message: "status=ACCEPTED 時 acceptanceResult 必填",
        path: ["acceptanceResult"],
      });
    }
    if (!value.inspectorName?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "status=ACCEPTED 時 inspectorName 必填",
        path: ["inspectorName"],
      });
    }
  }
});

export const repairPatchSchema = repairBaseSchema.partial();

export const repairFilterSchema = z.object({
  status: z.nativeEnum(RepairStatus).optional(),
  scopeType: z.nativeEnum(RepairScopeType).optional(),
  floorId: z.string().optional(),
  commonAreaId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
