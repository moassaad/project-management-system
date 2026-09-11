package com.projectmanagementsystem.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies versioned API foundation: GET /api/v1/health and 404 problem+json for unknown.
 * Checks CORS temporary config for localhost:5173. Uses full Spring context with H2.
 * Since BE-S004-05, all /api/v1/** except health/login/refresh require Bearer.
 */
@SpringBootTest
@AutoConfigureMockMvc
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private com.projectmanagementsystem.auth.service.JwtService jwtService;

    @Autowired
    private com.projectmanagementsystem.auth.repository.UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Test
    void health_returns200WithUpStatus() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.data.status").value("UP"));
    }

    @Test
    void health_notUsingProblemDetailsForSuccess() throws Exception {
        // Success must be plain application/json, not problem+json
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                // ensure no problem fields
                .andExpect(jsonPath("$.type").doesNotExist())
                .andExpect(jsonPath("$.title").doesNotExist());
    }

    @Test
    void unknownPath_withoutAuth_returns401() throws Exception {
        // Since BE-S004-05, all /api/v1/** except health/login/refresh require Bearer
        mockMvc.perform(get("/api/v1/unknown"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/unauthorized"))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void unknownPath_withAuth_returns404ProblemJson() throws Exception {
        String token = createAccessTokenForHealthTest();
        mockMvc.perform(get("/api/v1/unknown")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/resource-not-found"))
                .andExpect(jsonPath("$.title").value("Resource not found"))
                .andExpect(jsonPath("$.status").value(404));
    }

    private String createAccessTokenForHealthTest() {
        String email = "health-" + java.util.UUID.randomUUID() + "@example.com";
        var user = new com.projectmanagementsystem.auth.entity.User(email, passwordEncoder.encode("Secret123!"));
        user = userRepository.save(user);
        return jwtService.generateAccessToken(user.getId());
    }

    @Test
    void cors_allowsLocalhost5173() throws Exception {
        mockMvc.perform(options("/api/v1/health")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    void versioning_usesControllerMappingNotContextPath() throws Exception {
        // Verifies /api/v1 prefix via controller, not server.servlet.context-path
        // If context-path were used, /health without prefix would succeed — it should 404
        mockMvc.perform(get("/health"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }
}
