package com.cre.leaseos.service;

import com.cre.leaseos.common.ApiException;
import com.cre.leaseos.domain.*;
import com.cre.leaseos.domain.Enums.LeaseStatus;
import com.cre.leaseos.domain.Enums.OccupancyStatus;
import com.cre.leaseos.dto.OccupancyLeaseDtos.LeaseCreateReq;
import com.cre.leaseos.dto.OccupancyLeaseDtos.LeasePatchReq;
import com.cre.leaseos.dto.OccupancyLeaseDtos.OccupancyPatchReq;
import com.cre.leaseos.dto.OccupancyLeaseDtos.OccupancyReq;
import com.cre.leaseos.repo.*;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class LeaseService {
  private final BuildingService buildingService;
  private final LeaseRepo leaseRepo;
  private final LeaseUnitRepo leaseUnitRepo;
  private final OccupancyRepo occupancyRepo;
  private final LeaseAttachmentRepo leaseAttachmentRepo;

  public Occupancy createOccupancy(OccupancyReq req) {
    Occupancy occupancy = new Occupancy();
    occupancy.setBuildingId(req.buildingId());
    occupancy.setUnitId(req.unitId());
    occupancy.setTenantId(req.tenantId());
    occupancy.setLeaseId(req.leaseId());
    occupancy.setStatus(req.status() == null ? OccupancyStatus.DRAFT : req.status());
    occupancy.setStartDate(req.startDate() == null ? LocalDate.now() : req.startDate());
    occupancy.setEndDate(req.endDate());

    if (occupancy.getStatus() == OccupancyStatus.ACTIVE && occupancy.getLeaseId() == null) {
      throw new ApiException("LEASE_REQUIRED", "ACTIVE occupancy 需綁定 lease", HttpStatus.BAD_REQUEST);
    }

    return occupancyRepo.save(occupancy);
  }

  public Occupancy patchOccupancy(UUID id, OccupancyPatchReq req) {
    Occupancy o =
        occupancyRepo
            .findById(id)
            .orElseThrow(() -> new ApiException("NOT_FOUND", "找不到 occupancy", HttpStatus.NOT_FOUND));

    if (req.buildingId() != null) o.setBuildingId(req.buildingId());
    if (req.unitId() != null) o.setUnitId(req.unitId());
    if (req.tenantId() != null) o.setTenantId(req.tenantId());
    if (req.leaseId() != null) o.setLeaseId(req.leaseId());
    if (req.status() != null) o.setStatus(req.status());
    if (req.startDate() != null) o.setStartDate(req.startDate());
    if (req.endDate() != null) o.setEndDate(req.endDate());

    return occupancyRepo.save(o);
  }

  public List<Occupancy> listOccupancies(UUID buildingId) {
    return occupancyRepo.findByBuildingIdOrderByCreatedAtDesc(buildingId);
  }

  public List<Lease> listLeases(UUID buildingId) {
    return leaseRepo.findByBuildingIdOrderByCreatedAtDesc(buildingId);
  }

  public Page<Lease> listLeases(UUID buildingId, Pageable pageable) {
    return leaseRepo.findByBuildingId(buildingId, pageable);
  }

  public Lease getLease(UUID leaseId) {
    return leaseRepo
        .findById(leaseId)
        .orElseThrow(() -> new ApiException("NOT_FOUND", "找不到租約", HttpStatus.NOT_FOUND));
  }

  @Transactional
  public Lease createLease(LeaseCreateReq req) {
    if (req.startDate().isAfter(req.endDate())) {
      throw new ApiException("INVALID_DATE_RANGE", "租約日期區間錯誤", HttpStatus.BAD_REQUEST);
    }

    LeaseStatus target = req.status() == null ? LeaseStatus.DRAFT : req.status();

    if (target == LeaseStatus.ACTIVE) {
      assertNoOverlappingActiveLeases(req.unitIds(), req.startDate(), req.endDate(), null);
    }

    Lease lease = new Lease();
    lease.setBuildingId(req.buildingId());
    lease.setTenantId(req.tenantId());
    lease.setStatus(target);
    lease.setStartDate(req.startDate());
    lease.setEndDate(req.endDate());
    lease.setManagementFee(req.managementFee());
    lease.setRent(req.rent());
    lease.setDeposit(req.deposit());
    lease = leaseRepo.save(lease);

    for (UUID unitId : req.unitIds()) {
      LeaseUnit lu = new LeaseUnit();
      lu.setLeaseId(lease.getId());
      lu.setUnitId(unitId);
      leaseUnitRepo.save(lu);
    }

    syncOccupancyForLease(lease, req.unitIds());
    return lease;
  }

  @Transactional
  public Lease patchLease(UUID leaseId, LeasePatchReq req) {
    Lease lease = getLease(leaseId);

    LocalDate start = req.startDate() == null ? lease.getStartDate() : req.startDate();
    LocalDate end = req.endDate() == null ? lease.getEndDate() : req.endDate();
    LeaseStatus status = req.status() == null ? lease.getStatus() : req.status();

    if (start.isAfter(end)) {
      throw new ApiException("INVALID_DATE_RANGE", "租約日期區間錯誤", HttpStatus.BAD_REQUEST);
    }

    List<UUID> unitIds =
        req.unitIds() == null
            ? leaseUnitRepo.findByLeaseId(leaseId).stream().map(LeaseUnit::getUnitId).toList()
            : req.unitIds();

    if (status == LeaseStatus.ACTIVE) {
      assertNoOverlappingActiveLeases(unitIds, start, end, leaseId);
    }

    lease.setStatus(status);
    lease.setStartDate(start);
    lease.setEndDate(end);
    if (req.managementFee() != null) lease.setManagementFee(req.managementFee());
    if (req.rent() != null) lease.setRent(req.rent());
    if (req.deposit() != null) lease.setDeposit(req.deposit());
    lease = leaseRepo.save(lease);

    if (req.unitIds() != null) {
      leaseUnitRepo.deleteByLeaseId(leaseId);
      for (UUID unitId : req.unitIds()) {
        LeaseUnit lu = new LeaseUnit();
        lu.setLeaseId(leaseId);
        lu.setUnitId(unitId);
        leaseUnitRepo.save(lu);
      }
    }

    syncOccupancyForLease(lease, unitIds);
    return lease;
  }

  public java.math.BigDecimal effectiveManagementFee(Lease lease) {
    Building b = buildingService.getBuilding(lease.getBuildingId());
    return lease.getManagementFee() != null ? lease.getManagementFee() : b.getManagementFee();
  }

  public LeaseAttachment addAttachment(UUID leaseId, MultipartFile file) {
    getLease(leaseId);
    if (file.isEmpty()) {
      throw new ApiException("VALIDATION_ERROR", "空檔案", HttpStatus.BAD_REQUEST);
    }

    try {
      Path dir = Path.of("uploads", "leases");
      Files.createDirectories(dir);
      String filename = UUID.randomUUID() + "-" + file.getOriginalFilename();
      Path target = dir.resolve(filename);
      Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

      LeaseAttachment a = new LeaseAttachment();
      a.setLeaseId(leaseId);
      a.setFileName(file.getOriginalFilename());
      a.setFileUrl("/uploads/leases/" + filename);
      a.setContentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType());
      return leaseAttachmentRepo.save(a);
    } catch (IOException e) {
      throw new ApiException("UPLOAD_FAILED", "附件上傳失敗", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
    }
  }

  public List<LeaseAttachment> listAttachments(UUID leaseId) {
    return leaseAttachmentRepo.findByLeaseIdOrderByCreatedAtDesc(leaseId);
  }

  public void deleteAttachment(UUID attachmentId) {
    leaseAttachmentRepo.deleteById(attachmentId);
  }

  private boolean overlap(LocalDate aStart, LocalDate aEnd, LocalDate bStart, LocalDate bEnd) {
    return !aStart.isAfter(bEnd) && !bStart.isAfter(aEnd);
  }

  private void assertNoOverlappingActiveLeases(
      List<UUID> unitIds, LocalDate start, LocalDate end, UUID excludeLeaseId) {
    List<Lease> leases = leaseUnitRepo.findLeasesByUnitIdsAndStatus(unitIds, LeaseStatus.ACTIVE);
    for (Lease lease : leases) {
      if (excludeLeaseId != null && lease.getId().equals(excludeLeaseId)) continue;
      if (overlap(start, end, lease.getStartDate(), lease.getEndDate())) {
        throw new ApiException(
            "OVERLAPPING_ACTIVE_LEASE", "同一單位不可有重疊 ACTIVE 租約", HttpStatus.CONFLICT);
      }
    }
  }

  private void syncOccupancyForLease(Lease lease, List<UUID> unitIds) {
    if (lease.getStatus() != LeaseStatus.ACTIVE) return;

    for (UUID unitId : unitIds) {
      Occupancy draft =
          occupancyRepo.findFirstByUnitIdAndTenantIdAndStatusOrderByCreatedAtDesc(
              unitId, lease.getTenantId(), OccupancyStatus.DRAFT);
      if (draft != null) {
        draft.setStatus(OccupancyStatus.ACTIVE);
        draft.setLeaseId(lease.getId());
        draft.setStartDate(lease.getStartDate());
        draft.setEndDate(lease.getEndDate());
        occupancyRepo.save(draft);
      } else {
        Occupancy o = new Occupancy();
        o.setBuildingId(lease.getBuildingId());
        o.setUnitId(unitId);
        o.setTenantId(lease.getTenantId());
        o.setLeaseId(lease.getId());
        o.setStatus(OccupancyStatus.ACTIVE);
        o.setStartDate(lease.getStartDate());
        o.setEndDate(lease.getEndDate());
        occupancyRepo.save(o);
      }
    }
  }
}
