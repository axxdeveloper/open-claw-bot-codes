package com.cre.leaseos.repo;

import com.cre.leaseos.domain.Tenant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepo extends JpaRepository<Tenant, UUID> {
  List<Tenant> findByBuildingIdOrderByCreatedAtDesc(UUID buildingId);
}
