package com.projectmanagementsystem.auth.dto;

import java.util.UUID;

public record LoginResponse(
        String accessToken,
        UserDto user
) {
    public record UserDto(UUID id, String email) {}
}
