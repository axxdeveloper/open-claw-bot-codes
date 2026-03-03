package com.cre.leaseos.domain;

import com.cre.leaseos.config.AuditContext;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Setter
@MappedSuperclass
public abstract class BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private OffsetDateTime updatedAt;

  @Column(nullable = false, updatable = false)
  private String createdBy;

  @Column(nullable = false)
  private String updatedBy;

  @PrePersist
  void prePersist() {
    String actor = AuditContext.getCurrentUser();
    if (createdBy == null || createdBy.isBlank()) {
      createdBy = actor;
    }
    updatedBy = actor;
  }

  @PreUpdate
  void preUpdate() {
    updatedBy = AuditContext.getCurrentUser();
  }
}
