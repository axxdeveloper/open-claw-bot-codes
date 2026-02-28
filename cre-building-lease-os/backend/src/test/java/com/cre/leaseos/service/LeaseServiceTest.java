package com.cre.leaseos.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import com.cre.leaseos.common.ApiException;
import com.cre.leaseos.domain.Lease;
import com.cre.leaseos.domain.Enums.LeaseStatus;
import com.cre.leaseos.dto.OccupancyLeaseDtos.LeaseCreateReq;
import com.cre.leaseos.repo.LeaseRepo;
import com.cre.leaseos.repo.LeaseUnitRepo;
import com.cre.leaseos.repo.OccupancyRepo;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class LeaseServiceTest {

  @Test
  void shouldBlockOverlappingActiveLease() {
    BuildingService buildingService = mock(BuildingService.class);
    LeaseRepo leaseRepo = mock(LeaseRepo.class);
    LeaseUnitRepo leaseUnitRepo = mock(LeaseUnitRepo.class);
    OccupancyRepo occupancyRepo = mock(OccupancyRepo.class);

    LeaseService service = new LeaseService(buildingService, leaseRepo, leaseUnitRepo, occupancyRepo);

    Lease existing = new Lease();
    existing.setId(UUID.randomUUID());
    existing.setStatus(LeaseStatus.ACTIVE);
    existing.setStartDate(LocalDate.of(2026, 1, 1));
    existing.setEndDate(LocalDate.of(2026, 12, 31));

    when(leaseUnitRepo.findLeasesByUnitIdsAndStatus(anyList(), eq(LeaseStatus.ACTIVE)))
        .thenReturn(List.of(existing));

    LeaseCreateReq req =
        new LeaseCreateReq(
            UUID.randomUUID(),
            UUID.randomUUID(),
            List.of(UUID.randomUUID()),
            LeaseStatus.ACTIVE,
            LocalDate.of(2026, 6, 1),
            LocalDate.of(2027, 5, 31),
            null,
            null,
            null);

    ApiException ex = assertThrows(ApiException.class, () -> service.createLease(req));
    assertEquals("OVERLAPPING_ACTIVE_LEASE", ex.getCode());
  }
}
