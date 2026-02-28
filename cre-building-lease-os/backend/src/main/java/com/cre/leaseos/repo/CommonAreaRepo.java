package com.cre.leaseos.repo;

import com.cre.leaseos.domain.CommonArea;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommonAreaRepo extends JpaRepository<CommonArea, UUID> {
  List<CommonArea> findByBuildingIdOrderByCreatedAtDesc(UUID buildingId);

  List<CommonArea> findByBuildingIdOrderByNameAsc(UUID buildingId);
}
