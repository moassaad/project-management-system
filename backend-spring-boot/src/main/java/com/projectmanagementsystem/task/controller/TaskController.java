package com.projectmanagementsystem.task.controller;

import com.projectmanagementsystem.auth.exception.InvalidRefreshTokenException;
import com.projectmanagementsystem.task.dto.CreateTaskRequest;
import com.projectmanagementsystem.task.dto.TaskResponse;
import com.projectmanagementsystem.task.dto.UpdateTaskRequest;
import com.projectmanagementsystem.task.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
@RequestMapping("/api/v1/projects/{projectId}/tasks")
@Tag(name = "tasks")
@Validated
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Create task", description = "Creates a task; members only, assignee must be a member")
    public ResponseEntity<Map<String, TaskResponse>> create(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest req) {
        TaskResponse response = taskService.create(currentUserId(), projectId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", response));
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "List tasks", description = "Lists project tasks, paginated; members only")
    public ResponseEntity<Map<String, Object>> list(
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int perPage) {
        TaskService.TaskPage result = taskService.list(currentUserId(), projectId, page, perPage);
        long lastPage = result.total() == 0 ? 0 : (result.total() + perPage - 1) / perPage;
        Map<String, Object> meta = Map.of(
                "currentPage", page,
                "perPage", perPage,
                "total", result.total(),
                "lastPage", lastPage);
        return ResponseEntity.ok(Map.of("data", result.data(), "meta", meta));
    }

    @GetMapping(value = "/{taskId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Get task", description = "Returns a task by id; members only")
    public ResponseEntity<Map<String, TaskResponse>> get(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId) {
        return ResponseEntity.ok(Map.of("data", taskService.get(currentUserId(), projectId, taskId)));
    }

    @PatchMapping(value = "/{taskId}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Update task", description = "Partially updates a task; null fields unchanged; members only")
    public ResponseEntity<Map<String, TaskResponse>> patch(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest req) {
        return ResponseEntity.ok(Map.of("data", taskService.patch(currentUserId(), projectId, taskId, req)));
    }

    @DeleteMapping("/{taskId}")
    @Operation(summary = "Delete task", description = "Deletes a task; members only")
    public ResponseEntity<Void> delete(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId) {
        taskService.delete(currentUserId(), projectId, taskId);
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
