package com.projectmanagementsystem.task.exception;

/**
 * Thrown on task field validation beyond bean constraints
 * (invalid enum value, non-member assignee).
 * Mapped to 422 RFC 9457 ProblemDetails with errors [{detail, pointer}].
 */
public class TaskValidationException extends RuntimeException {

    private final String field;

    public TaskValidationException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
