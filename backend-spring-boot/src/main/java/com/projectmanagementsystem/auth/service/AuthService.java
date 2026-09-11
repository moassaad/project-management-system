package com.projectmanagementsystem.auth.service;

import com.projectmanagementsystem.auth.dto.LoginResponse;
import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.auth.exception.InvalidCredentialsException;
import com.projectmanagementsystem.auth.repository.UserRepository;
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
}
