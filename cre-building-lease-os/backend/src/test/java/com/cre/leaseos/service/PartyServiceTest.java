package com.cre.leaseos.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import com.cre.leaseos.common.ApiException;
import com.cre.leaseos.domain.Floor;
import com.cre.leaseos.domain.FloorOwner;
import com.cre.leaseos.domain.Owner;
import com.cre.leaseos.dto.TenantOwnerVendorDtos.FloorOwnerAssignReq;
import com.cre.leaseos.repo.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PartyServiceTest {

  @Test
  void assignFloorOwner_shouldValidateSharePercentAndDateRange() {
    BuildingService buildingService = mock(BuildingService.class);
    FloorRepo floorRepo = mock(FloorRepo.class);
    TenantRepo tenantRepo = mock(TenantRepo.class);
    OwnerRepo ownerRepo = mock(OwnerRepo.class);
    FloorOwnerRepo floorOwnerRepo = mock(FloorOwnerRepo.class);
    VendorRepo vendorRepo = mock(VendorRepo.class);
    CommonAreaRepo commonAreaRepo = mock(CommonAreaRepo.class);

    PartyService service =
        new PartyService(
            buildingService,
            floorRepo,
            tenantRepo,
            ownerRepo,
            floorOwnerRepo,
            vendorRepo,
            commonAreaRepo);

    UUID floorId = UUID.randomUUID();
    UUID buildingId = UUID.randomUUID();
    UUID ownerId = UUID.randomUUID();

    Floor floor = new Floor();
    floor.setId(floorId);
    floor.setBuildingId(buildingId);

    Owner owner = new Owner();
    owner.setId(ownerId);
    owner.setBuildingId(buildingId);

    when(floorRepo.findById(floorId)).thenReturn(Optional.of(floor));
    when(ownerRepo.findById(ownerId)).thenReturn(Optional.of(owner));

    OffsetDateTime start = OffsetDateTime.now();
    OffsetDateTime end = start.minusDays(1);
    ApiException badDate =
        assertThrows(
            ApiException.class,
            () ->
                service.assignFloorOwner(
                    floorId,
                    new FloorOwnerAssignReq(ownerId, new BigDecimal("40"), start, end, null)));
    assertEquals("INVALID_DATE_RANGE", badDate.getCode());

    ApiException badShare =
        assertThrows(
            ApiException.class,
            () ->
                service.assignFloorOwner(
                    floorId,
                    new FloorOwnerAssignReq(ownerId, new BigDecimal("120"), start, null, null)));
    assertEquals("INVALID_SHARE_PERCENT", badShare.getCode());
  }

  @Test
  void assignFloorOwner_shouldRejectOverAllocatedSharesOnOverlappingPeriod() {
    BuildingService buildingService = mock(BuildingService.class);
    FloorRepo floorRepo = mock(FloorRepo.class);
    TenantRepo tenantRepo = mock(TenantRepo.class);
    OwnerRepo ownerRepo = mock(OwnerRepo.class);
    FloorOwnerRepo floorOwnerRepo = mock(FloorOwnerRepo.class);
    VendorRepo vendorRepo = mock(VendorRepo.class);
    CommonAreaRepo commonAreaRepo = mock(CommonAreaRepo.class);

    PartyService service =
        new PartyService(
            buildingService,
            floorRepo,
            tenantRepo,
            ownerRepo,
            floorOwnerRepo,
            vendorRepo,
            commonAreaRepo);

    UUID floorId = UUID.randomUUID();
    UUID buildingId = UUID.randomUUID();
    UUID ownerId = UUID.randomUUID();

    Floor floor = new Floor();
    floor.setId(floorId);
    floor.setBuildingId(buildingId);

    Owner owner = new Owner();
    owner.setId(ownerId);
    owner.setBuildingId(buildingId);

    FloorOwner existing = new FloorOwner();
    existing.setSharePercent(new BigDecimal("70"));
    existing.setStartDate(OffsetDateTime.parse("2026-01-01T00:00:00+08:00"));
    existing.setEndDate(null);

    when(floorRepo.findById(floorId)).thenReturn(Optional.of(floor));
    when(ownerRepo.findById(ownerId)).thenReturn(Optional.of(owner));
    when(floorOwnerRepo.findByFloorIdOrderByStartDateDesc(floorId)).thenReturn(List.of(existing));

    ApiException ex =
        assertThrows(
            ApiException.class,
            () ->
                service.assignFloorOwner(
                    floorId,
                    new FloorOwnerAssignReq(
                        ownerId,
                        new BigDecimal("40"),
                        OffsetDateTime.parse("2026-02-01T00:00:00+08:00"),
                        null,
                        null)));

    assertEquals("OWNER_SHARE_OVER_ALLOCATED", ex.getCode());
  }
}
