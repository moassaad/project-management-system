package com.projectmanagementsystem.project.exception;

/**
 * Thrown on invalid project operations (e.g. removing the project owner).
 * Mapped to 400 RFC 9457 ProblemDetails.
 */
public class ProjectBadRequestException extends RuntimeException {

    public ProjectBadRequestException(String message) {
        super(message);
    }
}
