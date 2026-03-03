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
@Table(name = "lease_units")
public class LeaseUnit extends BaseEntity {

  @Column(nullable = false)
  private UUID leaseId;

  @Column(nullable = false)
  private UUID unitId;
}
