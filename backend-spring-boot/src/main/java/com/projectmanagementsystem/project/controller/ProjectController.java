package com.projectmanagementsystem.project.controller;

import com.projectmanagementsystem.auth.exception.InvalidRefreshTokenException;
import com.projectmanagementsystem.project.dto.CreateProjectRequest;
import com.projectmanagementsystem.project.dto.ProjectResponse;
import com.projectmanagementsystem.project.dto.UpdateProjectRequest;
import com.projectmanagementsystem.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/projects")
@Tag(name = "projects")
@Validated
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Create project", description = "Creates a project; creator becomes owner and member")
    public ResponseEntity<Map<String, ProjectResponse>> create(@Valid @RequestBody CreateProjectRequest req) {
        ProjectResponse response = projectService.create(currentUserId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", response));
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "List projects", description = "Lists projects the caller is a member of, paginated")
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int perPage) {
        ProjectService.ProjectPage result = projectService.list(currentUserId(), page, perPage);
        long lastPage = result.total() == 0 ? 0 : (result.total() + perPage - 1) / perPage;
        Map<String, Object> meta = Map.of(
                "currentPage", page,
                "perPage", perPage,
                "total", result.total(),
                "lastPage", lastPage);
        return ResponseEntity.ok(Map.of("data", result.data(), "meta", meta));
    }

    @GetMapping(value = "/{projectId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Get project", description = "Returns a project by id")
    public ResponseEntity<Map<String, ProjectResponse>> get(@PathVariable UUID projectId) {
        return ResponseEntity.ok(Map.of("data", projectService.get(projectId)));
    }

    @PatchMapping(value = "/{projectId}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Update project", description = "Partially updates a project; null fields unchanged")
    public ResponseEntity<Map<String, ProjectResponse>> patch(
            @PathVariable UUID projectId,
            @Valid @RequestBody UpdateProjectRequest req) {
        return ResponseEntity.ok(Map.of("data", projectService.patch(projectId, req)));
    }

    @DeleteMapping("/{projectId}")
    @Operation(summary = "Delete project", description = "Deletes a project and its memberships")
    public ResponseEntity<Void> delete(@PathVariable UUID projectId) {
        projectService.delete(projectId);
        return ResponseEntity.noContent().build();
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
