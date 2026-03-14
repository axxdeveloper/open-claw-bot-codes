package com.cre.leaseos.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * CI-friendly Testcontainers integration sample.
 *
 * <p>Run with docker-enabled environment; skipped automatically when docker is unavailable.
 */
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest
@AutoConfigureMockMvc
class CommercialFlowTestcontainersIT {

  @Container
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

  @DynamicPropertySource
  static void configure(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
    registry.add("spring.flyway.enabled", () -> true);
    registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
  }

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  @Test
  void shouldBootWithPostgresContainerAndCreateBuilding() throws Exception {
    mockMvc
        .perform(
            post("/api/buildings")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Actor-Id", "tc-user")
                .content(objectMapper.writeValueAsString(Map.of("name", "TC Building"))))
        .andExpect(status().isCreated());
  }
}
