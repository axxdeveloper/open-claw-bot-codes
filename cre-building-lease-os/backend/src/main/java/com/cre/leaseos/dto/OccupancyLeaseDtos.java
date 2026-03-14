package com.cre.leaseos.dto;

import com.cre.leaseos.domain.Enums.LeaseStatus;
import com.cre.leaseos.domain.Enums.OccupancyStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class OccupancyLeaseDtos {
  public record OccupancyReq(
      @NotNull UUID buildingId,
      @NotNull UUID unitId,
      @NotNull UUID tenantId,
      UUID leaseId,
      OccupancyStatus status,
      LocalDate startDate,
      LocalDate endDate) {}

  public record OccupancyPatchReq(
      UUID buildingId,
      UUID unitId,
      UUID tenantId,
      UUID leaseId,
      OccupancyStatus status,
      LocalDate startDate,
      LocalDate endDate) {}

  public record LeaseCreateReq(
      @NotNull UUID buildingId,
      @NotNull UUID tenantId,
      @NotEmpty List<UUID> unitIds,
      LeaseStatus status,
      @NotNull LocalDate startDate,
      @NotNull LocalDate endDate,
      BigDecimal managementFee,
      BigDecimal rent,
      BigDecimal deposit) {}

  public record LeasePatchReq(
      LeaseStatus status,
      LocalDate startDate,
      LocalDate endDate,
      List<UUID> unitIds,
      BigDecimal managementFee,
      BigDecimal rent,
      BigDecimal deposit) {}
}
