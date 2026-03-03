package com.cre.leaseos.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import com.cre.leaseos.common.ApiException;
import com.cre.leaseos.domain.Lease;
import com.cre.leaseos.domain.LeaseUnit;
import com.cre.leaseos.domain.Occupancy;
import com.cre.leaseos.domain.Enums.LeaseStatus;
import com.cre.leaseos.domain.Enums.OccupancyStatus;
import com.cre.leaseos.dto.OccupancyLeaseDtos.LeaseCreateReq;
import com.cre.leaseos.repo.LeaseAttachmentRepo;
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
    LeaseAttachmentRepo leaseAttachmentRepo = mock(LeaseAttachmentRepo.class);

    LeaseService service =
        new LeaseService(buildingService, leaseRepo, leaseUnitRepo, occupancyRepo, leaseAttachmentRepo);

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

  @Test
  void createActiveLease_shouldPromoteDraftOccupancyToActive() {
    BuildingService buildingService = mock(BuildingService.class);
    LeaseRepo leaseRepo = mock(LeaseRepo.class);
    LeaseUnitRepo leaseUnitRepo = mock(LeaseUnitRepo.class);
    OccupancyRepo occupancyRepo = mock(OccupancyRepo.class);
    LeaseAttachmentRepo leaseAttachmentRepo = mock(LeaseAttachmentRepo.class);

    LeaseService service =
        new LeaseService(buildingService, leaseRepo, leaseUnitRepo, occupancyRepo, leaseAttachmentRepo);

    UUID buildingId = UUID.randomUUID();
    UUID unitId = UUID.randomUUID();
    UUID tenantId = UUID.randomUUID();

    when(leaseUnitRepo.findLeasesByUnitIdsAndStatus(anyList(), eq(LeaseStatus.ACTIVE)))
        .thenReturn(List.of());

    when(leaseRepo.save(any(Lease.class)))
        .thenAnswer(
            inv -> {
              Lease lease = inv.getArgument(0);
              if (lease.getId() == null) lease.setId(UUID.randomUUID());
              return lease;
            });
    when(leaseUnitRepo.save(any(LeaseUnit.class))).thenAnswer(inv -> inv.getArgument(0));

    Occupancy draft = new Occupancy();
    draft.setId(UUID.randomUUID());
    draft.setBuildingId(buildingId);
    draft.setUnitId(unitId);
    draft.setTenantId(tenantId);
    draft.setStatus(OccupancyStatus.DRAFT);

    when(occupancyRepo.findFirstByUnitIdAndTenantIdAndStatusOrderByCreatedAtDesc(
            unitId, tenantId, OccupancyStatus.DRAFT))
        .thenReturn(draft);
    when(occupancyRepo.save(any(Occupancy.class))).thenAnswer(inv -> inv.getArgument(0));

    Lease lease =
        service.createLease(
            new LeaseCreateReq(
                buildingId,
                tenantId,
                List.of(unitId),
                LeaseStatus.ACTIVE,
                LocalDate.of(2026, 3, 1),
                LocalDate.of(2027, 2, 28),
                null,
                null,
                null));

    assertEquals(LeaseStatus.ACTIVE, lease.getStatus());
    assertEquals(OccupancyStatus.ACTIVE, draft.getStatus());
    assertEquals(lease.getId(), draft.getLeaseId());
    verify(occupancyRepo, atLeastOnce()).save(any(Occupancy.class));
  }
}
