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
@Table(name = "common_areas")
public class CommonArea extends BaseEntity {

  @Column(nullable = false)
  private UUID buildingId;

  private UUID floorId;

  @Column(nullable = false)
  private String name;

  private String code;
  private String description;
  private String notes;
}
