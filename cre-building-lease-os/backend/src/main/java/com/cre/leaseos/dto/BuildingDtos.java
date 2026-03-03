package com.cre.leaseos.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class BuildingDtos {
  public record BuildingCreateReq(
      @NotBlank String name, String code, String address, BigDecimal managementFee) {}

  public record BuildingPatchReq(String name, String code, String address, BigDecimal managementFee) {}

  public record FloorGenerateReq(
      @Min(0) @Max(20) Integer basementFloors,
      @Min(1) @Max(200) Integer aboveGroundFloors) {}
}
