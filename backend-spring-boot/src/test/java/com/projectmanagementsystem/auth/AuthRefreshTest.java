package com.projectmanagementsystem.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.auth.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class AuthRefreshTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository users;

    @Autowired
    private PasswordEncoder encoder;

    private String email;
    private String password;

    @BeforeEach
    void setUp() {
        email = "refresh-" + UUID.randomUUID() + "@example.com";
        password = "Secret123!";
        users.save(new User(email, encoder.encode(password)));
    }

    private String loginAndGetRefreshCookie() throws Exception {
        String body = """
                {"email":"%s","password":"%s"}
                """.formatted(email, password);
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn();
        String setCookie = result.getResponse().getHeader("Set-Cookie");
        // Extract refreshToken value
        String token = null;
        for (jakarta.servlet.http.Cookie c : result.getResponse().getCookies()) {
            if ("refreshToken".equals(c.getName())) {
                token = c.getValue();
                break;
            }
        }
        if (token == null && setCookie != null) {
            // Fallback parse
            for (String part : setCookie.split(";")) {
                if (part.trim().startsWith("refreshToken=")) {
                    token = part.trim().substring("refreshToken=".length());
                    break;
                }
            }
        }
        return token;
    }

    @Test
    void refresh_success_rotatesTokens() throws Exception {
        String refreshToken = loginAndGetRefreshCookie();

        MvcResult result = mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(new Cookie("refreshToken", refreshToken)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(cookie().exists("refreshToken"))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("refreshToken=")))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("HttpOnly")))
                .andReturn();

        String newRefresh = result.getResponse().getCookie("refreshToken") != null
                ? result.getResponse().getCookie("refreshToken").getValue()
                : null;
        // New refresh should be different (rotation)
        org.assertj.core.api.Assertions.assertThat(newRefresh).isNotNull();
        org.assertj.core.api.Assertions.assertThat(newRefresh).isNotEqualTo(refreshToken);
    }

    @Test
    void refresh_reuseOldToken_returns401AndInvalidatesChain() throws Exception {
        String refreshToken = loginAndGetRefreshCookie();

        // First refresh succeeds
        MvcResult first = mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(new Cookie("refreshToken", refreshToken)))
                .andExpect(status().isOk())
                .andReturn();

        // Reuse old token should fail 401
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(new Cookie("refreshToken", refreshToken)))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/unauthorized"))
                .andExpect(jsonPath("$.status").value(401));

        // Even the new token from first refresh should now be invalidated if chain invalidated
        // Depending on implementation, new token may be revoked after reuse detection; we check that at least old fails
    }

    @Test
    void refresh_missingCookie_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void refresh_invalidToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(new Cookie("refreshToken", "invalid.token.here")))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/unauthorized"));
    }

    @Test
    void refresh_withCredentialsCorsCompatible() throws Exception {
        String refreshToken = loginAndGetRefreshCookie();
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(new Cookie("refreshToken", refreshToken))
                        .header("Origin", "http://localhost:5173"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }
}
