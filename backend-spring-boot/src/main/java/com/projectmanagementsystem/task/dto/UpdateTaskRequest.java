package com.projectmanagementsystem.task.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Partial update — null fields are left unchanged.
 * A provided title must not be blank.
 */
public record UpdateTaskRequest(
        @Size(max = 255) String title,
        @Size(max = 255) String description,
        String type,
        String status,
        String priority,
        UUID assigneeId,
        LocalDate dueDate
) {
    @AssertTrue(message = "Title must not be blank")
    public boolean isTitleValid() {
        return title == null || !title.isBlank();
    }
}
