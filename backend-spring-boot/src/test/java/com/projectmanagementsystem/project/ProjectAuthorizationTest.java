package com.projectmanagementsystem.project;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
 * Project authorization with H2 — backend is the final authority.
 * Owner: full access. Member (non-owner): read-only. Non-member: 403.
 * Anonymous: 401 via SecurityConfig. No member add/remove endpoints (Sprint 006).
 */
@SpringBootTest
@AutoConfigureMockMvc
class ProjectAuthorizationTest {

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
        Project project = projects.saveAndFlush(
                new Project("Secure", null, owner));
        members.save(new ProjectMember(project, owner));
        members.save(new ProjectMember(project, member));
        projectId = project.getId();
    }

    private User newUser() {
        return users.save(new User("authz-" + UUID.randomUUID() + "@example.com", encoder.encode("Secret123!")));
    }

    private String bearer(User u) {
        return "Bearer " + jwtService.generateAccessToken(u.getId());
    }

    @Test
    void owner_hasFullAccess() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/v1/projects/" + projectId)
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Owner edit\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Owner edit"));

        // Owner delete tested in CRUD suite; here verify member still blocked after rename
        mockMvc.perform(patch("/api/v1/projects/" + projectId)
                        .header("Authorization", bearer(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Member edit\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void member_mayReadButNotWrite() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header("Authorization", bearer(member)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(projectId.toString()));

        // Member sees shared project in list
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", bearer(member)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.total").value(1));

        mockMvc.perform(patch("/api/v1/projects/" + projectId)
                        .header("Authorization", bearer(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Nope\"}"))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/forbidden"))
                .andExpect(jsonPath("$.title").value("Forbidden"))
                .andExpect(jsonPath("$.status").value(403));

        mockMvc.perform(delete("/api/v1/projects/" + projectId)
                        .header("Authorization", bearer(member)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/forbidden"));
    }

    @Test
    void nonMember_cannotAccess() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header("Authorization", bearer(outsider)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/forbidden"));

        mockMvc.perform(patch("/api/v1/projects/" + projectId)
                        .header("Authorization", bearer(outsider))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Nope\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/projects/" + projectId)
                        .header("Authorization", bearer(outsider)))
                .andExpect(status().isForbidden());

        // List stays filtered — outsider sees nothing
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", bearer(outsider)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.total").value(0));
    }

    @Test
    void anonymous_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + projectId))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(patch("/api/v1/projects/" + projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Nope\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/v1/projects/" + projectId))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unknownId_returns404EvenForOwner() throws Exception {
        // 404 takes precedence over 403 — unknown ids never leak authorization state
        mockMvc.perform(get("/api/v1/projects/" + UUID.randomUUID())
                        .header("Authorization", bearer(outsider)))
                .andExpect(status().isNotFound());
    }

    @Test
    void user_mayBelongToMultipleProjects() throws Exception {
        // Second project owned by member (who is also its member)
        Project second = projects.saveAndFlush(new Project("Second", null, member));
        members.save(new ProjectMember(second, member));

        // Member now sees 2 projects (shared + owned)
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", bearer(member)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.total").value(2));

        // Owner still sees only theirs
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.total").value(1));
    }
}
