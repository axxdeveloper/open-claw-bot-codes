package com.cre.leaseos.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "floor_owners")
public class FloorOwner extends BaseEntity {

  @Column(nullable = false)
  private UUID floorId;

  @Column(nullable = false)
  private UUID ownerId;

  @Column(nullable = false, precision = 5, scale = 2)
  private BigDecimal sharePercent;

  @Column(nullable = false)
  private OffsetDateTime startDate;

  private OffsetDateTime endDate;

  private String notes;
}
