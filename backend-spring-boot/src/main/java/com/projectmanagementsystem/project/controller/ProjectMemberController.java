package com.projectmanagementsystem.project.controller;

import com.projectmanagementsystem.auth.exception.InvalidRefreshTokenException;
import com.projectmanagementsystem.project.dto.AddProjectMemberRequest;
import com.projectmanagementsystem.project.dto.AddProjectMemberResponse;
import com.projectmanagementsystem.project.dto.ProjectMemberResponse;
import com.projectmanagementsystem.project.service.ProjectService;
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

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Add project member", description = "Adds an existing user by id or email; owner only")
    public ResponseEntity<Map<String, AddProjectMemberResponse>> add(
            @PathVariable UUID projectId,
            @Valid @RequestBody AddProjectMemberRequest req) {
        AddProjectMemberResponse response = projectService.addMember(currentUserId(), projectId, req);
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
