package com.projectmanagementsystem.auth.controller;

import com.projectmanagementsystem.auth.dto.LoginRequest;
import com.projectmanagementsystem.auth.dto.LoginResponse;
import com.projectmanagementsystem.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.projectmanagementsystem.auth.entity.User;
import jakarta.validation.Valid;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
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

    @PostMapping(value = "/logout", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Logout", description = "Clears refresh cookie and invalidates stored refresh")
    public ResponseEntity<Void> logout(
            @CookieValue(value = "refreshToken", required = false) String refreshToken) {
        authService.logout(refreshToken);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path("/api/v1/auth/refresh")
                .maxAge(0)
                .build();

        // Also clear with broader path for compatibility (some browsers set without path)
        ResponseCookie clear2 = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path("/api/v1/auth")
                .maxAge(0)
                .build();

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .header(HttpHeaders.SET_COOKIE, clear2.toString())
                .build();
    }

    @GetMapping(value = "/me", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Current user", description = "Returns current authenticated user")
    public ResponseEntity<Map<String, Map<String, Object>>> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = UUID.fromString(authentication.getPrincipal().toString());
        User user = authService.getMe(userId);
        Map<String, Object> data = Map.of(
                "id", user.getId().toString(),
                "email", user.getEmail(),
                "createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : Instant.now().toString()
        );
        return ResponseEntity.ok(Map.of("data", data));
    }
}
