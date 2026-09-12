package com.projectmanagementsystem.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

public record CreateTaskRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 255) String description,
        String type,
        String status,
        String priority,
        UUID assigneeId,
        LocalDate dueDate
) {}
