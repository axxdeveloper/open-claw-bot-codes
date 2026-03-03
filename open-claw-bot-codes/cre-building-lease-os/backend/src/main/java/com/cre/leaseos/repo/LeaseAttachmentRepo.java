package com.cre.leaseos.repo;

import com.cre.leaseos.domain.LeaseAttachment;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaseAttachmentRepo extends JpaRepository<LeaseAttachment, UUID> {
  List<LeaseAttachment> findByLeaseIdOrderByCreatedAtDesc(UUID leaseId);
}
