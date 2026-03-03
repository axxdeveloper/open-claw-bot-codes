package com.cre.leaseos.repo;

import com.cre.leaseos.domain.Vendor;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorRepo extends JpaRepository<Vendor, UUID> {
  List<Vendor> findByBuildingIdOrderByCreatedAtDesc(UUID buildingId);

  List<Vendor> findByBuildingIdOrderByNameAsc(UUID buildingId);
}
