package com.projectmanagementsystem.project.controller;

import com.projectmanagementsystem.auth.exception.InvalidRefreshTokenException;
import com.projectmanagementsystem.project.dto.ProjectMemberResponse;
import com.projectmanagementsystem.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/members")
@Tag(name = "project-members")
public class ProjectMemberController {

    private final ProjectService projectService;

    public ProjectMemberController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "List project members", description = "Lists members with roles; members only")
    public ResponseEntity<Map<String, List<ProjectMemberResponse>>> list(@PathVariable UUID projectId) {
        return ResponseEntity.ok(Map.of("data", projectService.listMembers(currentUserId(), projectId)));
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
