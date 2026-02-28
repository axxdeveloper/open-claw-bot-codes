package com.cre.leaseos.dto;

import com.cre.leaseos.domain.Enums.AcceptanceResult;
import com.cre.leaseos.domain.Enums.RepairScopeType;
import com.cre.leaseos.domain.Enums.RepairStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class RepairDtos {
  public record CommonAreaReq(String floorId, @NotBlank String name, String code, String description, String notes) {}

  public record CommonAreaPatchReq(UUID floorId, String name, String code, String description, String notes) {}

  public record RepairReq(
      @NotNull UUID buildingId,
      @NotNull RepairScopeType scopeType,
      UUID floorId,
      UUID commonAreaId,
      @NotBlank String item,
      String description,
      UUID vendorId,
      @NotBlank String vendorName,
      @NotNull @Positive BigDecimal quoteAmount,
      BigDecimal approvedAmount,
      RepairStatus status,
      AcceptanceResult acceptanceResult,
      String inspectorName,
      LocalDate reportedAt,
      LocalDate startedAt,
      LocalDate completedAt,
      OffsetDateTime acceptedAt,
      String notes) {}

  public record RepairPatchReq(
      RepairScopeType scopeType,
      UUID floorId,
      UUID commonAreaId,
      String item,
      String description,
      UUID vendorId,
      String vendorName,
      BigDecimal quoteAmount,
      BigDecimal approvedAmount,
      RepairStatus status,
      AcceptanceResult acceptanceResult,
      String inspectorName,
      LocalDate reportedAt,
      LocalDate startedAt,
      LocalDate completedAt,
      OffsetDateTime acceptedAt,
      String notes) {}
}
