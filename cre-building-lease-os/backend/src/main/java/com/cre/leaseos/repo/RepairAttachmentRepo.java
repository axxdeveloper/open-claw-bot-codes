package com.cre.leaseos.repo;

import com.cre.leaseos.domain.RepairAttachment;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepairAttachmentRepo extends JpaRepository<RepairAttachment, UUID> {
  List<RepairAttachment> findByRepairIdOrderByCreatedAtDesc(UUID repairId);
}
