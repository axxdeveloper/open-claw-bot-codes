package com.cre.leaseos.web;

import com.cre.leaseos.common.ApiResponse;
import com.cre.leaseos.domain.*;
import com.cre.leaseos.dto.RepairDtos.CommonAreaPatchReq;
import com.cre.leaseos.dto.RepairDtos.CommonAreaReq;
import com.cre.leaseos.dto.TenantOwnerVendorDtos.FloorOwnerAssignReq;
import com.cre.leaseos.dto.TenantOwnerVendorDtos.PartyPatchReq;
import com.cre.leaseos.dto.TenantOwnerVendorDtos.PartyReq;
import com.cre.leaseos.service.PartyService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PartyController {
  private final PartyService partyService;

  @GetMapping("/buildings/{id}/tenants")
  public ApiResponse<List<Tenant>> listTenants(@PathVariable UUID id) {
    return ApiResponse.ok(partyService.listTenants(id));
  }

  @PostMapping("/buildings/{id}/tenants")
  public ResponseEntity<ApiResponse<Tenant>> createTenant(
      @PathVariable UUID id, @Valid @RequestBody PartyReq req) {
    return ResponseEntity.status(201).body(ApiResponse.ok(partyService.createTenant(id, req)));
  }

  @GetMapping("/tenants/{id}")
  public ApiResponse<Tenant> getTenant(@PathVariable UUID id) {
    return ApiResponse.ok(partyService.getTenant(id));
  }

  @PatchMapping("/tenants/{id}")
  public ApiResponse<Tenant> patchTenant(@PathVariable UUID id, @RequestBody PartyPatchReq req) {
    return ApiResponse.ok(partyService.patchTenant(id, req));
  }

  @GetMapping("/buildings/{buildingId}/owners")
  public ApiResponse<List<Owner>> listOwners(@PathVariable UUID buildingId) {
    return ApiResponse.ok(partyService.listOwners(buildingId));
  }

  @PostMapping("/buildings/{buildingId}/owners")
  public ResponseEntity<ApiResponse<Owner>> createOwner(
      @PathVariable UUID buildingId, @Valid @RequestBody PartyReq req) {
    return ResponseEntity.status(201).body(ApiResponse.ok(partyService.createOwner(buildingId, req)));
  }

  @PatchMapping("/owners/{ownerId}")
  public ApiResponse<Owner> patchOwner(
      @PathVariable UUID ownerId, @RequestBody PartyPatchReq req) {
    return ApiResponse.ok(partyService.patchOwner(ownerId, req));
  }

  @PostMapping("/floors/{floorId}/owners/assign")
  public ResponseEntity<ApiResponse<FloorOwner>> assignFloorOwner(
      @PathVariable UUID floorId, @Valid @RequestBody FloorOwnerAssignReq req) {
    return ResponseEntity.status(201).body(ApiResponse.ok(partyService.assignFloorOwner(floorId, req)));
  }

  @GetMapping("/floors/{floorId}/owners")
  public ApiResponse<List<java.util.Map<String, Object>>> listFloorOwners(@PathVariable UUID floorId) {
    return ApiResponse.ok(partyService.listFloorOwnersDetailed(floorId));
  }

  @DeleteMapping("/floor-owners/{floorOwnerId}")
  public ApiResponse<Object> deleteFloorOwner(@PathVariable UUID floorOwnerId) {
    partyService.deleteFloorOwner(floorOwnerId);
    return ApiResponse.ok(java.util.Map.of("deleted", true));
  }

  @GetMapping("/buildings/{id}/vendors")
  public ApiResponse<List<Vendor>> listVendors(@PathVariable UUID id) {
    return ApiResponse.ok(partyService.listVendors(id));
  }

  @PostMapping("/buildings/{id}/vendors")
  public ResponseEntity<ApiResponse<Vendor>> createVendor(
      @PathVariable UUID id, @Valid @RequestBody PartyReq req) {
    return ResponseEntity.status(201).body(ApiResponse.ok(partyService.createVendor(id, req)));
  }

  @PatchMapping("/vendors/{id}")
  public ApiResponse<Vendor> patchVendor(@PathVariable UUID id, @RequestBody PartyPatchReq req) {
    return ApiResponse.ok(partyService.patchVendor(id, req));
  }

  @GetMapping("/buildings/{id}/common-areas")
  public ApiResponse<List<CommonArea>> listCommonAreas(@PathVariable UUID id) {
    return ApiResponse.ok(partyService.listCommonAreas(id));
  }

  @PostMapping("/buildings/{id}/common-areas")
  public ResponseEntity<ApiResponse<CommonArea>> createCommonArea(
      @PathVariable UUID id, @Valid @RequestBody CommonAreaReq req) {
    return ResponseEntity.status(201).body(ApiResponse.ok(partyService.createCommonArea(id, req)));
  }

  @GetMapping("/common-areas/{id}")
  public ApiResponse<CommonArea> getCommonArea(@PathVariable UUID id) {
    return ApiResponse.ok(partyService.getCommonArea(id));
  }

  @PatchMapping("/common-areas/{id}")
  public ApiResponse<CommonArea> patchCommonArea(
      @PathVariable UUID id, @RequestBody CommonAreaPatchReq req) {
    return ApiResponse.ok(partyService.patchCommonArea(id, req));
  }
}
