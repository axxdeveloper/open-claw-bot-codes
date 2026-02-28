package com.cre.leaseos.service;

import com.cre.leaseos.common.ApiException;
import com.cre.leaseos.domain.*;
import com.cre.leaseos.dto.RepairDtos.CommonAreaPatchReq;
import com.cre.leaseos.dto.RepairDtos.CommonAreaReq;
import com.cre.leaseos.dto.TenantOwnerVendorDtos.FloorOwnerAssignReq;
import com.cre.leaseos.dto.TenantOwnerVendorDtos.PartyPatchReq;
import com.cre.leaseos.dto.TenantOwnerVendorDtos.PartyReq;
import com.cre.leaseos.repo.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PartyService {
  private final BuildingService buildingService;
  private final FloorRepo floorRepo;
  private final TenantRepo tenantRepo;
  private final OwnerRepo ownerRepo;
  private final FloorOwnerRepo floorOwnerRepo;
  private final VendorRepo vendorRepo;
  private final CommonAreaRepo commonAreaRepo;

  public List<Tenant> listTenants(UUID buildingId) {
    return tenantRepo.findByBuildingIdOrderByCreatedAtDesc(buildingId);
  }

  public Tenant createTenant(UUID buildingId, PartyReq req) {
    buildingService.getBuilding(buildingId);
    Tenant t = new Tenant();
    t.setBuildingId(buildingId);
    t.setName(req.name());
    t.setTaxId(req.taxId());
    t.setContactName(req.contactName());
    t.setContactPhone(req.contactPhone());
    t.setContactEmail(req.contactEmail());
    t.setNotes(req.notes());
    return tenantRepo.save(t);
  }

  public Tenant getTenant(UUID id) {
    return tenantRepo
        .findById(id)
        .orElseThrow(() -> new ApiException("NOT_FOUND", "找不到租戶", HttpStatus.NOT_FOUND));
  }

  public Tenant patchTenant(UUID id, PartyPatchReq req) {
    Tenant t = getTenant(id);
    if (req.name() != null) t.setName(req.name());
    if (req.taxId() != null) t.setTaxId(req.taxId());
    if (req.contactName() != null) t.setContactName(req.contactName());
    if (req.contactPhone() != null) t.setContactPhone(req.contactPhone());
    if (req.contactEmail() != null) t.setContactEmail(req.contactEmail());
    if (req.notes() != null) t.setNotes(req.notes());
    if (req.isActive() != null) t.setIsActive(req.isActive());
    return tenantRepo.save(t);
  }

  public List<Owner> listOwners(UUID buildingId) {
    return ownerRepo.findByBuildingIdOrderByCreatedAtDesc(buildingId);
  }

  public List<Owner> listOwnersByName(UUID buildingId) {
    return ownerRepo.findByBuildingIdOrderByNameAsc(buildingId);
  }

  public Owner createOwner(UUID buildingId, PartyReq req) {
    buildingService.getBuilding(buildingId);
    Owner o = new Owner();
    o.setBuildingId(buildingId);
    o.setName(req.name());
    o.setTaxId(req.taxId());
    o.setContactName(req.contactName());
    o.setContactPhone(req.contactPhone());
    o.setContactEmail(req.contactEmail());
    o.setNotes(req.notes());
    return ownerRepo.save(o);
  }

  public Owner patchOwner(UUID id, PartyPatchReq req) {
    Owner o =
        ownerRepo
            .findById(id)
            .orElseThrow(() -> new ApiException("NOT_FOUND", "找不到業主", HttpStatus.NOT_FOUND));
    if (req.name() != null) o.setName(req.name());
    if (req.taxId() != null) o.setTaxId(req.taxId());
    if (req.contactName() != null) o.setContactName(req.contactName());
    if (req.contactPhone() != null) o.setContactPhone(req.contactPhone());
    if (req.contactEmail() != null) o.setContactEmail(req.contactEmail());
    if (req.notes() != null) o.setNotes(req.notes());
    if (req.isActive() != null) o.setIsActive(req.isActive());
    return ownerRepo.save(o);
  }

  public FloorOwner assignFloorOwner(UUID floorId, FloorOwnerAssignReq req) {
    Floor floor =
        floorRepo
            .findById(floorId)
            .orElseThrow(() -> new ApiException("NOT_FOUND", "找不到樓層", HttpStatus.NOT_FOUND));
    Owner owner =
        ownerRepo
            .findById(req.ownerId())
            .orElseThrow(() -> new ApiException("NOT_FOUND", "找不到業主", HttpStatus.NOT_FOUND));

    if (!owner.getBuildingId().equals(floor.getBuildingId())) {
      throw new ApiException("INVALID_OWNER", "業主不屬於此大樓", HttpStatus.BAD_REQUEST);
    }

    FloorOwner fo = new FloorOwner();
    fo.setFloorId(floorId);
    fo.setOwnerId(req.ownerId());
    fo.setSharePercent(req.sharePercent());
    fo.setStartDate(req.startDate() == null ? OffsetDateTime.now() : req.startDate());
    fo.setEndDate(req.endDate());
    fo.setNotes(req.notes());
    return floorOwnerRepo.save(fo);
  }

  public List<FloorOwner> listFloorOwners(UUID floorId) {
    return floorOwnerRepo.findByFloorIdOrderByStartDateDesc(floorId);
  }

  public List<java.util.Map<String, Object>> listFloorOwnersDetailed(UUID floorId) {
    return floorOwnerRepo.findByFloorIdOrderByStartDateDesc(floorId).stream()
        .map(
            fo -> {
              Owner owner = ownerRepo.findById(fo.getOwnerId()).orElse(null);
              java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
              row.put("id", fo.getId());
              row.put("floorId", fo.getFloorId());
              row.put("ownerId", fo.getOwnerId());
              row.put("sharePercent", fo.getSharePercent());
              row.put("startDate", fo.getStartDate());
              row.put("endDate", fo.getEndDate());
              row.put("notes", fo.getNotes());
              row.put(
                  "owner",
                  owner == null
                      ? null
                      : java.util.Map.of(
                          "id", owner.getId(),
                          "name", owner.getName(),
                          "contactName", owner.getContactName()));
              return row;
            })
        .toList();
  }

  public void deleteFloorOwner(UUID floorOwnerId) {
    floorOwnerRepo.deleteById(floorOwnerId);
  }

  public List<Vendor> listVendors(UUID buildingId) {
    return vendorRepo.findByBuildingIdOrderByCreatedAtDesc(buildingId);
  }

  public List<Vendor> listVendorsByName(UUID buildingId) {
    return vendorRepo.findByBuildingIdOrderByNameAsc(buildingId);
  }

  public Vendor createVendor(UUID buildingId, PartyReq req) {
    Vendor v = new Vendor();
    v.setBuildingId(buildingId);
    v.setName(req.name());
    v.setTaxId(req.taxId());
    v.setContactName(req.contactName());
    v.setContactPhone(req.contactPhone());
    v.setContactEmail(req.contactEmail());
    v.setNotes(req.notes());
    return vendorRepo.save(v);
  }

  public Vendor patchVendor(UUID id, PartyPatchReq req) {
    Vendor v =
        vendorRepo
            .findById(id)
            .orElseThrow(() -> new ApiException("NOT_FOUND", "找不到廠商", HttpStatus.NOT_FOUND));
    if (req.name() != null) v.setName(req.name());
    if (req.taxId() != null) v.setTaxId(req.taxId());
    if (req.contactName() != null) v.setContactName(req.contactName());
    if (req.contactPhone() != null) v.setContactPhone(req.contactPhone());
    if (req.contactEmail() != null) v.setContactEmail(req.contactEmail());
    if (req.notes() != null) v.setNotes(req.notes());
    if (req.isActive() != null) v.setIsActive(req.isActive());
    return vendorRepo.save(v);
  }

  public List<CommonArea> listCommonAreas(UUID buildingId) {
    return commonAreaRepo.findByBuildingIdOrderByCreatedAtDesc(buildingId);
  }

  public List<CommonArea> listCommonAreasByName(UUID buildingId) {
    return commonAreaRepo.findByBuildingIdOrderByNameAsc(buildingId);
  }

  public CommonArea createCommonArea(UUID buildingId, CommonAreaReq req) {
    CommonArea c = new CommonArea();
    c.setBuildingId(buildingId);
    if (req.floorId() != null && !req.floorId().isBlank()) {
      c.setFloorId(UUID.fromString(req.floorId()));
    }
    c.setName(req.name());
    c.setCode(req.code());
    c.setDescription(req.description());
    c.setNotes(req.notes());
    return commonAreaRepo.save(c);
  }

  public CommonArea getCommonArea(UUID id) {
    return commonAreaRepo
        .findById(id)
        .orElseThrow(() -> new ApiException("NOT_FOUND", "找不到公共區域", HttpStatus.NOT_FOUND));
  }

  public CommonArea patchCommonArea(UUID id, CommonAreaPatchReq req) {
    CommonArea c = getCommonArea(id);
    if (req.floorId() != null) c.setFloorId(req.floorId());
    if (req.name() != null) c.setName(req.name());
    if (req.code() != null) c.setCode(req.code());
    if (req.description() != null) c.setDescription(req.description());
    if (req.notes() != null) c.setNotes(req.notes());
    return commonAreaRepo.save(c);
  }
}
