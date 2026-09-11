package com.projectmanagementsystem.common.exception;

/**
 * Stub exception for resource-not-found cases.
 * Used as foundation for RFC 9457 404 handling; no domain logic.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " not found" + (id != null ? ": " + id : ""));
    }
}
