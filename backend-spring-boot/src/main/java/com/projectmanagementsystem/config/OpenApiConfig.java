package com.projectmanagementsystem.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI configuration — generates spec at /v3/api-docs and Swagger UI at /swagger-ui.html.
 * Verified compatible with Spring Boot 4.1.1 (springdoc-openapi-starter-webmvc-ui 3.1.1).
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI api() {
        return new OpenAPI()
                .info(new Info()
                        .title("Project Management System")
                        .version("v1")
                        .description("Project Management System API — generated from code, not manually edited"))
                .servers(List.of(new Server().url("/api/v1")))
                .openapi("3.1.0");
    }
}
