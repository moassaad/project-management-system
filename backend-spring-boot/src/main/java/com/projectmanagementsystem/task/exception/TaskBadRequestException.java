package com.projectmanagementsystem.task.exception;

/**
 * Thrown on invalid task query input (e.g. unknown enum filter value).
 * Mapped to 400 RFC 9457 ProblemDetails.
 */
public class TaskBadRequestException extends RuntimeException {

    public TaskBadRequestException(String message) {
        super(message);
    }
}
