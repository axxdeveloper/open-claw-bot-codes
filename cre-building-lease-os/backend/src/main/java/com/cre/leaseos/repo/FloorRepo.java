package com.cre.leaseos.repo;

import com.cre.leaseos.domain.Floor;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FloorRepo extends JpaRepository<Floor, UUID> {
  List<Floor> findByBuildingIdOrderBySortIndexAsc(UUID buildingId);

  void deleteByBuildingId(UUID buildingId);
}
