package com.projectmanagementsystem.auth.controller;

import com.projectmanagementsystem.auth.dto.LoginRequest;
import com.projectmanagementsystem.auth.dto.LoginResponse;
import com.projectmanagementsystem.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Duration;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Login", description = "Authenticates user and returns accessToken + HttpOnly refresh cookie")
    public ResponseEntity<Map<String, LoginResponse>> login(@Valid @RequestBody LoginRequest req) {
        AuthService.LoginResult result = authService.login(req.email(), req.password());

        // Refresh cookie: HttpOnly, Secure, SameSite=Strict, Path=/api/v1/auth/refresh, Max-Age 7d
        // Secure=true requires HTTPS; for local dev without HTTPS, cookie still set but browser may ignore Secure on http
        // We set Secure=true per spec; withCredentials CORS handles it
        ResponseCookie cookie = ResponseCookie.from("refreshToken", result.refreshToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path("/api/v1/auth/refresh")
                .maxAge(Duration.ofDays(7))
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("data", result.response()));
    }

    @PostMapping(value = "/refresh", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Refresh", description = "Rotates refresh token and returns new accessToken + new HttpOnly refresh cookie")
    public ResponseEntity<Map<String, Map<String, String>>> refresh(
            @CookieValue(value = "refreshToken", required = false) String refreshToken) {
        AuthService.RefreshResult result = authService.refresh(refreshToken);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", result.refreshToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path("/api/v1/auth/refresh")
                .maxAge(Duration.ofDays(7))
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("data", Map.of("accessToken", result.accessToken())));
    }
}
