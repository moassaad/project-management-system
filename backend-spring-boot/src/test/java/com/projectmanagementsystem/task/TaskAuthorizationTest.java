package com.projectmanagementsystem.task;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
 * Task authorization with H2 — backend is the final authority.
 * Owner: edit/delete any. Assignee: edit/delete own. Other members: read-only.
 * Non-members: 403. Anonymous: 401.
 */
@SpringBootTest
@AutoConfigureMockMvc
class TaskAuthorizationTest {

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
    private User assignee;
    private User other;
    private User outsider;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        owner = newUser();
        assignee = newUser();
        other = newUser();
        outsider = newUser();
        Project project = projects.saveAndFlush(new Project("Authz", null, owner));
        members.save(new ProjectMember(project, owner));
        members.save(new ProjectMember(project, assignee));
        members.save(new ProjectMember(project, other));
        projectId = project.getId();
    }

    private User newUser() {
        return users.save(new User("taskauthz-" + UUID.randomUUID() + "@example.com", encoder.encode("Secret123!")));
    }

    private String bearer(User u) {
        return "Bearer " + jwtService.generateAccessToken(u.getId());
    }

    private String base() {
        return "/api/v1/projects/" + projectId + "/tasks";
    }

    private String createTask(String title, User as, String assigneeId) throws Exception {
        String body = as == null
                ? "{\"title\":\"" + title + "\"}"
                : "{\"title\":\"" + title + "\",\"assigneeId\":\"" + assigneeId + "\"}";
        String json = mockMvc.perform(post(base())
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int start = json.indexOf("\"id\":\"") + 6;
        return json.substring(start, json.indexOf("\"", start));
    }

    @Test
    void owner_mayEditDeleteAnyTask() throws Exception {
        String id = createTask("Owned work", assignee, assignee.getId().toString());

        mockMvc.perform(patch(base() + "/" + id)
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Owner edited\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Owner edited"));

        mockMvc.perform(delete(base() + "/" + id)
                        .header("Authorization", bearer(owner)))
                .andExpect(status().isNoContent());
    }

    @Test
    void assignee_mayEditDeleteOwnTask() throws Exception {
        String id = createTask("My work", assignee, assignee.getId().toString());

        mockMvc.perform(patch(base() + "/" + id)
                        .header("Authorization", bearer(assignee))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DONE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DONE"));

        mockMvc.perform(delete(base() + "/" + id)
                        .header("Authorization", bearer(assignee)))
                .andExpect(status().isNoContent());
    }

    @Test
    void otherMember_isReadOnly() throws Exception {
        String id = createTask("Their work", assignee, assignee.getId().toString());

        // Read allowed
        mockMvc.perform(get(base() + "/" + id)
                        .header("Authorization", bearer(other)))
                .andExpect(status().isOk());

        // Write denied with 403 ProblemDetails
        mockMvc.perform(patch(base() + "/" + id)
                        .header("Authorization", bearer(other))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Hijack\"}"))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/forbidden"))
                .andExpect(jsonPath("$.status").value(403));

        mockMvc.perform(delete(base() + "/" + id)
                        .header("Authorization", bearer(other)))
                .andExpect(status().isForbidden());
    }

    @Test
    void unassignedTask_onlyOwnerMayWrite() throws Exception {
        String id = createTask("Unassigned", null, null);

        mockMvc.perform(patch(base() + "/" + id)
                        .header("Authorization", bearer(assignee))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Nope\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch(base() + "/" + id)
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Owner ok\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void nonMember_forbiddenAndAnonymous_unauthorized() throws Exception {
        String id = createTask("Secret", assignee, assignee.getId().toString());

        mockMvc.perform(patch(base() + "/" + id)
                        .header("Authorization", bearer(outsider))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Nope\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete(base() + "/" + id)
                        .header("Authorization", bearer(outsider)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete(base() + "/" + id))
                .andExpect(status().isUnauthorized());
    }
}
