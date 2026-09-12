package com.projectmanagementsystem.task;

import static org.assertj.core.api.Assertions.assertThat;

import com.projectmanagementsystem.AbstractIntegrationTest;
import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.auth.repository.UserRepository;
import com.projectmanagementsystem.project.entity.Project;
import com.projectmanagementsystem.project.entity.ProjectMember;
import com.projectmanagementsystem.project.repository.ProjectMemberRepository;
import com.projectmanagementsystem.project.repository.ProjectRepository;
import com.projectmanagementsystem.project.service.ProjectService;
import com.projectmanagementsystem.task.entity.Task;
import com.projectmanagementsystem.task.repository.TaskRepository;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Member-removal unassign hook on real PostgreSQL via Testcontainers.
 * Proves Flyway V4 + unassign wiring outside H2. Skips if Docker unavailable.
 */
@SpringBootTest
class TaskUnassignIT extends AbstractIntegrationTest {

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

    @Test
    void removeMember_unassignsTasksOnPostgres() {
        User owner = users.save(new User("it-owner-" + UUID.randomUUID() + "@example.com",
                encoder.encode("Secret123!")));
        User member = users.save(new User("it-member-" + UUID.randomUUID() + "@example.com",
                encoder.encode("Secret123!")));
        Project project = projects.save(new Project("IT board", null, owner));
        members.save(new ProjectMember(project, owner));
        members.save(new ProjectMember(project, member));

        Task task = new Task(project, "IT task");
        task.setAssignee(member);
        task = tasks.save(task);

        projectService.removeMember(owner.getId(), project.getId(), member.getId());

        Task after = tasks.findById(task.getId()).orElseThrow();
        assertThat(after.getAssignee()).isNull();
        assertThat(tasks.findByProjectIdAndAssigneeId(project.getId(), member.getId())).isEmpty();
    }
}
