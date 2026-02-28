package com.cre.leaseos.web;

import com.cre.leaseos.common.ApiResponse;
import com.cre.leaseos.domain.Lease;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

  @PostMapping("/leases")
  public ResponseEntity<ApiResponse<Lease>> createLease(@Valid @RequestBody LeaseCreateReq req) {
    return ResponseEntity.status(201).body(ApiResponse.ok(leaseService.createLease(req)));
  }

  @GetMapping("/buildings/{id}/leases")
  public ApiResponse<List<Object>> listBuildingLeases(@PathVariable UUID id) {
    List<Object> rows = new ArrayList<>();
    for (Lease lease : leaseService.listLeases(id)) {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("lease", lease);
      row.put(
          "unitIds",
          leaseUnitRepo.findByLeaseId(lease.getId()).stream().map(LeaseUnit::getUnitId).toList());
      row.put("effectiveManagementFee", leaseService.effectiveManagementFee(lease));
      rows.add(row);
    }
    return ApiResponse.ok(rows);
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
    payload.put("effectiveManagementFee", leaseService.effectiveManagementFee(lease));
    return ApiResponse.ok(payload);
  }

  @PatchMapping("/leases/{id}")
  public ApiResponse<Lease> patchLease(@PathVariable UUID id, @RequestBody LeasePatchReq req) {
    return ApiResponse.ok(leaseService.patchLease(id, req));
  }
}
