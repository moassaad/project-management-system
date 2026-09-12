package com.projectmanagementsystem.comment;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.auth.repository.UserRepository;
import com.projectmanagementsystem.auth.service.JwtService;
import com.projectmanagementsystem.project.entity.Project;
import com.projectmanagementsystem.project.entity.ProjectMember;
import com.projectmanagementsystem.project.repository.ProjectMemberRepository;
import com.projectmanagementsystem.project.repository.ProjectRepository;
import com.projectmanagementsystem.task.entity.Task;
import com.projectmanagementsystem.task.repository.TaskRepository;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Comment endpoints with H2 — fast unit, no Docker.
 * Auth via real JwtAuthFilter + Bearer accessToken.
 */
@SpringBootTest
@AutoConfigureMockMvc
class CommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository users;

    @Autowired
    private ProjectRepository projects;

    @Autowired
    private ProjectMemberRepository members;

    @Autowired
    private TaskRepository tasks;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtService jwtService;

    private User owner;
    private User member;
    private User outsider;
    private UUID projectId;
    private UUID taskId;

    @BeforeEach
    void setUp() {
        owner = newUser();
        member = newUser();
        outsider = newUser();
        Project project = projects.saveAndFlush(new Project("Chat", null, owner));
        members.save(new ProjectMember(project, owner));
        members.save(new ProjectMember(project, member));
        projectId = project.getId();
        taskId = tasks.saveAndFlush(new Task(project, "Discuss me")).getId();
    }

    private User newUser() {
        return users.save(new User("commentapi-" + UUID.randomUUID() + "@example.com", encoder.encode("Secret123!")));
    }

    private String bearer(User u) {
        return "Bearer " + jwtService.generateAccessToken(u.getId());
    }

    private String base() {
        return "/api/v1/projects/" + projectId + "/tasks/" + taskId + "/comments";
    }

    @Test
    void create_returns201WithAuthorFromToken() throws Exception {
        mockMvc.perform(post(base())
                        .header("Authorization", bearer(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"First thought\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.content").value("First thought"))
                .andExpect(jsonPath("$.data.authorId").value(member.getId().toString()))
                .andExpect(jsonPath("$.data.createdAt").isNotEmpty());
    }

    @Test
    void create_blankOrMissingContent_returns422() throws Exception {
        mockMvc.perform(post(base())
                        .header("Authorization", bearer(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"  \"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/validation-error"))
                .andExpect(jsonPath("$.errors[0].pointer").value("#/content"));

        mockMvc.perform(post(base())
                        .header("Authorization", bearer(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void list_returnsOrderedComments() throws Exception {
        postComment(member, "One");
        postComment(owner, "Two");

        mockMvc.perform(get(base())
                        .header("Authorization", bearer(member)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].content").value("One"))
                .andExpect(jsonPath("$.data[0].authorId").value(member.getId().toString()))
                .andExpect(jsonPath("$.data[1].content").value("Two"));
    }

    @Test
    void nonMember_forbidden() throws Exception {
        mockMvc.perform(get(base())
                        .header("Authorization", bearer(outsider)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/forbidden"));

        mockMvc.perform(post(base())
                        .header("Authorization", bearer(outsider))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Nope\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymous_unauthorized() throws Exception {
        mockMvc.perform(get(base()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post(base())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Nope\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unknownProjectOrTask_notFound() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + UUID.randomUUID() + "/tasks/" + taskId + "/comments")
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/resource-not-found"));

        mockMvc.perform(post("/api/v1/projects/" + projectId + "/tasks/" + UUID.randomUUID() + "/comments")
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Nope\"}"))
                .andExpect(status().isNotFound());
    }

    private void postComment(User author, String content) throws Exception {
        mockMvc.perform(post(base())
                        .header("Authorization", bearer(author))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"" + content + "\"}"))
                .andExpect(status().isCreated());
    }
}
