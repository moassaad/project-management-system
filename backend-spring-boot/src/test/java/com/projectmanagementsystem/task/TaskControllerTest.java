package com.projectmanagementsystem.task;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
 * Task CRUD endpoints with H2 — fast unit, no Docker.
 * Auth via real JwtAuthFilter + Bearer accessToken.
 * Owner/assignee write refinement is BE-S007-03; here CRUD mechanics + 401/403/404/422.
 */
@SpringBootTest
@AutoConfigureMockMvc
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository users;

    @Autowired
    private ProjectRepository projects;

    @Autowired
    private ProjectMemberRepository members;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtService jwtService;

    private User owner;
    private User member;
    private User outsider;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        owner = newUser();
        member = newUser();
        outsider = newUser();
        Project project = projects.saveAndFlush(new Project("Tasks", null, owner));
        members.save(new ProjectMember(project, owner));
        members.save(new ProjectMember(project, member));
        projectId = project.getId();
    }

    private User newUser() {
        return users.save(new User("taskcrud-" + UUID.randomUUID() + "@example.com", encoder.encode("Secret123!")));
    }

    private String bearer(User u) {
        return "Bearer " + jwtService.generateAccessToken(u.getId());
    }

    private String base() {
        return "/api/v1/projects/" + projectId + "/tasks";
    }

    @Test
    void create_returns201WithDefaults() throws Exception {
        mockMvc.perform(post(base())
                        .header("Authorization", bearer(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Write docs\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.projectId").value(projectId.toString()))
                .andExpect(jsonPath("$.data.title").value("Write docs"))
                .andExpect(jsonPath("$.data.status").value("TODO"))
                .andExpect(jsonPath("$.data.priority").value("MEDIUM"))
                .andExpect(jsonPath("$.data.createdAt").isNotEmpty());
    }

    @Test
    void create_withAllFields_returns201() throws Exception {
        String body = """
                {"title":"Fix bug","description":"NPE on login","type":"BUG","status":"IN_PROGRESS",
                 "priority":"HIGH","assigneeId":"%s","dueDate":"2026-09-20"}
                """.formatted(member.getId());
        mockMvc.perform(post(base())
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.type").value("BUG"))
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.data.priority").value("HIGH"))
                .andExpect(jsonPath("$.data.assigneeId").value(member.getId().toString()))
                .andExpect(jsonPath("$.data.dueDate").value("2026-09-20"));
    }

    @Test
    void create_blankTitle_returns422() throws Exception {
        mockMvc.perform(post(base())
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/validation-error"))
                .andExpect(jsonPath("$.errors[0].pointer").value("#/title"));
    }

    @Test
    void create_invalidEnum_returns422() throws Exception {
        mockMvc.perform(post(base())
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"X\",\"status\":\"WRONG\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/validation-error"))
                .andExpect(jsonPath("$.errors[0].pointer").value("#/status"));
    }

    @Test
    void create_nonMemberAssignee_returns422() throws Exception {
        String body = "{\"title\":\"X\",\"assigneeId\":\"" + outsider.getId() + "\"}";
        mockMvc.perform(post(base())
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors[0].pointer").value("#/assigneeId"));
    }

    @Test
    void create_unknownAssignee_returns422() throws Exception {
        String body = "{\"title\":\"X\",\"assigneeId\":\"" + UUID.randomUUID() + "\"}";
        mockMvc.perform(post(base())
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors[0].pointer").value("#/assigneeId"));
    }

    @Test
    void create_unknownProject_returns404() throws Exception {
        mockMvc.perform(post("/api/v1/projects/" + UUID.randomUUID() + "/tasks")
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"X\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_nonMember_returns403() throws Exception {
        mockMvc.perform(post(base())
                        .header("Authorization", bearer(outsider))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"X\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void create_anonymous_returns401() throws Exception {
        mockMvc.perform(post(base())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"X\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void list_returnsPaginated() throws Exception {
        createTask("One");
        createTask("Two");
        createTask("Three");

        mockMvc.perform(get(base() + "?page=1&perPage=2")
                        .header("Authorization", bearer(member)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.meta.total").value(3))
                .andExpect(jsonPath("$.meta.lastPage").value(2));
    }

    @Test
    void list_nonMember_returns403() throws Exception {
        mockMvc.perform(get(base())
                        .header("Authorization", bearer(outsider)))
                .andExpect(status().isForbidden());
    }

    @Test
    void get_returns200Or404() throws Exception {
        String id = createTask("Details");

        mockMvc.perform(get(base() + "/" + id)
                        .header("Authorization", bearer(member)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(id))
                .andExpect(jsonPath("$.data.title").value("Details"));

        mockMvc.perform(get(base() + "/" + UUID.randomUUID())
                        .header("Authorization", bearer(member)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/resource-not-found"));
    }

    @Test
    void patch_updatesProvidedFields() throws Exception {
        String id = createTask("Before");

        String body = "{\"title\":\"After\",\"status\":\"DONE\",\"priority\":\"LOW\"}";
        mockMvc.perform(patch(base() + "/" + id)
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("After"))
                .andExpect(jsonPath("$.data.status").value("DONE"))
                .andExpect(jsonPath("$.data.priority").value("LOW"));
    }

    @Test
    void patch_invalidEnum_returns422() throws Exception {
        String id = createTask("Keep");

        mockMvc.perform(patch(base() + "/" + id)
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"NOPE\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errors[0].pointer").value("#/type"));
    }

    @Test
    void patch_unknown_returns404() throws Exception {
        mockMvc.perform(patch(base() + "/" + UUID.randomUUID())
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"X\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_returns204() throws Exception {
        String id = createTask("Gone");

        mockMvc.perform(delete(base() + "/" + id)
                        .header("Authorization", bearer(member)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get(base() + "/" + id)
                        .header("Authorization", bearer(member)))
                .andExpect(status().isNotFound());
    }

    @Test
    void put_notSupported_returns405() throws Exception {
        String id = createTask("NoPut");

        mockMvc.perform(put(base() + "/" + id)
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"X\"}"))
                .andExpect(status().isMethodNotAllowed());
    }

    private String createTask(String title) throws Exception {
        String body = mockMvc.perform(post(base())
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        // Minimal id extraction without extra deps
        int start = body.indexOf("\"id\":\"") + 6;
        return body.substring(start, body.indexOf("\"", start));
    }
}
