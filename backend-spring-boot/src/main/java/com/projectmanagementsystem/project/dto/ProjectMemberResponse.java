package com.projectmanagementsystem.project.dto;

import com.projectmanagementsystem.auth.entity.User;

public record ProjectMemberResponse(
        String id,
        String email,
        String role
) {
    public static ProjectMemberResponse from(User user, String role) {
        return new ProjectMemberResponse(
                user.getId().toString(),
                user.getEmail(),
                role);
    }
}
