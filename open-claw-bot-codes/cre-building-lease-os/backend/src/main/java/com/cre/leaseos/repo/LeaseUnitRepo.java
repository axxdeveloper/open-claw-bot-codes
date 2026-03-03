package com.cre.leaseos.repo;

import com.cre.leaseos.domain.Lease;
import com.cre.leaseos.domain.LeaseUnit;
import com.cre.leaseos.domain.Enums.LeaseStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LeaseUnitRepo extends JpaRepository<LeaseUnit, UUID> {
  List<LeaseUnit> findByLeaseId(UUID leaseId);

  void deleteByLeaseId(UUID leaseId);

  @Query(
      "select l from Lease l join LeaseUnit lu on l.id = lu.leaseId where lu.unitId in :unitIds and l.status = :status")
  List<Lease> findLeasesByUnitIdsAndStatus(List<UUID> unitIds, LeaseStatus status);
}
