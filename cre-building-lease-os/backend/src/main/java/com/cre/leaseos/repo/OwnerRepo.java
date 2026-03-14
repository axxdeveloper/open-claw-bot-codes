package com.cre.leaseos.repo;

import com.cre.leaseos.domain.Owner;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OwnerRepo extends JpaRepository<Owner, UUID> {
  List<Owner> findByBuildingIdOrderByCreatedAtDesc(UUID buildingId);

  List<Owner> findByBuildingIdOrderByNameAsc(UUID buildingId);
}
