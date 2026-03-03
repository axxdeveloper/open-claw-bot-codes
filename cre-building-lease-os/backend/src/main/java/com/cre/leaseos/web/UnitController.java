package com.cre.leaseos.web;

import com.cre.leaseos.common.ApiResponse;
import com.cre.leaseos.domain.Unit;
import com.cre.leaseos.dto.UnitDtos.UnitCreateReq;
import com.cre.leaseos.dto.UnitDtos.UnitMergeReq;
import com.cre.leaseos.dto.UnitDtos.UnitPatchReq;
import com.cre.leaseos.dto.UnitDtos.UnitSplitReq;
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
public class UnitController {
  private final UnitService unitService;

  @PostMapping("/floors/{id}/units")
  public ResponseEntity<ApiResponse<Unit>> createUnit(
      @PathVariable UUID id, @Valid @RequestBody UnitCreateReq req) {
    return ResponseEntity.status(201).body(ApiResponse.ok(unitService.createUnit(id, req)));
  }

  @PatchMapping("/units/{id}")
  public ApiResponse<Unit> patchUnit(@PathVariable UUID id, @RequestBody UnitPatchReq req) {
    return ApiResponse.ok(unitService.patchUnit(id, req));
  }

  @PostMapping("/units/{id}/split")
  public ResponseEntity<ApiResponse<List<Unit>>> splitUnit(
      @PathVariable UUID id, @Valid @RequestBody UnitSplitReq req) {
    return ResponseEntity.status(201).body(ApiResponse.ok(unitService.splitUnit(id, req)));
  }

  @PostMapping("/units/merge")
  public ResponseEntity<ApiResponse<Unit>> mergeUnit(@Valid @RequestBody UnitMergeReq req) {
    return ResponseEntity.status(201).body(ApiResponse.ok(unitService.mergeUnits(req)));
  }
}
