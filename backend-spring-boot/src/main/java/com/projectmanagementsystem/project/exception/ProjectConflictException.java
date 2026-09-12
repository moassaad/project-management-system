package com.projectmanagementsystem.project.exception;

/**
 * Thrown on conflicting project state (e.g. adding an existing member).
 * Mapped to 409 RFC 9457 ProblemDetails.
 */
public class ProjectConflictException extends RuntimeException {

    public ProjectConflictException(String message) {
        super(message);
    }
}
