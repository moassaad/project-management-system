package com.projectmanagementsystem.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.projectmanagementsystem.auth.service.JwtService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Unit test for JWT without Docker — uses H2.
 */
@SpringBootTest
class JwtServiceTest {

    @Autowired
    private JwtService jwtService;

    @Test
    void generatesAndValidatesTokens() {
        UUID userId = UUID.randomUUID();
        String access = jwtService.generateAccessToken(userId);
        assertThat(jwtService.isValid(access)).isTrue();
        assertThat(jwtService.isAccessToken(access)).isTrue();
        assertThat(jwtService.getUserId(access)).isEqualTo(userId);

        UUID jti = UUID.randomUUID();
        String refresh = jwtService.generateRefreshToken(userId, jti);
        assertThat(jwtService.isValid(refresh)).isTrue();
        assertThat(jwtService.isRefreshToken(refresh)).isTrue();
        assertThat(jwtService.getJti(refresh)).isEqualTo(jti);
    }

    @Test
    void rejectsTamperedToken() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateAccessToken(userId);
        assertThat(jwtService.isValid(token + "tamper")).isFalse();
    }

    @Test
    void accessAndRefreshHaveDifferentTypes() {
        UUID userId = UUID.randomUUID();
        String access = jwtService.generateAccessToken(userId);
        String refresh = jwtService.generateRefreshToken(userId, UUID.randomUUID());
        assertThat(jwtService.isAccessToken(access)).isTrue();
        assertThat(jwtService.isRefreshToken(refresh)).isTrue();
        assertThat(jwtService.isRefreshToken(access)).isFalse();
        assertThat(jwtService.isAccessToken(refresh)).isFalse();
    }
}
