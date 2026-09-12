package com.projectmanagementsystem.comment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.auth.repository.UserRepository;
import com.projectmanagementsystem.comment.entity.Comment;
import com.projectmanagementsystem.comment.repository.CommentRepository;
import com.projectmanagementsystem.project.entity.Project;
import com.projectmanagementsystem.project.entity.ProjectMember;
import com.projectmanagementsystem.project.repository.ProjectMemberRepository;
import com.projectmanagementsystem.project.repository.ProjectRepository;
import com.projectmanagementsystem.task.entity.Task;
import com.projectmanagementsystem.task.repository.TaskRepository;
import jakarta.validation.ConstraintViolationException;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Comment persistence with H2 — fast unit, no Docker.
 * No endpoints yet (BE-S008-01).
 */
@SpringBootTest
class CommentPersistenceTest {

    @Autowired
    private CommentRepository comments;

    @Autowired
    private TaskRepository tasks;

    @Autowired
    private ProjectRepository projects;

    @Autowired
    private ProjectMemberRepository members;

    @Autowired
    private UserRepository users;

    @Autowired
    private PasswordEncoder encoder;

    private User saveUser() {
        return users.save(new User("comment-" + UUID.randomUUID() + "@example.com", encoder.encode("Pass123!")));
    }

    private Task saveTask(User owner) {
        Project project = projects.saveAndFlush(new Project("Discuss", null, owner));
        members.save(new ProjectMember(project, owner));
        return tasks.saveAndFlush(new Task(project, "Question"));
    }

    @Test
    void persistsCommentWithTaskAndAuthor() {
        User owner = saveUser();
        Task task = saveTask(owner);

        Comment saved = comments.saveAndFlush(new Comment(task, owner, "Looks good to me"));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getTask().getId()).isEqualTo(task.getId());
        assertThat(saved.getAuthor().getId()).isEqualTo(owner.getId());
        assertThat(saved.getContent()).isEqualTo("Looks good to me");
    }

    @Test
    void listsCommentsByTaskOrderedByCreatedAt() {
        User owner = saveUser();
        Task task = saveTask(owner);
        comments.save(new Comment(task, owner, "First"));
        comments.save(new Comment(task, owner, "Second"));

        var found = comments.findByTaskIdOrderByCreatedAtAsc(task.getId());

        assertThat(found).hasSize(2);
        assertThat(found.get(0).getContent()).isEqualTo("First");
        assertThat(found.get(1).getContent()).isEqualTo("Second");
    }

    @Test
    void rejectsBlankContent() {
        User owner = saveUser();
        Task task = saveTask(owner);
        assertThatThrownBy(() -> comments.saveAndFlush(new Comment(task, owner, "  ")))
                .isInstanceOf(ConstraintViolationException.class);
    }
}
