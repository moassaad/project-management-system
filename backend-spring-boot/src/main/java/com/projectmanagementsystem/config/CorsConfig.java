package com.projectmanagementsystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * CORS for http://localhost:5173 with allowCredentials true.
 * CSRF: SameSite=Strict HttpOnly refresh cookie + stateless JWT (no session, no CSRF token needed as cookie not accessible via JS and SameSite prevents cross-site).
 * No JS access to refresh cookie verified via HttpOnly.
 * Temporary for Sprint 002, hardened in Sprint 013.
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("http://localhost:5173");
        config.addAllowedHeader("Authorization");
        config.addAllowedHeader("Content-Type");
        config.addAllowedHeader("Accept");
        config.addAllowedHeader("X-Requested-With");
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PATCH");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("OPTIONS");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply to versioned API; keep open for health endpoint as well
        source.registerCorsConfiguration("/api/v1/**", config);
        source.registerCorsConfiguration("/api/**", config);
        return new CorsFilter(source);
    }
}
