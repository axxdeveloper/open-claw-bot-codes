export function buildFloorOwnerAssignment(input: {
  floorId: string;
  ownerId: string;
  sharePercent: number;
  startDate?: Date;
  endDate?: Date | null;
  notes?: string;
}) {
  return {
    floorId: input.floorId,
    ownerId: input.ownerId,
    sharePercent: input.sharePercent,
    startDate: input.startDate ?? new Date(),
    endDate: input.endDate ?? null,
    notes: input.notes,
  };
}
