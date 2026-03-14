package com.cre.leaseos.domain;

public class Enums {
  public enum LeaseStatus { DRAFT, ACTIVE, TERMINATED }

  public enum OccupancyStatus { DRAFT, ACTIVE, ENDED }

  public enum RepairScopeType { FLOOR, COMMON_AREA }

  public enum RepairStatus { DRAFT, QUOTED, APPROVED, IN_PROGRESS, COMPLETED, ACCEPTED, REJECTED }

  public enum AcceptanceResult { PASS, FAIL, CONDITIONAL }
}
