package com.cre.leaseos.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class TenantOwnerVendorDtos {
  public record PartyReq(
      @NotBlank String name,
      String taxId,
      String contactName,
      String contactPhone,
      @Email String contactEmail,
      String notes) {}

  public record PartyPatchReq(
      String name,
      String taxId,
      String contactName,
      String contactPhone,
      @Email String contactEmail,
      String notes,
      Boolean isActive) {}

  public record FloorOwnerAssignReq(
      @NotNull UUID ownerId,
      @NotNull @Positive BigDecimal sharePercent,
      OffsetDateTime startDate,
      OffsetDateTime endDate,
      String notes) {}
}
