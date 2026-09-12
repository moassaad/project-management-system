package com.projectmanagementsystem.project;

import static org.assertj.core.api.Assertions.assertThat;
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
import com.projectmanagementsystem.project.dto.CreateProjectRequest;
import com.projectmanagementsystem.project.dto.ProjectResponse;
import com.projectmanagementsystem.project.repository.ProjectMemberRepository;
import com.projectmanagementsystem.project.service.ProjectService;
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
 * Project CRUD endpoints with H2 — fast unit, no Docker.
 * Auth via real JwtAuthFilter + Bearer accessToken.
 * Member/owner authorization (403) is BE-S005-03; here CRUD mechanics + 401/404/422/405.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository users;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ProjectMemberRepository members;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtService jwtService;

    private User user;
    private String token;

    @BeforeEach
    void setUp() {
        user = users.save(new User("crud-" + UUID.randomUUID() + "@example.com", encoder.encode("Secret123!")));
        token = jwtService.generateAccessToken(user.getId());
    }

    private User newUser() {
        return users.save(new User("crud-" + UUID.randomUUID() + "@example.com", encoder.encode("Secret123!")));
    }

    private String bearer(User u) {
        return "Bearer " + jwtService.generateAccessToken(u.getId());
    }

    private ProjectResponse createViaService(User owner, String name) {
        return projectService.create(owner.getId(), new CreateProjectRequest(name, null));
    }

    @Test
    void create_returns201AndOwnerMember() throws Exception {
        mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Website\",\"description\":\"Marketing site\"}"))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.name").value("Website"))
                .andExpect(jsonPath("$.data.description").value("Marketing site"))
                .andExpect(jsonPath("$.data.ownerId").value(user.getId().toString()))
                .andExpect(jsonPath("$.data.createdAt").isNotEmpty());

        // Owner membership row written on create
        String projectId = projectService.list(user.getId(), 1, 20).data().get(0).id();
        assertThat(members.existsByProjectIdAndUserId(UUID.fromString(projectId), user.getId())).isTrue();
    }

    @Test
    void create_blankName_returns422() throws Exception {
        mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"  \"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/validation-error"))
                .andExpect(jsonPath("$.status").value(422))
                .andExpect(jsonPath("$.errors[0].pointer").value("#/name"));
    }

    @Test
    void create_missingName_returns422() throws Exception {
        mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"No name\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/validation-error"));
    }

    @Test
    void list_returnsPaginatedScopedToMembership() throws Exception {
        createViaService(user, "Alpha");
        createViaService(user, "Beta");
        User other = newUser();
        createViaService(other, "Other");

        // Own projects only
        mockMvc.perform(get("/api/v1/projects?page=1&perPage=20")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.meta.currentPage").value(1))
                .andExpect(jsonPath("$.meta.perPage").value(20))
                .andExpect(jsonPath("$.meta.total").value(2))
                .andExpect(jsonPath("$.meta.lastPage").value(1));

        // Second page with perPage=1
        mockMvc.perform(get("/api/v1/projects?page=1&perPage=1")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.meta.total").value(2))
                .andExpect(jsonPath("$.meta.lastPage").value(2));

        // Other user sees only theirs
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", bearer(other)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.meta.total").value(1));
    }

    @Test
    void get_returns200Or404() throws Exception {
        ProjectResponse created = createViaService(user, "Details");

        mockMvc.perform(get("/api/v1/projects/" + created.id())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(created.id()))
                .andExpect(jsonPath("$.data.name").value("Details"));

        mockMvc.perform(get("/api/v1/projects/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/resource-not-found"));
    }

    @Test
    void get_malformedUuid_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/projects/not-a-uuid")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/resource-not-found"));
    }

    @Test
    void patch_updatesProvidedFields() throws Exception {
        ProjectResponse created = createViaService(user, "Before");

        mockMvc.perform(patch("/api/v1/projects/" + created.id())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"After\",\"description\":\"New desc\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(created.id()))
                .andExpect(jsonPath("$.data.name").value("After"))
                .andExpect(jsonPath("$.data.description").value("New desc"));

        // Partial: null fields unchanged
        mockMvc.perform(patch("/api/v1/projects/" + created.id())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"Only desc\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("After"))
                .andExpect(jsonPath("$.data.description").value("Only desc"));
    }

    @Test
    void patch_blankName_returns422() throws Exception {
        ProjectResponse created = createViaService(user, "Keep");

        mockMvc.perform(patch("/api/v1/projects/" + created.id())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/validation-error"));
    }

    @Test
    void patch_unknown_returns404() throws Exception {
        mockMvc.perform(patch("/api/v1/projects/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"X\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_returns204AndCascadesMemberships() throws Exception {
        ProjectResponse created = createViaService(user, "Gone");
        UUID id = UUID.fromString(created.id());

        mockMvc.perform(delete("/api/v1/projects/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/projects/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
        assertThat(members.existsByProjectIdAndUserId(id, user.getId())).isFalse();
    }

    @Test
    void delete_unknown_returns404() throws Exception {
        mockMvc.perform(delete("/api/v1/projects/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));

        mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"X\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void put_notSupported_returns405() throws Exception {
        ProjectResponse created = createViaService(user, "NoPut");

        mockMvc.perform(put("/api/v1/projects/" + created.id())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"X\",\"description\":\"Y\"}"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }
}
