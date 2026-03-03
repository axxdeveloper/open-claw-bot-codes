package com.cre.leaseos.service;

import com.cre.leaseos.common.ApiException;
import com.cre.leaseos.domain.Building;
import com.cre.leaseos.domain.Floor;
import com.cre.leaseos.dto.BuildingDtos.BuildingCreateReq;
import com.cre.leaseos.dto.BuildingDtos.BuildingPatchReq;
import com.cre.leaseos.repo.BuildingRepo;
import com.cre.leaseos.repo.FloorRepo;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BuildingService {
  private final BuildingRepo buildingRepo;
  private final FloorRepo floorRepo;

  public List<Building> listBuildings() {
    return buildingRepo.findAllByOrderByCreatedAtDesc();
  }

  public Building createBuilding(BuildingCreateReq req) {
    Building b = new Building();
    b.setName(req.name());
    b.setCode(req.code());
    b.setAddress(req.address());
    b.setManagementFee(req.managementFee());
    return buildingRepo.save(b);
  }

  public Building getBuilding(UUID id) {
    return buildingRepo
        .findById(id)
        .orElseThrow(() -> new ApiException("NOT_FOUND", "找不到大樓", HttpStatus.NOT_FOUND));
  }

  public Building patchBuilding(UUID id, BuildingPatchReq req) {
    Building b = getBuilding(id);
    if (req.name() != null) b.setName(req.name());
    if (req.code() != null) b.setCode(req.code());
    if (req.address() != null) b.setAddress(req.address());
    if (req.managementFee() != null) b.setManagementFee(req.managementFee());
    return buildingRepo.save(b);
  }

  @Transactional
  public List<Floor> generateFloors(UUID buildingId, Integer basementFloors, Integer aboveGroundFloors) {
    getBuilding(buildingId);
    int basements = basementFloors == null ? 5 : basementFloors;
    int above = aboveGroundFloors == null ? 20 : aboveGroundFloors;

    floorRepo.deleteByBuildingId(buildingId);

    List<Floor> floors = new ArrayList<>();
    for (int i = basements; i >= 1; i--) {
      Floor f = new Floor();
      f.setBuildingId(buildingId);
      f.setLabel("B" + i);
      f.setSortIndex(-i);
      floors.add(f);
    }
    for (int i = 1; i <= above; i++) {
      Floor f = new Floor();
      f.setBuildingId(buildingId);
      f.setLabel(i + "F");
      f.setSortIndex(i);
      floors.add(f);
    }

    return floorRepo.saveAll(floors);
  }

  public List<Floor> listFloors(UUID buildingId) {
    return floorRepo.findByBuildingIdOrderBySortIndexAsc(buildingId);
  }

  public Floor getFloor(UUID floorId) {
    return floorRepo
        .findById(floorId)
        .orElseThrow(() -> new ApiException("NOT_FOUND", "找不到樓層", HttpStatus.NOT_FOUND));
  }
}
