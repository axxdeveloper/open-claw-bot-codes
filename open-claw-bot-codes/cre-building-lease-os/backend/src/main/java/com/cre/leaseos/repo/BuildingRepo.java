package com.cre.leaseos.repo;

import com.cre.leaseos.domain.Building;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BuildingRepo extends JpaRepository<Building, UUID> {
  List<Building> findAllByOrderByCreatedAtDesc();
}
