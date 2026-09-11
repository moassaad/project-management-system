package com.projectmanagementsystem.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Global RFC 9457 Problem Details handler.
 * Produces {@code application/problem+json} without exposing internals.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final URI TYPE_VALIDATION_ERROR = URI.create("https://api.example.com/problems/validation-error");
    private static final URI TYPE_CONSTRAINT_VIOLATION = URI.create("https://api.example.com/problems/constraint-violation");
    private static final URI TYPE_RESOURCE_NOT_FOUND = URI.create("https://api.example.com/problems/resource-not-found");
    private static final URI TYPE_INTERNAL_ERROR = URI.create("https://api.example.com/problems/internal-server-error");

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "One or more fields are invalid.");
        problem.setType(TYPE_VALIDATION_ERROR);
        problem.setTitle("Validation failed");
        problem.setInstance(URI.create(request.getRequestURI()));

        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> Map.of(
                        "detail", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value",
                        "pointer", "#/" + fe.getField()))
                .collect(Collectors.toList());

        // Also include global errors if any
        if (errors.isEmpty() && ex.getBindingResult().hasGlobalErrors()) {
            errors = ex.getBindingResult().getGlobalErrors().stream()
                    .map(ge -> Map.of(
                            "detail", ge.getDefaultMessage() != null ? ge.getDefaultMessage() : "Invalid value",
                            "pointer", "#/" + ge.getObjectName()))
                    .collect(Collectors.toList());
        }

        problem.setProperty("errors", errors);
        return problem;
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "One or more constraints were violated.");
        problem.setType(TYPE_CONSTRAINT_VIOLATION);
        problem.setTitle("Constraint violation");
        problem.setInstance(URI.create(request.getRequestURI()));

        List<Map<String, String>> errors = ex.getConstraintViolations().stream()
                .map(v -> Map.of(
                        "detail", v.getMessage(),
                        "pointer", "#/" + v.getPropertyPath().toString()))
                .collect(Collectors.toList());

        problem.setProperty("errors", errors);
        return problem;
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        String detail = ex.getMessage() != null ? ex.getMessage() : "The requested resource was not found.";
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, detail);
        problem.setType(TYPE_RESOURCE_NOT_FOUND);
        problem.setTitle("Resource not found");
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ProblemDetail handleNoResourceFound(NoResourceFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                "The requested resource was not found.");
        problem.setType(TYPE_RESOURCE_NOT_FOUND);
        problem.setTitle("Resource not found");
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ProblemDetail handleNoHandlerFound(NoHandlerFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                "The requested resource was not found.");
        problem.setType(TYPE_RESOURCE_NOT_FOUND);
        problem.setTitle("Resource not found");
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception at {} {}", request.getMethod(), request.getRequestURI(), ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred.");
        problem.setType(TYPE_INTERNAL_ERROR);
        problem.setTitle("Internal server error");
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }
}
