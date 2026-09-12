package com.projectmanagementsystem.project;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.auth.repository.UserRepository;
import com.projectmanagementsystem.project.entity.Project;
import com.projectmanagementsystem.project.entity.ProjectMember;
import com.projectmanagementsystem.project.repository.ProjectMemberRepository;
import com.projectmanagementsystem.project.repository.ProjectRepository;
import jakarta.validation.ConstraintViolationException;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Project + membership persistence with H2 — fast unit, no Docker.
 * No endpoints yet (BE-S005-01).
 */
@SpringBootTest
class ProjectPersistenceTest {

    @Autowired
    private ProjectRepository projects;

    @Autowired
    private ProjectMemberRepository members;

    @Autowired
    private UserRepository users;

    @Autowired
    private PasswordEncoder encoder;

    private User saveUser() {
        return users.save(new User("proj-" + UUID.randomUUID() + "@example.com", encoder.encode("Pass123!")));
    }

    @Test
    void persistsProjectWithOwner() {
        User owner = saveUser();
        Project saved = projects.save(new Project("Website", "Marketing site", owner));
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getOwner().getId()).isEqualTo(owner.getId());
        assertThat(projects.findById(saved.getId())).isPresent();
    }

    @Test
    void persistsProjectWithNullDescription() {
        User owner = saveUser();
        Project saved = projects.save(new Project("API", null, owner));
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getDescription()).isNull();
    }

    @Test
    void rejectsBlankName() {
        User owner = saveUser();
        assertThatThrownBy(() -> projects.saveAndFlush(new Project("  ", null, owner)))
                .isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    void persistsOwnerMembershipAndQueries() {
        User owner = saveUser();
        User outsider = saveUser();
        Project project = projects.save(new Project("App", null, owner));
        members.save(new ProjectMember(project, owner));

        assertThat(members.existsByProjectIdAndUserId(project.getId(), owner.getId())).isTrue();
        assertThat(members.existsByProjectIdAndUserId(project.getId(), outsider.getId())).isFalse();
        assertThat(members.findByUserId(owner.getId())).hasSize(1);
        assertThat(members.findByUserId(outsider.getId())).isEmpty();
    }
}
