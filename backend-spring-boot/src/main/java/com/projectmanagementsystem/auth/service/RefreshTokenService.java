package com.projectmanagementsystem.auth.service;

import com.projectmanagementsystem.auth.entity.RefreshToken;
import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.auth.repository.RefreshTokenRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Refresh token storage — hashed token, jti, expiry, rotation/invalidation.
 */
@Service
public class RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final JwtService jwtService;

    public RefreshTokenService(RefreshTokenRepository repository, JwtService jwtService) {
        this.repository = repository;
        this.jwtService = jwtService;
    }

    public static String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    @Transactional
    public RefreshToken store(User user, String refreshToken) {
        UUID jti = jwtService.getJti(refreshToken);
        Instant expiresAt = jwtService.getExpiration(refreshToken);
        String hash = hash(refreshToken);
        RefreshToken entity = new RefreshToken(user, hash, jti, expiresAt);
        return repository.save(entity);
    }

    @Transactional(readOnly = true)
    public Optional<RefreshToken> findByToken(String token) {
        return repository.findByTokenHash(hash(token));
    }

    @Transactional(readOnly = true)
    public Optional<RefreshToken> findByJti(UUID jti) {
        return repository.findByJti(jti);
    }

    @Transactional
    public void revoke(RefreshToken token) {
        token.setRevoked(true);
        repository.save(token);
    }

    @Transactional
    public void revokeByJti(UUID jti) {
        repository.findByJti(jti).ifPresent(t -> {
            t.setRevoked(true);
            repository.save(t);
        });
    }

    @Transactional(readOnly = true)
    public boolean isValid(String token) {
        if (!jwtService.isValid(token) || !jwtService.isRefreshToken(token)) {
            return false;
        }
        Optional<RefreshToken> stored = findByToken(token);
        if (stored.isEmpty()) {
            return false;
        }
        RefreshToken rt = stored.get();
        if (rt.isRevoked() || rt.isExpired()) {
            return false;
        }
        // Ensure JWT jti matches stored jti
        UUID jti = jwtService.getJti(token);
        return jti != null && jti.equals(rt.getJti());
    }

    @Transactional
    public void deleteByUserId(UUID userId) {
        repository.deleteByUserId(userId);
    }
}
