package com.cre.leaseos.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "buildings")
public class Building extends BaseEntity {

  @Column(nullable = false)
  private String name;

  @Column(unique = true)
  private String code;

  private String address;

  @Column(precision = 12, scale = 2)
  private BigDecimal managementFee;
}
