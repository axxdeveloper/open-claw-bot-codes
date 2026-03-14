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
@Table(name = "units")
public class Unit extends BaseEntity {

  @Column(nullable = false)
  private UUID buildingId;

  @Column(nullable = false)
  private UUID floorId;

  @Column(nullable = false)
  private String code;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal grossArea;

  @Column(precision = 10, scale = 2)
  private BigDecimal netArea;

  @Column(precision = 10, scale = 2)
  private BigDecimal balconyArea;

  @Column(nullable = false)
  private Boolean isCurrent = true;

  private OffsetDateTime replacedAt;

  private UUID replacedByUnitId;

  private UUID sourceUnitId;
}
