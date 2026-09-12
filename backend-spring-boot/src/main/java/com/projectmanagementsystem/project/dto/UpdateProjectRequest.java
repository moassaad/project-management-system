package com.projectmanagementsystem.project.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;

/**
 * Partial update — null fields are left unchanged.
 * A provided name must not be blank.
 */
public record UpdateProjectRequest(
        @Size(max = 255) String name,
        @Size(max = 255) String description
) {
    @AssertTrue(message = "Name must not be blank")
    public boolean isNameValid() {
        return name == null || !name.isBlank();
    }
}
