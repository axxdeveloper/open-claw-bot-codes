package com.cre.leaseos.web;

import com.cre.leaseos.common.ApiResponse;
import com.cre.leaseos.common.PageRequestFactory;
import com.cre.leaseos.common.PageResponse;
import com.cre.leaseos.domain.RepairAttachment;
import com.cre.leaseos.domain.RepairRecord;
import com.cre.leaseos.domain.Enums.RepairScopeType;
import com.cre.leaseos.domain.Enums.RepairStatus;
import com.cre.leaseos.dto.RepairDtos.RepairPatchReq;
import com.cre.leaseos.dto.RepairDtos.RepairReq;
import com.cre.leaseos.service.RepairService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RepairController {
  private final RepairService repairService;

  @PostMapping("/repairs")
  public ResponseEntity<ApiResponse<RepairRecord>> createRepair(@Valid @RequestBody RepairReq req) {
    return ResponseEntity.status(201).body(ApiResponse.ok(repairService.createRepair(req)));
  }

  @GetMapping("/buildings/{id}/repairs")
  public ApiResponse<Object> listBuildingRepairs(
      @PathVariable UUID id,
      @RequestParam(required = false) RepairStatus status,
      @RequestParam(required = false) RepairScopeType scopeType,
      @RequestParam(required = false) UUID floorId,
      @RequestParam(required = false) UUID commonAreaId,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size,
      @RequestParam(required = false) String sort) {
    if (page == null && size == null && sort == null) {
      return ApiResponse.ok(repairService.listRepairs(id, status, scopeType, floorId, commonAreaId));
    }

    var pageable = PageRequestFactory.build(page, size, sort, "createdAt");
    return ApiResponse.ok(
        PageResponse.from(repairService.listRepairs(id, status, scopeType, floorId, commonAreaId, pageable)));
  }

  @GetMapping("/repairs/{id}")
  public ApiResponse<Object> getRepair(@PathVariable UUID id) {
    var repair = repairService.getRepair(id);
    return ApiResponse.ok(
        java.util.Map.of(
            "repair", repair,
            "attachments", repairService.listAttachments(id)));
  }

  @PatchMapping("/repairs/{id}")
  public ApiResponse<RepairRecord> patchRepair(
      @PathVariable UUID id, @RequestBody RepairPatchReq req) {
    return ApiResponse.ok(repairService.patchRepair(id, req));
  }

  @PostMapping("/repairs/{repairId}/attachments")
  public ResponseEntity<ApiResponse<RepairAttachment>> uploadAttachment(
      @PathVariable UUID repairId, @RequestPart("file") MultipartFile file) {
    return ResponseEntity.status(201).body(ApiResponse.ok(repairService.addAttachment(repairId, file)));
  }

  @GetMapping("/repairs/{repairId}/attachments")
  public ApiResponse<List<RepairAttachment>> listAttachments(@PathVariable UUID repairId) {
    return ApiResponse.ok(repairService.listAttachments(repairId));
  }

  @DeleteMapping("/repair-attachments/{id}")
  public ApiResponse<Object> deleteAttachment(@PathVariable UUID id) {
    repairService.deleteAttachment(id);
    return ApiResponse.ok(java.util.Map.of("deleted", true));
  }
}
