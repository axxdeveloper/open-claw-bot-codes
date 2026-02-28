package com.cre.leaseos.repo;

import com.cre.leaseos.domain.RepairRecord;
import com.cre.leaseos.domain.Enums.RepairScopeType;
import com.cre.leaseos.domain.Enums.RepairStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface RepairRecordRepo extends JpaRepository<RepairRecord, UUID> {
  List<RepairRecord> findByBuildingIdOrderByCreatedAtDesc(UUID buildingId);

  List<RepairRecord> findByBuildingIdAndFloorIdOrderByCreatedAtDesc(UUID buildingId, UUID floorId);

  @Query(
      "select r from RepairRecord r where r.buildingId=:buildingId"
          + " and (:status is null or r.status=:status)"
          + " and (:scopeType is null or r.scopeType=:scopeType)"
          + " and (:floorId is null or r.floorId=:floorId)"
          + " and (:commonAreaId is null or r.commonAreaId=:commonAreaId)"
          + " order by r.createdAt desc")
  List<RepairRecord> filter(
      UUID buildingId,
      RepairStatus status,
      RepairScopeType scopeType,
      UUID floorId,
      UUID commonAreaId);
}
