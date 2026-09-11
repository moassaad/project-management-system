package com.projectmanagementsystem.api;

import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public liveness endpoint — foundation for versioned API.
 * No auth, no domain logic. Versioning via controller mapping, not context-path.
 */
@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @GetMapping(value = "/health", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Map<String, String>>> health() {
        return ResponseEntity.ok(Map.of("data", Map.of("status", "UP")));
    }
}
