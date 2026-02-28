package com.cre.leaseos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class UnitDtos {
  public record UnitCreateReq(
      @NotBlank String code,
      @NotNull @Positive BigDecimal grossArea,
      BigDecimal netArea,
      BigDecimal balconyArea) {}

  public record UnitPatchReq(String code, BigDecimal grossArea, BigDecimal netArea, BigDecimal balconyArea) {}

  public record UnitSplitReq(@NotEmpty List<@Valid UnitCreateReq> parts) {}

  public record UnitMergeReq(
      @NotEmpty List<UUID> unitIds,
      @NotBlank String code,
      BigDecimal grossArea,
      BigDecimal netArea,
      BigDecimal balconyArea) {}
}
