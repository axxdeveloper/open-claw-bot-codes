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
@Table(name = "owners")
public class Owner extends BaseEntity {

  @Column(nullable = false)
  private UUID buildingId;

  @Column(nullable = false)
  private String name;

  private String taxId;
  private String contactName;
  private String contactPhone;
  private String contactEmail;
  private String notes;

  @Column(nullable = false)
  private Boolean isActive = true;
}
