import {
  AcceptanceResult,
  Prisma,
  RepairScopeType,
  RepairStatus,
} from "@prisma/client";

export function assertRepairScopeConsistency(input: {
  scopeType: RepairScopeType;
  floorId?: string | null;
  commonAreaId?: string | null;
}) {
  if (input.scopeType === RepairScopeType.FLOOR) {
    if (!input.floorId) {
      throw new Error("FLOOR_SCOPE_REQUIRES_FLOOR_ID");
    }
    if (input.commonAreaId) {
      throw new Error("FLOOR_SCOPE_COMMON_AREA_MUST_BE_NULL");
    }
  }

  if (input.scopeType === RepairScopeType.COMMON_AREA && !input.commonAreaId) {
    throw new Error("COMMON_AREA_SCOPE_REQUIRES_COMMON_AREA_ID");
  }
}

export function assertAcceptedTransition(input: {
  status: RepairStatus;
  acceptanceResult?: AcceptanceResult | null;
  inspectorName?: string | null;
}) {
  if (input.status !== RepairStatus.ACCEPTED) return;

  if (!input.acceptanceResult) {
    throw new Error("ACCEPTANCE_RESULT_REQUIRED");
  }

  if (!input.inspectorName?.trim()) {
    throw new Error("INSPECTOR_NAME_REQUIRED");
  }
}

export function normalizeAcceptedAt(input: {
  status: RepairStatus;
  acceptedAt?: Date | null;
}) {
  if (input.status === RepairStatus.ACCEPTED) {
    return input.acceptedAt ?? new Date();
  }

  return input.acceptedAt ?? null;
}

export function buildRepairFilters(input: {
  status?: RepairStatus;
  scopeType?: RepairScopeType;
  floorId?: string;
  commonAreaId?: string;
}): Prisma.RepairRecordWhereInput {
  return {
    ...(input.status ? { status: input.status } : {}),
    ...(input.scopeType ? { scopeType: input.scopeType } : {}),
    ...(input.floorId ? { floorId: input.floorId } : {}),
    ...(input.commonAreaId ? { commonAreaId: input.commonAreaId } : {}),
  };
}
