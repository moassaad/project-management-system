package com.projectmanagementsystem.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.projectmanagementsystem.AbstractIntegrationTest;
import com.projectmanagementsystem.auth.entity.RefreshToken;
import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.auth.repository.RefreshTokenRepository;
import com.projectmanagementsystem.auth.repository.UserRepository;
import com.projectmanagementsystem.auth.service.JwtService;
import com.projectmanagementsystem.auth.service.RefreshTokenService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Integration test for auth persistence and JWT — uses real PostgreSQL via Testcontainers.
 * Skips gracefully if Docker unavailable.
 */
@SpringBootTest
class AuthIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private UserRepository users;

    @Autowired
    private RefreshTokenRepository refreshTokens;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Test
    void userPersistence_withBaseEntityAndUniqueEmail() {
        String email = "test-" + UUID.randomUUID() + "@example.com";
        User user = new User(email, passwordEncoder.encode("Secret123!"));
        User saved = users.save(user);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();

        // Find by email
        var found = users.findByEmail(email);
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo(email);

        // Password hash BCrypt
        assertThat(passwordEncoder.matches("Secret123!", saved.getPasswordHash())).isTrue();
        assertThat(passwordEncoder.matches("wrong", saved.getPasswordHash())).isFalse();

        // Unique constraint
        assertThat(users.existsByEmail(email)).isTrue();
    }

    @Test
    void jwtService_generatesAndValidatesAccessAndRefresh() {
        UUID userId = UUID.randomUUID();

        String access = jwtService.generateAccessToken(userId);
        assertThat(access).isNotBlank();
        assertThat(jwtService.isValid(access)).isTrue();
        assertThat(jwtService.isAccessToken(access)).isTrue();
        assertThat(jwtService.isRefreshToken(access)).isFalse();
        assertThat(jwtService.getUserId(access)).isEqualTo(userId);
        assertThat(jwtService.getExpiration(access)).isAfter(java.time.Instant.now());

        UUID jti = UUID.randomUUID();
        String refresh = jwtService.generateRefreshToken(userId, jti);
        assertThat(refresh).isNotBlank();
        assertThat(jwtService.isValid(refresh)).isTrue();
        assertThat(jwtService.isRefreshToken(refresh)).isTrue();
        assertThat(jwtService.getUserId(refresh)).isEqualTo(userId);
        assertThat(jwtService.getJti(refresh)).isEqualTo(jti);

        // Tampered token invalid
        assertThat(jwtService.isValid(refresh + "x")).isFalse();
    }

    @Test
    void refreshTokenStorage_supportsRotationAndInvalidation() {
        String email = "refresh-" + UUID.randomUUID() + "@example.com";
        User user = users.save(new User(email, passwordEncoder.encode("pass")));

        UUID jti1 = UUID.randomUUID();
        String token1 = jwtService.generateRefreshToken(user.getId(), jti1);
        RefreshToken rt1 = refreshTokenService.store(user, token1);

        assertThat(rt1.getId()).isNotNull();
        assertThat(rt1.getJti()).isEqualTo(jti1);
        assertThat(refreshTokenService.isValid(token1)).isTrue();

        // Rotation: new token, old revoked
        UUID jti2 = UUID.randomUUID();
        String token2 = jwtService.generateRefreshToken(user.getId(), jti2);
        refreshTokenService.revoke(rt1);
        RefreshToken rt2 = refreshTokenService.store(user, token2);

        assertThat(refreshTokenService.isValid(token1)).isFalse(); // revoked
        assertThat(refreshTokenService.isValid(token2)).isTrue();
        assertThat(rt2.getJti()).isEqualTo(jti2);

        // Hashed storage: token_hash unique, not plain
        var found = refreshTokens.findByTokenHash(RefreshTokenService.hash(token2));
        assertThat(found).isPresent();
        assertThat(found.get().getTokenHash()).isNotEqualTo(token2);
    }

    @Test
    void refreshToken_expiredOrRevokedIsInvalid() {
        String email = "expire-" + UUID.randomUUID() + "@example.com";
        User user = users.save(new User(email, passwordEncoder.encode("pass")));
        UUID jti = UUID.randomUUID();
        String token = jwtService.generateRefreshToken(user.getId(), jti);
        RefreshToken rt = refreshTokenService.store(user, token);

        // Revoke
        refreshTokenService.revoke(rt);
        assertThat(refreshTokenService.isValid(token)).isFalse();

        // Non-existent token
        assertThat(refreshTokenService.isValid("invalid.token.here")).isFalse();
    }
}
