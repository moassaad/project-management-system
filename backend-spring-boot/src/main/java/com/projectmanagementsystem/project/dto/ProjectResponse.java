package com.projectmanagementsystem.project.dto;

import com.projectmanagementsystem.project.entity.Project;

public record ProjectResponse(
        String id,
        String name,
        String description,
        String ownerId,
        String createdAt
) {
    public static ProjectResponse from(Project project) {
        return new ProjectResponse(
                project.getId().toString(),
                project.getName(),
                project.getDescription(),
                project.getOwner().getId().toString(),
                project.getCreatedAt() != null ? project.getCreatedAt().toString() : null
        );
    }
}
