package com.projectmanagementsystem.project.service;

import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.auth.repository.UserRepository;
import com.projectmanagementsystem.common.exception.ResourceNotFoundException;
import com.projectmanagementsystem.project.dto.CreateProjectRequest;
import com.projectmanagementsystem.project.dto.ProjectMemberResponse;
import com.projectmanagementsystem.project.dto.ProjectResponse;
import com.projectmanagementsystem.project.dto.UpdateProjectRequest;
import com.projectmanagementsystem.project.entity.Project;
import com.projectmanagementsystem.project.entity.ProjectMember;
import com.projectmanagementsystem.project.exception.ProjectForbiddenException;
import com.projectmanagementsystem.project.repository.ProjectMemberRepository;
import com.projectmanagementsystem.project.repository.ProjectRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Project use cases — creator becomes owner and member on create.
 * Backend is the final authority: list/get require membership (403 otherwise),
 * patch/delete require ownership (403 otherwise), unknown ids are 404.
 */
@Service
public class ProjectService {

    private final ProjectRepository projects;
    private final ProjectMemberRepository members;
    private final UserRepository users;

    public ProjectService(ProjectRepository projects,
                          ProjectMemberRepository members,
                          UserRepository users) {
        this.projects = projects;
        this.members = members;
        this.users = users;
    }

    public record ProjectPage(List<ProjectResponse> data, long total) {}

    @Transactional
    public ProjectResponse create(UUID userId, CreateProjectRequest req) {
        User owner = users.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Project project = projects.saveAndFlush(new Project(req.name(), req.description(), owner));
        members.save(new ProjectMember(project, owner));
        return ProjectResponse.from(project);
    }

    @Transactional(readOnly = true)
    public ProjectPage list(UUID userId, int page, int perPage) {
        PageRequest pageable = PageRequest.of(page - 1, perPage,
                Sort.by(Sort.Direction.DESC, "project.createdAt"));
        Page<ProjectMember> memberships = members.findByUserId(userId, pageable);
        List<ProjectResponse> data = memberships.getContent().stream()
                .map(m -> ProjectResponse.from(m.getProject()))
                .toList();
        return new ProjectPage(data, memberships.getTotalElements());
    }

    @Transactional(readOnly = true)
    public ProjectResponse get(UUID userId, UUID projectId) {
        Project project = findProject(projectId);
        requireMember(userId, projectId);
        return ProjectResponse.from(project);
    }

    @Transactional
    public ProjectResponse patch(UUID userId, UUID projectId, UpdateProjectRequest req) {
        Project project = findProject(projectId);
        requireOwner(userId, project);
        if (req.name() != null) {
            project.setName(req.name());
        }
        if (req.description() != null) {
            project.setDescription(req.description());
        }
        return ProjectResponse.from(project);
    }

    @Transactional
    public void delete(UUID userId, UUID projectId) {
        Project project = findProject(projectId);
        requireOwner(userId, project);
        // Explicit member cleanup — required on H2 (schema generated from entities,
        // no DB-level cascade); Postgres V3 also cascades, making this a no-op there.
        // Task/comment tables do not exist yet (later sprints), nothing else to cascade.
        members.deleteByProjectId(projectId);
        projects.delete(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> listMembers(UUID userId, UUID projectId) {
        Project project = findProject(projectId);
        requireMember(userId, projectId);
        UUID ownerId = project.getOwner().getId();
        return members.findByProjectId(projectId).stream()
                .map(m -> ProjectMemberResponse.from(
                        m.getUser(),
                        m.getUser().getId().equals(ownerId) ? "owner" : "member"))
                .sorted((a, b) -> {
                    // Owner first, then by email for determinism
                    if (!a.role().equals(b.role())) {
                        return "owner".equals(a.role()) ? -1 : 1;
                    }
                    return a.email().compareToIgnoreCase(b.email());
                })
                .toList();
    }

    private Project findProject(UUID projectId) {
        return projects.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
    }

    private void requireMember(UUID userId, UUID projectId) {
        if (!members.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ProjectForbiddenException("Only project members may access this project");
        }
    }

    private void requireOwner(UUID userId, Project project) {
        if (!project.getOwner().getId().equals(userId)) {
            throw new ProjectForbiddenException("Only the project owner may modify this project");
        }
    }
}
