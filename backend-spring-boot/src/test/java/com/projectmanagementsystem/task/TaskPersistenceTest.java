package com.projectmanagementsystem.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.auth.repository.UserRepository;
import com.projectmanagementsystem.project.entity.Project;
import com.projectmanagementsystem.project.entity.ProjectMember;
import com.projectmanagementsystem.project.repository.ProjectMemberRepository;
import com.projectmanagementsystem.project.repository.ProjectRepository;
import com.projectmanagementsystem.project.service.ProjectService;
import com.projectmanagementsystem.task.entity.Task;
import com.projectmanagementsystem.task.entity.TaskPriority;
import com.projectmanagementsystem.task.entity.TaskStatus;
import com.projectmanagementsystem.task.entity.TaskType;
import com.projectmanagementsystem.task.repository.TaskRepository;
import jakarta.validation.ConstraintViolationException;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Task persistence with H2 — fast unit, no Docker.
 * Covers defaults, validation, repository finders, and the
 * member-removal unassign hook. No endpoints yet (BE-S007-01).
 */
@SpringBootTest
class TaskPersistenceTest {

    @Autowired
    private TaskRepository tasks;

    @Autowired
    private ProjectRepository projects;

    @Autowired
    private ProjectMemberRepository members;

    @Autowired
    private UserRepository users;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private PasswordEncoder encoder;

    private User saveUser() {
        return users.save(new User("task-" + UUID.randomUUID() + "@example.com", encoder.encode("Pass123!")));
    }

    private Project saveProject(User owner) {
        Project project = projects.saveAndFlush(new Project("Board", null, owner));
        members.save(new ProjectMember(project, owner));
        return project;
    }

    @Test
    void persistsTaskWithAllFields() {
        User owner = saveUser();
        User assignee = saveUser();
        Project project = saveProject(owner);
        members.save(new ProjectMember(project, assignee));

        Task task = new Task(project, "Implement login");
        task.setDescription("Create the login interface");
        task.setType(TaskType.FEATURE);
        task.setStatus(TaskStatus.IN_PROGRESS);
        task.setPriority(TaskPriority.HIGH);
        task.setAssignee(assignee);
        task.setDueDate(LocalDate.of(2026, 9, 20));
        Task saved = tasks.saveAndFlush(task);

        assertThat(saved.getId()).isNotNull();
        Task found = tasks.findByProjectIdAndId(project.getId(), saved.getId()).orElseThrow();
        assertThat(found.getTitle()).isEqualTo("Implement login");
        assertThat(found.getType()).isEqualTo(TaskType.FEATURE);
        assertThat(found.getAssignee().getId()).isEqualTo(assignee.getId());
    }

    @Test
    void appliesDefaultsForStatusPriorityAndNullableFields() {
        User owner = saveUser();
        Project project = saveProject(owner);

        Task saved = tasks.saveAndFlush(new Task(project, "Plain task"));

        assertThat(saved.getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(saved.getPriority()).isEqualTo(TaskPriority.MEDIUM);
        assertThat(saved.getType()).isNull();
        assertThat(saved.getAssignee()).isNull();
        assertThat(saved.getDueDate()).isNull();
        assertThat(saved.getDescription()).isNull();
    }

    @Test
    void rejectsBlankTitle() {
        User owner = saveUser();
        Project project = saveProject(owner);
        assertThatThrownBy(() -> tasks.saveAndFlush(new Task(project, "  ")))
                .isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    void findsTasksByProjectPaged() {
        User owner = saveUser();
        Project project = saveProject(owner);
        tasks.save(new Task(project, "One"));
        tasks.save(new Task(project, "Two"));
        tasks.save(new Task(project, "Three"));

        var page = tasks.findByProjectId(project.getId(), PageRequest.of(0, 2));

        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getTotalElements()).isEqualTo(3);
    }

    @Test
    void removeMember_unassignsTasksWithoutDeleting() {
        User owner = saveUser();
        User member = saveUser();
        Project project = saveProject(owner);
        members.save(new ProjectMember(project, member));

        Task task = new Task(project, "Assigned work");
        task.setAssignee(member);
        task = tasks.saveAndFlush(task);
        UUID taskId = task.getId();

        projectService.removeMember(owner.getId(), project.getId(), member.getId());

        // Task kept, assignee cleared
        Task after = tasks.findById(taskId).orElseThrow();
        assertThat(after.getAssignee()).isNull();
        assertThat(after.getTitle()).isEqualTo("Assigned work");
        // Membership gone
        assertThat(members.existsByProjectIdAndUserId(project.getId(), member.getId())).isFalse();
    }
}
