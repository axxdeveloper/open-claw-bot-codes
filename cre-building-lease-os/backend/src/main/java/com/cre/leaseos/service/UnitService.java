package com.cre.leaseos.service;

import com.cre.leaseos.common.ApiException;
import com.cre.leaseos.domain.Floor;
import com.cre.leaseos.domain.Unit;
import com.cre.leaseos.dto.UnitDtos.UnitCreateReq;
import com.cre.leaseos.dto.UnitDtos.UnitMergeReq;
import com.cre.leaseos.dto.UnitDtos.UnitPatchReq;
import com.cre.leaseos.dto.UnitDtos.UnitSplitReq;
import com.cre.leaseos.repo.UnitRepo;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UnitService {
  private final UnitRepo unitRepo;
  private final BuildingService buildingService;

  public Floor getFloorWithUnits(UUID floorId) {
    return buildingService.getFloor(floorId);
  }

  public List<Unit> listCurrentUnits(UUID floorId) {
    return unitRepo.findByFloorIdAndIsCurrentTrueOrderByCodeAsc(floorId);
  }

  public Unit createUnit(UUID floorId, UnitCreateReq req) {
    Floor floor = buildingService.getFloor(floorId);
    Unit unit = new Unit();
    unit.setBuildingId(floor.getBuildingId());
    unit.setFloorId(floorId);
    unit.setCode(req.code());
    unit.setGrossArea(req.grossArea());
    unit.setNetArea(req.netArea());
    unit.setBalconyArea(req.balconyArea());
    unit.setIsCurrent(true);
    return unitRepo.save(unit);
  }

  public Unit patchUnit(UUID unitId, UnitPatchReq req) {
    Unit unit =
        unitRepo
            .findById(unitId)
            .orElseThrow(() -> new ApiException("NOT_FOUND", "找不到單位", HttpStatus.NOT_FOUND));
    if (req.code() != null) unit.setCode(req.code());
    if (req.grossArea() != null) unit.setGrossArea(req.grossArea());
    if (req.netArea() != null) unit.setNetArea(req.netArea());
    if (req.balconyArea() != null) unit.setBalconyArea(req.balconyArea());
    return unitRepo.save(unit);
  }

  @Transactional
  public List<Unit> splitUnit(UUID unitId, UnitSplitReq req) {
    Unit source =
        unitRepo
            .findById(unitId)
            .orElseThrow(() -> new ApiException("NOT_FOUND", "找不到單位", HttpStatus.NOT_FOUND));
    if (!Boolean.TRUE.equals(source.getIsCurrent())) {
      throw new ApiException("INVALID_STATE", "僅可切割現行單位", HttpStatus.BAD_REQUEST);
    }

    BigDecimal sum =
        req.parts().stream()
            .map(UnitCreateReq::grossArea)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP);
    BigDecimal sourceArea = source.getGrossArea().setScale(2, RoundingMode.HALF_UP);

    if (sum.compareTo(sourceArea) != 0) {
      throw new ApiException("INVALID_AREA", "分割後 G 坪數總和需等於原單位", HttpStatus.BAD_REQUEST);
    }

    source.setIsCurrent(false);
    source.setReplacedAt(OffsetDateTime.now());
    unitRepo.save(source);

    List<Unit> result = new ArrayList<>();
    for (UnitCreateReq part : req.parts()) {
      Unit child = new Unit();
      child.setBuildingId(source.getBuildingId());
      child.setFloorId(source.getFloorId());
      child.setCode(part.code());
      child.setGrossArea(part.grossArea());
      child.setNetArea(part.netArea());
      child.setBalconyArea(part.balconyArea());
      child.setSourceUnitId(source.getId());
      child.setIsCurrent(true);
      result.add(unitRepo.save(child));
    }

    return result;
  }

  @Transactional
  public Unit mergeUnits(UnitMergeReq req) {
    List<Unit> units = unitRepo.findByIdInAndIsCurrentTrue(req.unitIds());
    if (units.size() != req.unitIds().size()) {
      throw new ApiException("NOT_FOUND", "部分單位不存在或非現行版本", HttpStatus.NOT_FOUND);
    }

    UUID floorId = units.get(0).getFloorId();
    UUID buildingId = units.get(0).getBuildingId();
    boolean sameFloor = units.stream().allMatch(u -> u.getFloorId().equals(floorId));
    if (!sameFloor) {
      throw new ApiException("INVALID_MERGE", "僅可合併同樓層單位", HttpStatus.BAD_REQUEST);
    }

    BigDecimal grossArea = req.grossArea();
    if (grossArea == null) {
      grossArea = units.stream().map(Unit::getGrossArea).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    Unit merged = new Unit();
    merged.setBuildingId(buildingId);
    merged.setFloorId(floorId);
    merged.setCode(req.code());
    merged.setGrossArea(grossArea);
    merged.setNetArea(req.netArea());
    merged.setBalconyArea(req.balconyArea());
    merged.setIsCurrent(true);
    merged = unitRepo.save(merged);

    for (Unit old : units) {
      old.setIsCurrent(false);
      old.setReplacedAt(OffsetDateTime.now());
      old.setReplacedByUnitId(merged.getId());
      unitRepo.save(old);
    }

    return merged;
  }
}
