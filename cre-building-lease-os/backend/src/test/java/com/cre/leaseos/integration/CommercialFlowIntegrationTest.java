package com.cre.leaseos.integration;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cre.leaseos.domain.Unit;
import com.cre.leaseos.repo.UnitRepo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultMatcher;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test-fallback")
class CommercialFlowIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private UnitRepo unitRepo;

  @Test
  void floorGeneration_shouldKeepBasementOrder() throws Exception {
    UUID buildingId = createBuilding("Order Tower");

    postJson(
        "/api/buildings/" + buildingId + "/floors/generate",
        Map.of("basementFloors", 3, "aboveGroundFloors", 2),
        status().isCreated());

    mockMvc
        .perform(get("/api/buildings/" + buildingId + "/floors"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].label").value("B3"))
        .andExpect(jsonPath("$.data[0].sortIndex").value(-3))
        .andExpect(jsonPath("$.data[2].label").value("B1"))
        .andExpect(jsonPath("$.data[3].label").value("1F"))
        .andExpect(jsonPath("$.data[4].label").value("2F"));
  }

  @Test
  void unitSplitAndMerge_shouldKeepHistory() throws Exception {
    UUID buildingId = createBuilding("Split Merge Tower");
    postJson(
        "/api/buildings/" + buildingId + "/floors/generate",
        Map.of("basementFloors", 0, "aboveGroundFloors", 1),
        status().isCreated());

    UUID floorId = getFloorIdByLabel(buildingId, "1F");

    MvcResult createdUnit =
        postJson(
            "/api/floors/" + floorId + "/units",
            Map.of("code", "A1", "grossArea", new BigDecimal("100.00")),
            status().isCreated());
    UUID sourceId = UUID.fromString(getData(createdUnit).get("id").toString());

    MvcResult split =
        postJson(
            "/api/units/" + sourceId + "/split",
            Map.of(
                "parts",
                List.of(
                    Map.of("code", "A1-1", "grossArea", new BigDecimal("40.00")),
                    Map.of("code", "A1-2", "grossArea", new BigDecimal("60.00")))),
            status().isCreated());

    List<Map<String, Object>> splitUnits = getDataList(split);
    UUID child1 = UUID.fromString(splitUnits.get(0).get("id").toString());
    UUID child2 = UUID.fromString(splitUnits.get(1).get("id").toString());

    postJson(
        "/api/units/merge",
        Map.of(
            "unitIds", List.of(child1, child2),
            "code", "A1-M",
            "grossArea", new BigDecimal("100.00")),
        status().isCreated());

    mockMvc
        .perform(get("/api/floors/" + floorId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.units.length()").value(1))
        .andExpect(jsonPath("$.data.units[0].code").value("A1-M"));

    Unit source = unitRepo.findById(sourceId).orElseThrow();
    Unit oldChild1 = unitRepo.findById(child1).orElseThrow();
    Unit oldChild2 = unitRepo.findById(child2).orElseThrow();

    assertFalse(source.getIsCurrent());
    assertNotNull(source.getReplacedAt());
    assertFalse(oldChild1.getIsCurrent());
    assertFalse(oldChild2.getIsCurrent());
    assertNotNull(oldChild1.getReplacedByUnitId());
    assertNotNull(oldChild2.getReplacedByUnitId());
    assertEquals(oldChild1.getReplacedByUnitId(), oldChild2.getReplacedByUnitId());
  }

  @Test
  void activeLeaseShouldPromoteDraftOccupancy_andBlockOverlap() throws Exception {
    UUID buildingId = createBuilding("Lease Tower");
    postJson(
        "/api/buildings/" + buildingId + "/floors/generate",
        Map.of("basementFloors", 0, "aboveGroundFloors", 1),
        status().isCreated());
    UUID floorId = getFloorIdByLabel(buildingId, "1F");

    MvcResult createdUnit =
        postJson(
            "/api/floors/" + floorId + "/units",
            Map.of("code", "A1", "grossArea", new BigDecimal("88.00")),
            status().isCreated());
    UUID unitId = UUID.fromString(getData(createdUnit).get("id").toString());

    UUID tenant1 = createTenant(buildingId, "Happy Tenant A");
    UUID tenant2 = createTenant(buildingId, "Happy Tenant B");

    postJson(
        "/api/occupancies",
        Map.of(
            "buildingId", buildingId,
            "unitId", unitId,
            "tenantId", tenant1,
            "status", "DRAFT"),
        status().isCreated());

    MvcResult lease1 =
        postJson(
            "/api/leases",
            Map.of(
                "buildingId", buildingId,
                "tenantId", tenant1,
                "unitIds", List.of(unitId),
                "status", "ACTIVE",
                "startDate", "2026-03-01",
                "endDate", "2027-02-28"),
            status().isCreated());

    UUID leaseId = UUID.fromString(getData(lease1).get("id").toString());

    mockMvc
        .perform(get("/api/leases/" + leaseId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.occupancies[0].status").value("ACTIVE"));

    mockMvc
        .perform(
            post("/api/leases")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Actor-Id", "it-user")
                .content(
                    objectMapper.writeValueAsString(
                        Map.of(
                            "buildingId", buildingId,
                            "tenantId", tenant2,
                            "unitIds", List.of(unitId),
                            "status", "ACTIVE",
                            "startDate", "2026-08-01",
                            "endDate", "2027-08-01"))))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.error.code").value("CONFLICT"))
        .andExpect(jsonPath("$.error.details.reasonCode").value("OVERLAPPING_ACTIVE_LEASE"));
  }

  @Test
  void repairValidation_andAcceptedRequiredFields() throws Exception {
    UUID buildingId = createBuilding("Repair Tower");
    postJson(
        "/api/buildings/" + buildingId + "/floors/generate",
        Map.of("basementFloors", 0, "aboveGroundFloors", 1),
        status().isCreated());
    UUID floorId = getFloorIdByLabel(buildingId, "1F");

    mockMvc
        .perform(
            post("/api/repairs")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Actor-Id", "it-user")
                .content(
                    objectMapper.writeValueAsString(
                        Map.of(
                            "buildingId", buildingId,
                            "scopeType", "FLOOR",
                            "item", "消防泵浦",
                            "vendorName", "Vendor A",
                            "quoteAmount", 1000,
                            "status", "DRAFT"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("VALIDATION"));

    mockMvc
        .perform(
            post("/api/repairs")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Actor-Id", "it-user")
                .content(
                    objectMapper.writeValueAsString(
                        Map.of(
                            "buildingId", buildingId,
                            "scopeType", "FLOOR",
                            "floorId", floorId,
                            "item", "消防泵浦",
                            "vendorName", "Vendor A",
                            "quoteAmount", 1000,
                            "status", "ACCEPTED",
                            "acceptanceResult", "PASS"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.details.reasonCode").value("BUSINESS_RULE_VIOLATION"));

    mockMvc
        .perform(
            post("/api/repairs")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Actor-Id", "it-user")
                .content(
                    objectMapper.writeValueAsString(
                        Map.of(
                            "buildingId", buildingId,
                            "scopeType", "FLOOR",
                            "floorId", floorId,
                            "item", "消防泵浦",
                            "vendorName", "Vendor A",
                            "quoteAmount", 1000,
                            "status", "ACCEPTED",
                            "acceptanceResult", "PASS",
                            "inspectorName", "王主任"))))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.data.acceptedAt").isNotEmpty());
  }

  @Test
  void listEndpoints_shouldSupportPaginationParameters() throws Exception {
    UUID buildingId = createBuilding("Pagination Tower");
    createTenant(buildingId, "Tenant A");
    createTenant(buildingId, "Tenant B");

    mockMvc
        .perform(get("/api/buildings/" + buildingId + "/tenants?page=0&size=1&sort=createdAt,asc"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.items.length()").value(1))
        .andExpect(jsonPath("$.data.totalElements").value(2))
        .andExpect(jsonPath("$.data.page").value(0));
  }

  @Test
  void ownerAssign_shouldValidateShareAndPeriod() throws Exception {
    UUID buildingId = createBuilding("Owner Tower");
    postJson(
        "/api/buildings/" + buildingId + "/floors/generate",
        Map.of("basementFloors", 0, "aboveGroundFloors", 1),
        status().isCreated());
    UUID floorId = getFloorIdByLabel(buildingId, "1F");

    UUID ownerA = createOwner(buildingId, "Owner A");
    UUID ownerB = createOwner(buildingId, "Owner B");

    postJson(
        "/api/floors/" + floorId + "/owners/assign",
        Map.of(
            "ownerId", ownerA,
            "sharePercent", new BigDecimal("60"),
            "startDate", OffsetDateTime.parse("2026-01-01T00:00:00+08:00")),
        status().isCreated());

    mockMvc
        .perform(
            post("/api/floors/" + floorId + "/owners/assign")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Actor-Id", "it-user")
                .content(
                    objectMapper.writeValueAsString(
                        Map.of(
                            "ownerId", ownerB,
                            "sharePercent", new BigDecimal("50"),
                            "startDate", OffsetDateTime.parse("2026-02-01T00:00:00+08:00")))))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.error.code").value("CONFLICT"))
        .andExpect(jsonPath("$.error.details.reasonCode").value("OWNER_SHARE_OVER_ALLOCATED"));

    mockMvc
        .perform(
            post("/api/floors/" + floorId + "/owners/assign")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Actor-Id", "it-user")
                .content(
                    objectMapper.writeValueAsString(
                        Map.of(
                            "ownerId", ownerB,
                            "sharePercent", new BigDecimal("20"),
                            "startDate", OffsetDateTime.parse("2026-03-02T00:00:00+08:00"),
                            "endDate", OffsetDateTime.parse("2026-03-01T00:00:00+08:00")))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("VALIDATION"))
        .andExpect(jsonPath("$.error.details.reasonCode").value("INVALID_DATE_RANGE"));
  }

  private UUID createBuilding(String name) throws Exception {
    MvcResult created =
        postJson(
            "/api/buildings",
            Map.of("name", name, "managementFee", new BigDecimal("50.00")),
            status().isCreated());
    return UUID.fromString(getData(created).get("id").toString());
  }

  private UUID createTenant(UUID buildingId, String name) throws Exception {
    MvcResult created =
        postJson(
            "/api/buildings/" + buildingId + "/tenants",
            Map.of("name", name, "contactEmail", name.replace(" ", "").toLowerCase() + "@mail.com"),
            status().isCreated());
    return UUID.fromString(getData(created).get("id").toString());
  }

  private UUID createOwner(UUID buildingId, String name) throws Exception {
    MvcResult created =
        postJson(
            "/api/buildings/" + buildingId + "/owners",
            Map.of("name", name, "contactEmail", name.replace(" ", "").toLowerCase() + "@mail.com"),
            status().isCreated());
    return UUID.fromString(getData(created).get("id").toString());
  }

  private UUID getFloorIdByLabel(UUID buildingId, String label) throws Exception {
    MvcResult list = mockMvc.perform(get("/api/buildings/" + buildingId + "/floors")).andReturn();
    List<Map<String, Object>> floors = getDataList(list);
    return floors.stream()
        .filter(f -> label.equals(f.get("label")))
        .map(f -> UUID.fromString(f.get("id").toString()))
        .findFirst()
        .orElseThrow();
  }

  private MvcResult postJson(String path, Object payload, ResultMatcher expected) throws Exception {
    return mockMvc
        .perform(
            post(path)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Actor-Id", "it-user")
                .content(objectMapper.writeValueAsString(payload)))
        .andExpect(expected)
        .andReturn();
  }

  private Map<String, Object> getData(MvcResult result) throws Exception {
    Map<String, Object> body =
        objectMapper.readValue(result.getResponse().getContentAsString(), new TypeReference<>() {});
    return (Map<String, Object>) body.get("data");
  }

  private List<Map<String, Object>> getDataList(MvcResult result) throws Exception {
    Map<String, Object> body =
        objectMapper.readValue(result.getResponse().getContentAsString(), new TypeReference<>() {});
    return (List<Map<String, Object>>) body.get("data");
  }
}
