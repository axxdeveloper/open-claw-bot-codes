package com.cre.leaseos.repo;

import com.cre.leaseos.domain.Lease;
import com.cre.leaseos.domain.Enums.LeaseStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaseRepo extends JpaRepository<Lease, UUID> {
  List<Lease> findByBuildingIdOrderByCreatedAtDesc(UUID buildingId);

  List<Lease> findByBuildingIdAndStatus(UUID buildingId, LeaseStatus status);
}
