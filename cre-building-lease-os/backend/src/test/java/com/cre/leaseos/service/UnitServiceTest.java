package com.cre.leaseos.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.cre.leaseos.common.ApiException;
import com.cre.leaseos.domain.Unit;
import com.cre.leaseos.dto.UnitDtos.UnitCreateReq;
import com.cre.leaseos.dto.UnitDtos.UnitSplitReq;
import com.cre.leaseos.repo.UnitRepo;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class UnitServiceTest {

  @Test
  void splitUnit_shouldValidateAndSplit() {
    UnitRepo unitRepo = mock(UnitRepo.class);
    BuildingService buildingService = mock(BuildingService.class);
    UnitService service = new UnitService(unitRepo, buildingService);

    UUID id = UUID.randomUUID();
    Unit src = new Unit();
    src.setId(id);
    src.setBuildingId(UUID.randomUUID());
    src.setFloorId(UUID.randomUUID());
    src.setGrossArea(new BigDecimal("100.00"));
    src.setIsCurrent(true);

    when(unitRepo.findById(id)).thenReturn(Optional.of(src));
    when(unitRepo.save(any(Unit.class))).thenAnswer(i -> i.getArgument(0));

    var req =
        new UnitSplitReq(
            List.of(
                new UnitCreateReq("A1-1", new BigDecimal("50"), null, null),
                new UnitCreateReq("A1-2", new BigDecimal("50"), null, null)));

    List<Unit> units = service.splitUnit(id, req);
    assertEquals(2, units.size());
    assertFalse(src.getIsCurrent());

    Unit src2 = new Unit();
    src2.setId(id);
    src2.setBuildingId(src.getBuildingId());
    src2.setFloorId(src.getFloorId());
    src2.setGrossArea(new BigDecimal("100.00"));
    src2.setIsCurrent(true);
    when(unitRepo.findById(id)).thenReturn(Optional.of(src2));

    var bad =
        new UnitSplitReq(
            List.of(
                new UnitCreateReq("A1-1", new BigDecimal("60"), null, null),
                new UnitCreateReq("A1-2", new BigDecimal("30"), null, null)));
    ApiException ex = assertThrows(ApiException.class, () -> service.splitUnit(id, bad));
    assertEquals("INVALID_AREA", ex.getCode());
  }
}
