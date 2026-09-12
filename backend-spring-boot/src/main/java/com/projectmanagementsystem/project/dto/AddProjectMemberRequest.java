package com.projectmanagementsystem.project.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import java.util.UUID;

/**
 * Add member by id or email — at least one must be provided.
 * When both are given, userId takes precedence.
 */
public record AddProjectMemberRequest(
        UUID userId,
        @Email String email
) {
    @AssertTrue(message = "Either userId or email must be provided")
    public boolean isTargetPresent() {
        return userId != null || (email != null && !email.isBlank());
    }
}
