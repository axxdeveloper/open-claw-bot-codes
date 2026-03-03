package com.cre.leaseos.repo;

import com.cre.leaseos.domain.Unit;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UnitRepo extends JpaRepository<Unit, UUID> {
  List<Unit> findByFloorIdAndIsCurrentTrueOrderByCodeAsc(UUID floorId);

  List<Unit> findByBuildingIdAndIsCurrentTrueOrderByCreatedAtDesc(UUID buildingId);

  List<Unit> findByIdInAndIsCurrentTrue(List<UUID> ids);
}
