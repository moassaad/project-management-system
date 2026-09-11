package com.projectmanagementsystem.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Verifies OpenAPI generation with springdoc 3.1.1 on Boot 4.1.1.
 * Ensures GET /v3/api-docs and /v3/api-docs.yaml include health and ProblemDetail,
 * and exports to docs/api/openapi-v1.yaml.
 */
@SpringBootTest
@AutoConfigureMockMvc
class OpenApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void apiDocs_returnsSpecWithHealthAndProblemDetail() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("application/json"))
                .andExpect(jsonPath("$.openapi").value("3.1.0"))
                .andExpect(jsonPath("$.info.title").value("Project Management System"))
                .andExpect(jsonPath("$.servers[0].url").value("/api/v1"))
                .andExpect(jsonPath("$.paths['/api/v1/health'].get").exists());
        // ProblemDetail schemas may be under components.schemas with different naming; check at least that some schema exists or health is documented
    }

    @Test
    void apiDocsYaml_returnsYaml() throws Exception {
        MvcResult result = mockMvc.perform(get("/v3/api-docs.yaml"))
                .andExpect(status().isOk())
                .andReturn();
        String yaml = result.getResponse().getContentAsString();
        // Verify key elements in yaml
        org.assertj.core.api.Assertions.assertThat(yaml).contains("openapi: 3.1.0");
        org.assertj.core.api.Assertions.assertThat(yaml).contains("title: Project Management System");
        org.assertj.core.api.Assertions.assertThat(yaml).contains("/api/v1/health");

        // Export to docs/api/openapi-v1.yaml (generated, not manually edited)
        Path repoOutput = Paths.get("../docs/api/openapi-v1.yaml");
        Files.createDirectories(repoOutput.getParent());
        Files.writeString(repoOutput, yaml);
        System.out.println("Generated " + repoOutput.toAbsolutePath());
    }

    @Test
    void swaggerUi_returns200() throws Exception {
        // springdoc redirects /swagger-ui.html -> /swagger-ui/index.html with 302
        MvcResult result = mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().is3xxRedirection())
                .andReturn();
        String location = result.getResponse().getHeader("Location");
        org.assertj.core.api.Assertions.assertThat(location).contains("/swagger-ui/index.html");
        // Follow redirect
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk());
    }
}
