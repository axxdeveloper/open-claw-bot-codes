package com.cre.leaseos.repo;

import com.cre.leaseos.domain.FloorOwner;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FloorOwnerRepo extends JpaRepository<FloorOwner, UUID> {
  List<FloorOwner> findByFloorIdOrderByStartDateDesc(UUID floorId);
}
