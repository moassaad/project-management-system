package com.projectmanagementsystem.auth.service;

import com.projectmanagementsystem.auth.dto.LoginResponse;
import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.auth.exception.InvalidCredentialsException;
import com.projectmanagementsystem.auth.exception.InvalidRefreshTokenException;
import com.projectmanagementsystem.auth.repository.UserRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserRepository users,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       RefreshTokenService refreshTokenService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    public record LoginResult(LoginResponse response, String refreshToken) {}
    public record RefreshResult(String accessToken, String refreshToken) {}

    @Transactional
    public LoginResult login(String email, String password) {
        User user = users.findByEmail(email)
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        String accessToken = jwtService.generateAccessToken(user.getId());
        UUID jti = UUID.randomUUID();
        String refreshToken = jwtService.generateRefreshToken(user.getId(), jti);
        refreshTokenService.store(user, refreshToken);

        LoginResponse resp = new LoginResponse(
                accessToken,
                new LoginResponse.UserDto(user.getId(), user.getEmail())
        );
        return new LoginResult(resp, refreshToken);
    }

    @Transactional
    public RefreshResult refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new InvalidRefreshTokenException("Missing refresh token");
        }
        if (!jwtService.isValid(refreshToken) || !jwtService.isRefreshToken(refreshToken)) {
            throw new InvalidRefreshTokenException();
        }
        UUID userId = jwtService.getUserId(refreshToken);
        UUID jti = jwtService.getJti(refreshToken);
        var storedOpt = refreshTokenService.findByToken(refreshToken);
        if (storedOpt.isEmpty()) {
            throw new InvalidRefreshTokenException();
        }
        var stored = storedOpt.get();
        if (stored.isRevoked()) {
            // Reuse detected — invalidate chain
            refreshTokenService.deleteByUserId(userId);
            throw new InvalidRefreshTokenException("Refresh token reuse detected");
        }
        if (stored.isExpired() || jwtService.getExpiration(refreshToken).isBefore(Instant.now())) {
            refreshTokenService.revoke(stored);
            throw new InvalidRefreshTokenException("Refresh token expired");
        }
        if (jti == null || !jti.equals(stored.getJti())) {
            throw new InvalidRefreshTokenException();
        }
        // Invalidate old
        refreshTokenService.revoke(stored);
        User user = users.findById(userId)
                .orElseThrow(InvalidRefreshTokenException::new);
        String newAccess = jwtService.generateAccessToken(userId);
        UUID newJti = UUID.randomUUID();
        String newRefresh = jwtService.generateRefreshToken(userId, newJti);
        refreshTokenService.store(user, newRefresh);
        return new RefreshResult(newAccess, newRefresh);
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        refreshTokenService.findByToken(refreshToken).ifPresent(rt -> {
            // Revoke and delete to invalidate
            refreshTokenService.revoke(rt);
        });
        // Also try to parse userId for chain cleanup if needed, but not required for idempotent
        try {
            if (jwtService.isValid(refreshToken) && jwtService.isRefreshToken(refreshToken)) {
                UUID jti = jwtService.getJti(refreshToken);
                if (jti != null) {
                    refreshTokenService.findByJti(jti).ifPresent(rt -> refreshTokenService.revoke(rt));
                }
            }
        } catch (Exception ignored) {
        }
    }

    @Transactional(readOnly = true)
    public User getMe(UUID userId) {
        return users.findById(userId)
                .orElseThrow(() -> new InvalidRefreshTokenException("User not found"));
    }
}
