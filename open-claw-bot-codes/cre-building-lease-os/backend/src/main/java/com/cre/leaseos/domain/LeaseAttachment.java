package com.cre.leaseos.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "lease_attachments")
public class LeaseAttachment extends BaseEntity {

  @Column(nullable = false)
  private UUID leaseId;

  @Column(nullable = false)
  private String fileName;

  @Column(nullable = false)
  private String fileUrl;

  @Column(nullable = false)
  private String contentType;
}
