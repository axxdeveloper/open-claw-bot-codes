package com.cre.leaseos.domain;

import com.cre.leaseos.domain.Enums.OccupancyStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "occupancies")
public class Occupancy extends BaseEntity {

  @Column(nullable = false)
  private UUID buildingId;

  @Column(nullable = false)
  private UUID unitId;

  @Column(nullable = false)
  private UUID tenantId;

  private UUID leaseId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private OccupancyStatus status;

  @Column(nullable = false)
  private LocalDate startDate;

  private LocalDate endDate;
}
