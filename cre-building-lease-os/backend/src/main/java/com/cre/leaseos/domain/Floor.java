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
@Table(name = "floors")
public class Floor extends BaseEntity {

  @Column(nullable = false)
  private UUID buildingId;

  @Column(nullable = false)
  private String label;

  @Column(nullable = false)
  private Integer sortIndex;
}
