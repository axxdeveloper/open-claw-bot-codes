package com.cre.leaseos.domain;

import com.cre.leaseos.domain.Enums.AcceptanceResult;
import com.cre.leaseos.domain.Enums.RepairScopeType;
import com.cre.leaseos.domain.Enums.RepairStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "repair_records")
public class RepairRecord extends BaseEntity {

  @Column(nullable = false)
  private UUID buildingId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private RepairScopeType scopeType;

  private UUID floorId;

  private UUID commonAreaId;

  @Column(nullable = false)
  private String item;

  private String description;

  private UUID vendorId;

  @Column(nullable = false)
  private String vendorName;

  private String vendorTaxId;

  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal quoteAmount;

  @Column(precision = 12, scale = 2)
  private BigDecimal approvedAmount;

  @Column(precision = 12, scale = 2)
  private BigDecimal finalAmount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private RepairStatus status;

  @Enumerated(EnumType.STRING)
  private AcceptanceResult acceptanceResult;

  private String inspectorName;

  @Column(nullable = false)
  private LocalDate reportedAt;

  private LocalDate startedAt;
  private LocalDate completedAt;

  private OffsetDateTime acceptedAt;

  private String notes;
}
