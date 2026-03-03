package com.cre.leaseos.dto;

import com.cre.leaseos.domain.Enums.AcceptanceResult;
import com.cre.leaseos.domain.Enums.RepairScopeType;
import com.cre.leaseos.domain.Enums.RepairStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
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
      String vendorTaxId,
      @NotNull @Positive BigDecimal quoteAmount,
      @PositiveOrZero BigDecimal approvedAmount,
      @PositiveOrZero BigDecimal finalAmount,
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
      String vendorTaxId,
      @Positive BigDecimal quoteAmount,
      @PositiveOrZero BigDecimal approvedAmount,
      @PositiveOrZero BigDecimal finalAmount,
      RepairStatus status,
      AcceptanceResult acceptanceResult,
      String inspectorName,
      LocalDate reportedAt,
      LocalDate startedAt,
      LocalDate completedAt,
      OffsetDateTime acceptedAt,
      String notes) {}
}
