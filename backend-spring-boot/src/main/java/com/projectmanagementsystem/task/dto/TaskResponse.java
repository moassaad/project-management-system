package com.projectmanagementsystem.task.dto;

import com.projectmanagementsystem.task.entity.Task;

public record TaskResponse(
        String id,
        String projectId,
        String title,
        String description,
        String type,
        String status,
        String priority,
        String assigneeId,
        String dueDate,
        String createdAt
) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId().toString(),
                task.getProject().getId().toString(),
                task.getTitle(),
                task.getDescription(),
                task.getType() != null ? task.getType().name() : null,
                task.getStatus() != null ? task.getStatus().name() : null,
                task.getPriority() != null ? task.getPriority().name() : null,
                task.getAssignee() != null ? task.getAssignee().getId().toString() : null,
                task.getDueDate() != null ? task.getDueDate().toString() : null,
                task.getCreatedAt() != null ? task.getCreatedAt().toString() : null
        );
    }
}
