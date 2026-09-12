package com.projectmanagementsystem.project.exception;

/**
 * Thrown when an authenticated user attempts a project operation
 * they are not authorized for (non-member access, non-owner write).
 * Mapped to 403 RFC 9457 ProblemDetails.
 */
public class ProjectForbiddenException extends RuntimeException {

    public ProjectForbiddenException(String message) {
        super(message);
    }
}
