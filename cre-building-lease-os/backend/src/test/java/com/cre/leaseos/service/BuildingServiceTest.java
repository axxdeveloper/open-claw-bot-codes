package com.cre.leaseos.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.cre.leaseos.domain.Building;
import com.cre.leaseos.domain.Floor;
import com.cre.leaseos.repo.BuildingRepo;
import com.cre.leaseos.repo.FloorRepo;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class BuildingServiceTest {

  @Test
  void floorGenerationRule_shouldCreateB5ToB1And1F() {
    BuildingRepo buildingRepo = mock(BuildingRepo.class);
    FloorRepo floorRepo = mock(FloorRepo.class);
    BuildingService service = new BuildingService(buildingRepo, floorRepo);

    UUID buildingId = UUID.randomUUID();
    Building building = new Building();
    building.setId(buildingId);
    when(buildingRepo.findById(buildingId)).thenReturn(java.util.Optional.of(building));
    when(floorRepo.saveAll(any())).thenAnswer(i -> i.getArgument(0));

    List<Floor> result = service.generateFloors(buildingId, 5, 2);

    assertEquals("B5", result.get(0).getLabel());
    assertEquals(-5, result.get(0).getSortIndex());
    assertEquals("B1", result.get(4).getLabel());
    assertEquals(-1, result.get(4).getSortIndex());
    assertEquals("1F", result.get(5).getLabel());
    assertEquals(1, result.get(5).getSortIndex());
    verify(floorRepo).deleteByBuildingId(buildingId);
  }
}
