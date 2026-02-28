package com.cre.leaseos.repo;

import com.cre.leaseos.domain.Occupancy;
import com.cre.leaseos.domain.Enums.OccupancyStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OccupancyRepo extends JpaRepository<Occupancy, UUID> {
  List<Occupancy> findByBuildingIdAndStatus(UUID buildingId, OccupancyStatus status);

  List<Occupancy> findByUnitIdOrderByCreatedAtDesc(UUID unitId);

  Occupancy findFirstByUnitIdAndTenantIdAndStatusOrderByCreatedAtDesc(
      UUID unitId, UUID tenantId, OccupancyStatus status);
}
