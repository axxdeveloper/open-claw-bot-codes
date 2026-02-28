package com.cre.leaseos.service;

import com.cre.leaseos.common.ApiException;
import com.cre.leaseos.domain.RepairAttachment;
import com.cre.leaseos.domain.RepairRecord;
import com.cre.leaseos.domain.Enums.RepairScopeType;
import com.cre.leaseos.domain.Enums.RepairStatus;
import com.cre.leaseos.dto.RepairDtos.RepairPatchReq;
import com.cre.leaseos.dto.RepairDtos.RepairReq;
import com.cre.leaseos.repo.RepairAttachmentRepo;
import com.cre.leaseos.repo.RepairRecordRepo;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class RepairService {
  private final RepairRecordRepo repairRecordRepo;
  private final RepairAttachmentRepo attachmentRepo;

  public List<RepairRecord> listRepairs(
      UUID buildingId,
      RepairStatus status,
      RepairScopeType scopeType,
      UUID floorId,
      UUID commonAreaId) {
    return repairRecordRepo
        .filter(
            buildingId,
            status,
            scopeType,
            floorId,
            commonAreaId,
            org.springframework.data.domain.PageRequest.of(0, 1000))
        .getContent();
  }

  public Page<RepairRecord> listRepairs(
      UUID buildingId,
      RepairStatus status,
      RepairScopeType scopeType,
      UUID floorId,
      UUID commonAreaId,
      Pageable pageable) {
    return repairRecordRepo.filter(buildingId, status, scopeType, floorId, commonAreaId, pageable);
  }

  public List<RepairRecord> listFloorRepairs(UUID buildingId, UUID floorId) {
    return repairRecordRepo.findByBuildingIdAndFloorIdOrderByCreatedAtDesc(buildingId, floorId);
  }

  public RepairRecord getRepair(UUID id) {
    return repairRecordRepo
        .findById(id)
        .orElseThrow(() -> new ApiException("NOT_FOUND", "找不到維修紀錄", HttpStatus.NOT_FOUND));
  }

  public RepairRecord createRepair(RepairReq req) {
    validateRepair(req.scopeType(), req.floorId(), req.commonAreaId(), req.status(), req.acceptanceResult(), req.inspectorName());

    RepairRecord r = new RepairRecord();
    r.setBuildingId(req.buildingId());
    r.setScopeType(req.scopeType());
    r.setFloorId(req.floorId());
    r.setCommonAreaId(req.commonAreaId());
    r.setItem(req.item());
    r.setDescription(req.description());
    r.setVendorId(req.vendorId());
    r.setVendorName(req.vendorName());
    r.setQuoteAmount(req.quoteAmount());
    r.setApprovedAmount(req.approvedAmount());
    r.setStatus(req.status() == null ? RepairStatus.DRAFT : req.status());
    r.setAcceptanceResult(req.acceptanceResult());
    r.setInspectorName(req.inspectorName());
    r.setReportedAt(req.reportedAt() == null ? LocalDate.now() : req.reportedAt());
    r.setStartedAt(req.startedAt());
    r.setCompletedAt(req.completedAt());
    if (r.getStatus() == RepairStatus.ACCEPTED) {
      r.setAcceptedAt(req.acceptedAt() == null ? OffsetDateTime.now() : req.acceptedAt());
    } else {
      r.setAcceptedAt(req.acceptedAt());
    }
    r.setNotes(req.notes());

    return repairRecordRepo.save(r);
  }

  public RepairRecord patchRepair(UUID id, RepairPatchReq req) {
    RepairRecord r = getRepair(id);

    RepairScopeType scope = req.scopeType() == null ? r.getScopeType() : req.scopeType();
    UUID floorId = req.floorId() == null ? r.getFloorId() : req.floorId();
    UUID commonAreaId = req.commonAreaId() == null ? r.getCommonAreaId() : req.commonAreaId();
    RepairStatus status = req.status() == null ? r.getStatus() : req.status();

    validateRepair(scope, floorId, commonAreaId, status, req.acceptanceResult() == null ? r.getAcceptanceResult() : req.acceptanceResult(), req.inspectorName() == null ? r.getInspectorName() : req.inspectorName());

    r.setScopeType(scope);
    r.setFloorId(floorId);
    r.setCommonAreaId(commonAreaId);
    if (req.item() != null) r.setItem(req.item());
    if (req.description() != null) r.setDescription(req.description());
    if (req.vendorId() != null) r.setVendorId(req.vendorId());
    if (req.vendorName() != null) r.setVendorName(req.vendorName());
    if (req.quoteAmount() != null) r.setQuoteAmount(req.quoteAmount());
    if (req.approvedAmount() != null) r.setApprovedAmount(req.approvedAmount());
    r.setStatus(status);
    if (req.acceptanceResult() != null) r.setAcceptanceResult(req.acceptanceResult());
    if (req.inspectorName() != null) r.setInspectorName(req.inspectorName());
    if (req.reportedAt() != null) r.setReportedAt(req.reportedAt());
    if (req.startedAt() != null) r.setStartedAt(req.startedAt());
    if (req.completedAt() != null) r.setCompletedAt(req.completedAt());
    if (status == RepairStatus.ACCEPTED) {
      r.setAcceptedAt(req.acceptedAt() == null ? OffsetDateTime.now() : req.acceptedAt());
    } else if (req.acceptedAt() != null) {
      r.setAcceptedAt(req.acceptedAt());
    }
    if (req.notes() != null) r.setNotes(req.notes());

    return repairRecordRepo.save(r);
  }

  public RepairAttachment addAttachment(UUID repairId, MultipartFile file) {
    getRepair(repairId);
    if (file.isEmpty()) {
      throw new ApiException("VALIDATION_ERROR", "空檔案", HttpStatus.BAD_REQUEST);
    }

    try {
      Path dir = Path.of("uploads", "repairs");
      Files.createDirectories(dir);
      String filename = UUID.randomUUID() + "-" + file.getOriginalFilename();
      Path target = dir.resolve(filename);
      Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

      RepairAttachment a = new RepairAttachment();
      a.setRepairId(repairId);
      a.setFileName(file.getOriginalFilename());
      a.setFileUrl("/uploads/repairs/" + filename);
      return attachmentRepo.save(a);
    } catch (IOException e) {
      throw new ApiException("UPLOAD_FAILED", "附件上傳失敗", HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
    }
  }

  public List<RepairAttachment> listAttachments(UUID repairId) {
    return attachmentRepo.findByRepairIdOrderByCreatedAtDesc(repairId);
  }

  public void deleteAttachment(UUID attachmentId) {
    attachmentRepo.deleteById(attachmentId);
  }

  private void validateRepair(
      RepairScopeType scopeType,
      UUID floorId,
      UUID commonAreaId,
      RepairStatus status,
      Object acceptanceResult,
      String inspectorName) {
    if (scopeType == RepairScopeType.FLOOR && floorId == null) {
      throw new ApiException("BUSINESS_RULE_VIOLATION", "scopeType=FLOOR 時 floorId 必填", HttpStatus.BAD_REQUEST);
    }
    if (scopeType == RepairScopeType.FLOOR && commonAreaId != null) {
      throw new ApiException("BUSINESS_RULE_VIOLATION", "scopeType=FLOOR 時 commonAreaId 必須為空", HttpStatus.BAD_REQUEST);
    }
    if (scopeType == RepairScopeType.COMMON_AREA && commonAreaId == null) {
      throw new ApiException("BUSINESS_RULE_VIOLATION", "scopeType=COMMON_AREA 時 commonAreaId 必填", HttpStatus.BAD_REQUEST);
    }

    if (status == RepairStatus.ACCEPTED) {
      if (acceptanceResult == null) {
        throw new ApiException("BUSINESS_RULE_VIOLATION", "status=ACCEPTED 時 acceptanceResult 必填", HttpStatus.BAD_REQUEST);
      }
      if (inspectorName == null || inspectorName.isBlank()) {
        throw new ApiException("BUSINESS_RULE_VIOLATION", "status=ACCEPTED 時 inspectorName 必填", HttpStatus.BAD_REQUEST);
      }
    }
  }
}
