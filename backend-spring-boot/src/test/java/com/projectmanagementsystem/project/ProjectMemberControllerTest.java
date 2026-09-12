package com.projectmanagementsystem.project;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
 * List project members with H2 — fast unit, no Docker.
 * Auth via real JwtAuthFilter + Bearer accessToken.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ProjectMemberControllerTest {

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
        Project project = projects.saveAndFlush(new Project("Team", null, owner));
        members.save(new ProjectMember(project, owner));
        members.save(new ProjectMember(project, member));
        projectId = project.getId();
    }

    private User newUser() {
        return users.save(new User("member-" + UUID.randomUUID() + "@example.com", encoder.encode("Secret123!")));
    }

    private String bearer(User u) {
        return "Bearer " + jwtService.generateAccessToken(u.getId());
    }

    @Test
    void owner_seesMembersWithRoles() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.data.length()").value(2))
                // Owner first
                .andExpect(jsonPath("$.data[0].id").value(owner.getId().toString()))
                .andExpect(jsonPath("$.data[0].email").value(owner.getEmail()))
                .andExpect(jsonPath("$.data[0].role").value("owner"))
                .andExpect(jsonPath("$.data[1].id").value(member.getId().toString()))
                .andExpect(jsonPath("$.data[1].role").value("member"));
    }

    @Test
    void member_mayList() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", bearer(member)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    void nonMember_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", bearer(outsider)))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/forbidden"))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void anonymous_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + projectId + "/members"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }

    @Test
    void unknownProject_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + UUID.randomUUID() + "/members")
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/resource-not-found"));
    }

    @Test
    void add_byIdAndEmail_returns201AndGrantsAccess() throws Exception {
        User candidate = newUser();

        // By id
        mockMvc.perform(post("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":\"" + candidate.getId() + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.userId").value(candidate.getId().toString()))
                .andExpect(jsonPath("$.data.role").value("member"));

        // Added user gains member access immediately
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header("Authorization", bearer(candidate)))
                .andExpect(status().isOk());

        // By email
        User candidate2 = newUser();
        mockMvc.perform(post("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + candidate2.getEmail() + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.userId").value(candidate2.getId().toString()));
    }

    @Test
    void add_duplicate_returns409() throws Exception {
        mockMvc.perform(post("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":\"" + member.getId() + "\"}"))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/conflict"))
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void add_unknownUserOrProject_returns404() throws Exception {
        mockMvc.perform(post("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":\"" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/resource-not-found"));

        mockMvc.perform(post("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ghost@example.com\"}"))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/projects/" + UUID.randomUUID() + "/members")
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + outsider.getEmail() + "\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void add_nonOwner_returns403() throws Exception {
        // Member (non-owner) and outsider are both rejected before user resolution
        mockMvc.perform(post("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", bearer(member))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + outsider.getEmail() + "\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/forbidden"));

        mockMvc.perform(post("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", bearer(outsider))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + outsider.getEmail() + "\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void add_anonymous_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/projects/" + projectId + "/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + outsider.getEmail() + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void add_missingTarget_returns422() throws Exception {
        mockMvc.perform(post("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/validation-error"));

        mockMvc.perform(post("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void remove_revokesAccessImmediately() throws Exception {
        mockMvc.perform(delete("/api/v1/projects/" + projectId + "/members/" + member.getId())
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isNoContent());

        // Removed member loses access immediately
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header("Authorization", bearer(member)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", bearer(member)))
                .andExpect(status().isForbidden());

        // Removing again → 404 membership
        mockMvc.perform(delete("/api/v1/projects/" + projectId + "/members/" + member.getId())
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/resource-not-found"));
    }

    @Test
    void remove_owner_returns400() throws Exception {
        mockMvc.perform(delete("/api/v1/projects/" + projectId + "/members/" + owner.getId())
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/bad-request"))
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void remove_nonOwner_returns403() throws Exception {
        mockMvc.perform(delete("/api/v1/projects/" + projectId + "/members/" + member.getId())
                        .header("Authorization", bearer(member)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/forbidden"));

        mockMvc.perform(delete("/api/v1/projects/" + projectId + "/members/" + member.getId())
                        .header("Authorization", bearer(outsider)))
                .andExpect(status().isForbidden());
    }

    @Test
    void remove_unknown_returns404() throws Exception {
        mockMvc.perform(delete("/api/v1/projects/" + UUID.randomUUID() + "/members/" + member.getId())
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/v1/projects/" + projectId + "/members/" + UUID.randomUUID())
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isNotFound());

        // Existing user who was never a member → 404 membership
        mockMvc.perform(delete("/api/v1/projects/" + projectId + "/members/" + outsider.getId())
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isNotFound());
    }

    @Test
    void remove_anonymous_returns401() throws Exception {
        mockMvc.perform(delete("/api/v1/projects/" + projectId + "/members/" + member.getId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void add_malformedUuid_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/projects/" + projectId + "/members")
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":\"not-a-uuid\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/malformed-request"));
    }
}
