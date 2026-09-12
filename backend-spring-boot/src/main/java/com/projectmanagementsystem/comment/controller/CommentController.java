package com.projectmanagementsystem.comment.controller;

import com.projectmanagementsystem.auth.exception.InvalidRefreshTokenException;
import com.projectmanagementsystem.comment.dto.CommentResponse;
import com.projectmanagementsystem.comment.dto.CreateCommentRequest;
import com.projectmanagementsystem.comment.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/tasks/{taskId}/comments")
@Tag(name = "comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "List task comments", description = "Lists comments in creation order; members only")
    public ResponseEntity<Map<String, List<CommentResponse>>> list(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId) {
        return ResponseEntity.ok(Map.of("data", commentService.list(currentUserId(), projectId, taskId)));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Add task comment", description = "Adds a comment as the caller; members only")
    public ResponseEntity<Map<String, CommentResponse>> create(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @Valid @RequestBody CreateCommentRequest req) {
        CommentResponse response = commentService.create(currentUserId(), projectId, taskId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", response));
    }

    private UUID currentUserId() {
        // SecurityConfig already requires authentication for /api/v1/**;
        // this guard only maps a missing identity to 401 ProblemDetails.
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new InvalidRefreshTokenException("Authentication required");
        }
        try {
            return UUID.fromString(authentication.getPrincipal().toString());
        } catch (IllegalArgumentException e) {
            throw new InvalidRefreshTokenException("Authentication required");
        }
    }
}
