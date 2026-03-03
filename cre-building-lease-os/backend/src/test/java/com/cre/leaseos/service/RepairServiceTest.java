package com.cre.leaseos.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.cre.leaseos.domain.RepairRecord;
import com.cre.leaseos.common.ApiException;
import com.cre.leaseos.domain.Enums.AcceptanceResult;
import com.cre.leaseos.domain.Enums.RepairScopeType;
import com.cre.leaseos.domain.Enums.RepairStatus;
import com.cre.leaseos.dto.RepairDtos.RepairPatchReq;
import com.cre.leaseos.dto.RepairDtos.RepairReq;
import com.cre.leaseos.repo.RepairAttachmentRepo;
import com.cre.leaseos.repo.RepairRecordRepo;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

class RepairServiceTest {

  @Test
  void floorScopeRequiresFloorId() {
    RepairService service = new RepairService(mock(RepairRecordRepo.class), mock(RepairAttachmentRepo.class));

    RepairReq req =
        new RepairReq(
            UUID.randomUUID(),
            RepairScopeType.FLOOR,
            null,
            null,
            "10F 空調",
            null,
            null,
            "廠商A",
            null,
            new BigDecimal("1000"),
            null,
            null,
            RepairStatus.DRAFT,
            null,
            null,
            LocalDate.now(),
            null,
            null,
            null,
            null);

    ApiException ex = assertThrows(ApiException.class, () -> service.createRepair(req));
    assertEquals("BUSINESS_RULE_VIOLATION", ex.getCode());
  }

  @Test
  void acceptedStatusRequiresAcceptanceFields() {
    RepairService service = new RepairService(mock(RepairRecordRepo.class), mock(RepairAttachmentRepo.class));

    RepairReq req =
        new RepairReq(
            UUID.randomUUID(),
            RepairScopeType.COMMON_AREA,
            null,
            UUID.randomUUID(),
            "大廳地坪",
            null,
            null,
            "廠商B",
            null,
            new BigDecimal("2000"),
            null,
            null,
            RepairStatus.ACCEPTED,
            null,
            null,
            LocalDate.now(),
            null,
            null,
            null,
            null);

    ApiException ex = assertThrows(ApiException.class, () -> service.createRepair(req));
    assertEquals("BUSINESS_RULE_VIOLATION", ex.getCode());

    RepairReq ok =
        new RepairReq(
            UUID.randomUUID(),
            RepairScopeType.COMMON_AREA,
            null,
            UUID.randomUUID(),
            "大廳地坪",
            null,
            null,
            "廠商B",
            null,
            new BigDecimal("2000"),
            null,
            null,
            RepairStatus.ACCEPTED,
            AcceptanceResult.PASS,
            "李主任",
            LocalDate.now(),
            null,
            null,
            null,
            null);

    assertDoesNotThrow(() -> service.createRepair(ok));
  }

  @Test
  void createAndPatchPersistVendorTaxIdAndFinalAmount() {
    RepairRecordRepo repo = mock(RepairRecordRepo.class);
    RepairService service = new RepairService(repo, mock(RepairAttachmentRepo.class));

    when(repo.save(any(RepairRecord.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    UUID buildingId = UUID.randomUUID();
    UUID repairId = UUID.randomUUID();
    UUID floorId = UUID.randomUUID();

    RepairReq createReq =
        new RepairReq(
            buildingId,
            RepairScopeType.FLOOR,
            floorId,
            null,
            "消防保養",
            null,
            null,
            "廠商C",
            "12345678",
            new BigDecimal("3000"),
            null,
            new BigDecimal("3200"),
            RepairStatus.DRAFT,
            null,
            null,
            LocalDate.now(),
            null,
            null,
            null,
            null);

    RepairRecord created = service.createRepair(createReq);
    assertEquals("12345678", created.getVendorTaxId());
    assertEquals(new BigDecimal("3200"), created.getFinalAmount());

    created.setId(repairId);
    when(repo.findById(eq(repairId))).thenReturn(Optional.of(created));

    RepairPatchReq patchReq =
        new RepairPatchReq(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "87654321",
            null,
            null,
            new BigDecimal("3500"),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null);

    RepairRecord patched = service.patchRepair(repairId, patchReq);
    assertEquals("87654321", patched.getVendorTaxId());
    assertEquals(new BigDecimal("3500"), patched.getFinalAmount());
  }

  @Test
  void listRepairsCanReadVendorTaxIdAndFinalAmount() {
    RepairRecordRepo repo = mock(RepairRecordRepo.class);
    RepairService service = new RepairService(repo, mock(RepairAttachmentRepo.class));

    UUID buildingId = UUID.randomUUID();
    RepairRecord row = new RepairRecord();
    row.setVendorTaxId("10293847");
    row.setFinalAmount(new BigDecimal("8800"));

    when(repo.filter(eq(buildingId), eq(null), eq(null), eq(null), eq(null), any(PageRequest.class)))
        .thenReturn(new PageImpl<>(List.of(row)));

    List<RepairRecord> records = service.listRepairs(buildingId, null, null, null, null);
    assertEquals(1, records.size());
    assertEquals("10293847", records.get(0).getVendorTaxId());
    assertEquals(new BigDecimal("8800"), records.get(0).getFinalAmount());
  }
}
