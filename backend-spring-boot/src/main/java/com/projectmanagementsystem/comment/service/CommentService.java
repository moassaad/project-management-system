package com.projectmanagementsystem.comment.service;

import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.auth.repository.UserRepository;
import com.projectmanagementsystem.comment.dto.CommentResponse;
import com.projectmanagementsystem.comment.dto.CreateCommentRequest;
import com.projectmanagementsystem.comment.entity.Comment;
import com.projectmanagementsystem.comment.repository.CommentRepository;
import com.projectmanagementsystem.common.exception.ResourceNotFoundException;
import com.projectmanagementsystem.project.exception.ProjectForbiddenException;
import com.projectmanagementsystem.project.repository.ProjectMemberRepository;
import com.projectmanagementsystem.project.repository.ProjectRepository;
import com.projectmanagementsystem.task.entity.Task;
import com.projectmanagementsystem.task.repository.TaskRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Comment use cases — backend is the final authority: list/create require
 * project membership (403 otherwise); author always comes from the Bearer
 * identity, never from client data. No edit/delete in MVP.
 */
@Service
public class CommentService {

    private final CommentRepository comments;
    private final TaskRepository tasks;
    private final ProjectRepository projects;
    private final ProjectMemberRepository members;
    private final UserRepository users;

    public CommentService(CommentRepository comments,
                          TaskRepository tasks,
                          ProjectRepository projects,
                          ProjectMemberRepository members,
                          UserRepository users) {
        this.comments = comments;
        this.tasks = tasks;
        this.projects = projects;
        this.members = members;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> list(UUID callerId, UUID projectId, UUID taskId) {
        Task task = findTask(projectId, taskId);
        requireMember(callerId, projectId);
        return comments.findByTaskIdOrderByCreatedAtAsc(task.getId()).stream()
                .map(CommentResponse::from)
                .toList();
    }

    @Transactional
    public CommentResponse create(UUID callerId, UUID projectId, UUID taskId, CreateCommentRequest req) {
        Task task = findTask(projectId, taskId);
        requireMember(callerId, projectId);
        User author = users.findById(callerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", callerId));
        return CommentResponse.from(comments.saveAndFlush(new Comment(task, author, req.content())));
    }

    private Task findTask(UUID projectId, UUID taskId) {
        if (!projects.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", projectId);
        }
        return tasks.findByProjectIdAndId(projectId, taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));
    }

    private void requireMember(UUID userId, UUID projectId) {
        if (!members.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ProjectForbiddenException("Only project members may access this project");
        }
    }
}
