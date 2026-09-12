package com.projectmanagementsystem.task.service;

import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.auth.repository.UserRepository;
import com.projectmanagementsystem.common.exception.ResourceNotFoundException;
import com.projectmanagementsystem.project.entity.Project;
import com.projectmanagementsystem.project.exception.ProjectForbiddenException;
import com.projectmanagementsystem.project.repository.ProjectMemberRepository;
import com.projectmanagementsystem.project.repository.ProjectRepository;
import com.projectmanagementsystem.task.dto.CreateTaskRequest;
import com.projectmanagementsystem.task.dto.TaskResponse;
import com.projectmanagementsystem.task.dto.UpdateTaskRequest;
import com.projectmanagementsystem.task.entity.Task;
import com.projectmanagementsystem.task.entity.TaskPriority;
import com.projectmanagementsystem.task.entity.TaskStatus;
import com.projectmanagementsystem.task.entity.TaskType;
import com.projectmanagementsystem.task.exception.TaskValidationException;
import com.projectmanagementsystem.task.repository.TaskRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Task use cases — backend is the final authority: all operations require
 * project membership (403 otherwise); edit/delete require project ownership
 * or task assignment (403 otherwise); unknown ids are 404.
 */
@Service
public class TaskService {

    private final TaskRepository tasks;
    private final ProjectRepository projects;
    private final ProjectMemberRepository members;
    private final UserRepository users;

    public TaskService(TaskRepository tasks,
                       ProjectRepository projects,
                       ProjectMemberRepository members,
                       UserRepository users) {
        this.tasks = tasks;
        this.projects = projects;
        this.members = members;
        this.users = users;
    }

    public record TaskPage(List<TaskResponse> data, long total) {}

    @Transactional
    public TaskResponse create(UUID callerId, UUID projectId, CreateTaskRequest req) {
        Project project = findProject(projectId);
        requireMember(callerId, projectId);
        Task task = new Task(project, req.title());
        task.setDescription(req.description());
        if (req.type() != null) {
            task.setType(parseEnum(TaskType.class, req.type(), "type"));
        }
        if (req.status() != null) {
            task.setStatus(parseEnum(TaskStatus.class, req.status(), "status"));
        }
        if (req.priority() != null) {
            task.setPriority(parseEnum(TaskPriority.class, req.priority(), "priority"));
        }
        if (req.assigneeId() != null) {
            task.setAssignee(resolveAssignee(projectId, req.assigneeId()));
        }
        task.setDueDate(req.dueDate());
        return TaskResponse.from(tasks.saveAndFlush(task));
    }

    @Transactional(readOnly = true)
    public TaskPage list(UUID callerId, UUID projectId, int page, int perPage) {
        findProject(projectId);
        requireMember(callerId, projectId);
        PageRequest pageable = PageRequest.of(page - 1, perPage,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Task> result = tasks.findByProjectId(projectId, pageable);
        List<TaskResponse> data = result.getContent().stream()
                .map(TaskResponse::from)
                .toList();
        return new TaskPage(data, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public TaskResponse get(UUID callerId, UUID projectId, UUID taskId) {
        findProject(projectId);
        requireMember(callerId, projectId);
        return TaskResponse.from(findTask(projectId, taskId));
    }

    @Transactional
    public TaskResponse patch(UUID callerId, UUID projectId, UUID taskId, UpdateTaskRequest req) {
        findProject(projectId);
        requireMember(callerId, projectId);
        Task task = findTask(projectId, taskId);
        requireOwnerOrAssignee(callerId, task);
        if (req.title() != null) {
            task.setTitle(req.title());
        }
        if (req.description() != null) {
            task.setDescription(req.description());
        }
        if (req.type() != null) {
            task.setType(parseEnum(TaskType.class, req.type(), "type"));
        }
        if (req.status() != null) {
            task.setStatus(parseEnum(TaskStatus.class, req.status(), "status"));
        }
        if (req.priority() != null) {
            task.setPriority(parseEnum(TaskPriority.class, req.priority(), "priority"));
        }
        if (req.assigneeId() != null) {
            task.setAssignee(resolveAssignee(projectId, req.assigneeId()));
        }
        if (req.dueDate() != null) {
            task.setDueDate(req.dueDate());
        }
        return TaskResponse.from(task);
    }

    @Transactional
    public void delete(UUID callerId, UUID projectId, UUID taskId) {
        findProject(projectId);
        requireMember(callerId, projectId);
        Task task = findTask(projectId, taskId);
        requireOwnerOrAssignee(callerId, task);
        // No comment table yet (Sprint 008) — nothing else to cascade.
        tasks.delete(task);
    }

    private Project findProject(UUID projectId) {
        return projects.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
    }

    private Task findTask(UUID projectId, UUID taskId) {
        return tasks.findByProjectIdAndId(projectId, taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));
    }

    private void requireMember(UUID userId, UUID projectId) {
        if (!members.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ProjectForbiddenException("Only project members may access this project");
        }
    }

    private void requireOwnerOrAssignee(UUID userId, Task task) {
        boolean owner = task.getProject().getOwner().getId().equals(userId);
        boolean assignee = task.getAssignee() != null && task.getAssignee().getId().equals(userId);
        if (!owner && !assignee) {
            throw new ProjectForbiddenException("Only the project owner or assignee may modify this task");
        }
    }

    private User resolveAssignee(UUID projectId, UUID assigneeId) {
        // Assignee must be a current member — unknown users fail the same check (422).
        User assignee = users.findById(assigneeId).orElse(null);
        if (assignee == null || !members.existsByProjectIdAndUserId(projectId, assigneeId)) {
            throw new TaskValidationException("assigneeId", "Assignee must be a project member");
        }
        return assignee;
    }

    private <E extends Enum<E>> E parseEnum(Class<E> type, String value, String field) {
        try {
            return Enum.valueOf(type, value);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new TaskValidationException(field, "Invalid " + field + ": " + value);
        }
    }
}
