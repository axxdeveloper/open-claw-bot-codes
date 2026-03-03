package com.cre.leaseos.web;

import com.cre.leaseos.common.ApiResponse;
import com.cre.leaseos.common.PageRequestFactory;
import com.cre.leaseos.common.PageResponse;
import com.cre.leaseos.domain.Lease;
import com.cre.leaseos.domain.LeaseAttachment;
import com.cre.leaseos.domain.LeaseUnit;
import com.cre.leaseos.domain.Occupancy;
import com.cre.leaseos.dto.OccupancyLeaseDtos.LeaseCreateReq;
import com.cre.leaseos.dto.OccupancyLeaseDtos.LeasePatchReq;
import com.cre.leaseos.dto.OccupancyLeaseDtos.OccupancyPatchReq;
import com.cre.leaseos.dto.OccupancyLeaseDtos.OccupancyReq;
import com.cre.leaseos.repo.LeaseUnitRepo;
import com.cre.leaseos.repo.OccupancyRepo;
import com.cre.leaseos.service.LeaseService;
import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LeaseController {
  private final LeaseService leaseService;
  private final LeaseUnitRepo leaseUnitRepo;
  private final OccupancyRepo occupancyRepo;

  @PostMapping("/occupancies")
  public ResponseEntity<ApiResponse<Occupancy>> createOccupancy(@Valid @RequestBody OccupancyReq req) {
    return ResponseEntity.status(201).body(ApiResponse.ok(leaseService.createOccupancy(req)));
  }

  @PatchMapping("/occupancies/{id}")
  public ApiResponse<Occupancy> patchOccupancy(
      @PathVariable UUID id, @RequestBody OccupancyPatchReq req) {
    return ApiResponse.ok(leaseService.patchOccupancy(id, req));
  }

  @GetMapping("/buildings/{id}/occupancies")
  public ApiResponse<List<Occupancy>> listBuildingOccupancies(@PathVariable UUID id) {
    return ApiResponse.ok(leaseService.listOccupancies(id));
  }

  @PostMapping("/leases")
  public ResponseEntity<ApiResponse<Lease>> createLease(@Valid @RequestBody LeaseCreateReq req) {
    return ResponseEntity.status(201).body(ApiResponse.ok(leaseService.createLease(req)));
  }

  @GetMapping("/buildings/{id}/leases")
  public ApiResponse<Object> listBuildingLeases(
      @PathVariable UUID id,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size,
      @RequestParam(required = false) String sort) {
    if (page == null && size == null && sort == null) {
      List<Object> rows = new java.util.ArrayList<>();
      for (Lease lease : leaseService.listLeases(id)) {
        rows.add(toLeaseRow(lease));
      }
      return ApiResponse.ok(rows);
    }

    var pageable = PageRequestFactory.build(page, size, sort, "createdAt");
    var leasePage = leaseService.listLeases(id, pageable);
    return ApiResponse.ok(PageResponse.from(leasePage.map(this::toLeaseRow)));
  }

  @GetMapping("/leases/{id}")
  public ApiResponse<Object> getLease(@PathVariable UUID id) {
    Lease lease = leaseService.getLease(id);
    List<LeaseUnit> leaseUnits = leaseUnitRepo.findByLeaseId(id);
    List<Occupancy> occupancies =
        occupancyRepo.findAll().stream().filter(o -> id.equals(o.getLeaseId())).toList();

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("lease", lease);
    payload.put("leaseUnits", leaseUnits);
    payload.put("occupancies", occupancies);
    payload.put("attachments", leaseService.listAttachments(id));
    payload.put("effectiveManagementFee", leaseService.effectiveManagementFee(lease));
    return ApiResponse.ok(payload);
  }

  @PatchMapping("/leases/{id}")
  public ApiResponse<Lease> patchLease(@PathVariable UUID id, @RequestBody LeasePatchReq req) {
    return ApiResponse.ok(leaseService.patchLease(id, req));
  }

  @PostMapping("/leases/{leaseId}/attachments")
  public ResponseEntity<ApiResponse<LeaseAttachment>> uploadLeaseAttachment(
      @PathVariable UUID leaseId, @RequestPart("file") MultipartFile file) {
    return ResponseEntity.status(201).body(ApiResponse.ok(leaseService.addAttachment(leaseId, file)));
  }

  @GetMapping("/leases/{leaseId}/attachments")
  public ApiResponse<List<LeaseAttachment>> listLeaseAttachments(@PathVariable UUID leaseId) {
    return ApiResponse.ok(leaseService.listAttachments(leaseId));
  }

  @DeleteMapping("/lease-attachments/{id}")
  public ApiResponse<Object> deleteLeaseAttachment(@PathVariable UUID id) {
    leaseService.deleteAttachment(id);
    return ApiResponse.ok(java.util.Map.of("deleted", true));
  }

  private Map<String, Object> toLeaseRow(Lease lease) {
    Map<String, Object> row = new LinkedHashMap<>();
    row.put("lease", lease);
    row.put(
        "unitIds", leaseUnitRepo.findByLeaseId(lease.getId()).stream().map(LeaseUnit::getUnitId).toList());
    row.put("effectiveManagementFee", leaseService.effectiveManagementFee(lease));
    return row;
  }
}
