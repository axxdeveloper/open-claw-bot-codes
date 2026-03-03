package com.cre.leaseos.web;

import com.cre.leaseos.common.ApiResponse;
import com.cre.leaseos.domain.Building;
import com.cre.leaseos.domain.Floor;
import com.cre.leaseos.dto.BuildingDtos.BuildingCreateReq;
import com.cre.leaseos.dto.BuildingDtos.BuildingPatchReq;
import com.cre.leaseos.dto.BuildingDtos.FloorGenerateReq;
import com.cre.leaseos.service.BuildingService;
import com.cre.leaseos.service.UnitService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BuildingController {
  private final BuildingService buildingService;
  private final UnitService unitService;

  @GetMapping("/buildings")
  public ApiResponse<List<Building>> listBuildings() {
    return ApiResponse.ok(buildingService.listBuildings());
  }

  @PostMapping("/buildings")
  public ResponseEntity<ApiResponse<Building>> createBuilding(@Valid @RequestBody BuildingCreateReq req) {
    return ResponseEntity.status(201).body(ApiResponse.ok(buildingService.createBuilding(req)));
  }

  @GetMapping("/buildings/{id}")
  public ApiResponse<Building> getBuilding(@PathVariable UUID id) {
    return ApiResponse.ok(buildingService.getBuilding(id));
  }

  @PatchMapping("/buildings/{id}")
  public ApiResponse<Building> patchBuilding(
      @PathVariable UUID id, @RequestBody BuildingPatchReq req) {
    return ApiResponse.ok(buildingService.patchBuilding(id, req));
  }

  @PostMapping("/buildings/{id}/floors/generate")
  public ResponseEntity<ApiResponse<List<Floor>>> generateFloors(
      @PathVariable UUID id, @Valid @RequestBody FloorGenerateReq req) {
    return ResponseEntity.status(201)
        .body(
            ApiResponse.ok(
                buildingService.generateFloors(id, req.basementFloors(), req.aboveGroundFloors())));
  }

  @GetMapping("/buildings/{id}/floors")
  public ApiResponse<List<Floor>> listFloors(@PathVariable UUID id) {
    return ApiResponse.ok(buildingService.listFloors(id));
  }

  @GetMapping("/floors/{id}")
  public ApiResponse<Object> getFloor(@PathVariable UUID id) {
    Floor floor = buildingService.getFloor(id);
    return ApiResponse.ok(
        java.util.Map.of(
            "floor", floor,
            "units", unitService.listCurrentUnits(id)));
  }
}
