package com.cre.leaseos.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

import com.cre.leaseos.common.ApiException;
import com.cre.leaseos.domain.Enums.AcceptanceResult;
import com.cre.leaseos.domain.Enums.RepairScopeType;
import com.cre.leaseos.domain.Enums.RepairStatus;
import com.cre.leaseos.dto.RepairDtos.RepairReq;
import com.cre.leaseos.repo.RepairAttachmentRepo;
import com.cre.leaseos.repo.RepairRecordRepo;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

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
            new BigDecimal("1000"),
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
            new BigDecimal("2000"),
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
            new BigDecimal("2000"),
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
}
