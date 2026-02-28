package com.cre.leaseos.domain;

import com.cre.leaseos.domain.Enums.LeaseStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "leases")
public class Lease extends BaseEntity {

  @Column(nullable = false)
  private UUID buildingId;

  @Column(nullable = false)
  private UUID tenantId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private LeaseStatus status;

  @Column(nullable = false)
  private LocalDate startDate;

  @Column(nullable = false)
  private LocalDate endDate;

  @Column(precision = 12, scale = 2)
  private BigDecimal managementFee;

  @Column(precision = 12, scale = 2)
  private BigDecimal rent;

  @Column(precision = 12, scale = 2)
  private BigDecimal deposit;
}
