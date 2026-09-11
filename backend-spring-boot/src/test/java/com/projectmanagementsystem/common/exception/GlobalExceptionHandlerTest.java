package com.projectmanagementsystem.common.exception;

import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Valid;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.annotation.Validated;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies RFC 9457 Problem Details via GlobalExceptionHandler.
 * Uses standalone MockMvc with controller advice to avoid DB.
 */
class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @RestController
    @Validated
    static class TestController {

        @PostMapping("/test/validation")
        public String validate(@Valid @RequestBody SampleDto dto) {
            return "ok";
        }

        @GetMapping("/test/constraint")
        public String constraint(@RequestParam String q) {
            if (q == null || q.isBlank()) {
                Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
                var dto = new SampleDto(q);
                var violations = validator.validate(dto);
                if (!violations.isEmpty()) {
                    throw new ConstraintViolationException(violations);
                }
                throw new ConstraintViolationException("q must not be blank", null);
            }
            return "ok:" + q;
        }

        @GetMapping("/test/not-found")
        public String notFound() {
            throw new ResourceNotFoundException("Project not found");
        }

        @GetMapping("/test/error")
        public String error() {
            throw new RuntimeException("unexpected boom with secret abc123");
        }
    }

    public record SampleDto(
            @NotBlank
            @Size(min = 3, max = 50)
            String name
    ) {}

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void whenValidationFails_thenReturns422ProblemJson() throws Exception {
        mockMvc.perform(post("/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"ab\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/validation-error"))
                .andExpect(jsonPath("$.title").value("Validation failed"))
                .andExpect(jsonPath("$.status").value(422))
                .andExpect(jsonPath("$.detail").value("One or more fields are invalid."))
                .andExpect(jsonPath("$.instance").value("/test/validation"))
                .andExpect(jsonPath("$.errors[0].detail").exists())
                .andExpect(jsonPath("$.errors[0].pointer").value("#/name"));
    }

    @Test
    void whenValidationBlank_thenReturns422WithErrors() throws Exception {
        mockMvc.perform(post("/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.errors").isArray())
                .andExpect(jsonPath("$.errors[0].pointer").value("#/name"));
    }

    @Test
    void whenConstraintViolation_thenReturns400ProblemJson() throws Exception {
        mockMvc.perform(get("/test/constraint")
                        .param("q", ""))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/constraint-violation"))
                .andExpect(jsonPath("$.title").value("Constraint violation"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void whenResourceNotFound_thenReturns404ProblemJson() throws Exception {
        mockMvc.perform(get("/test/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/resource-not-found"))
                .andExpect(jsonPath("$.title").value("Resource not found"))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail").value("Project not found"))
                .andExpect(jsonPath("$.instance").value("/test/not-found"));
    }

    @Test
    void whenGenericException_thenReturns500WithoutSecrets() throws Exception {
        mockMvc.perform(get("/test/error"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.type").value("https://api.example.com/problems/internal-server-error"))
                .andExpect(jsonPath("$.title").value("Internal server error"))
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.detail").value("An unexpected error occurred."));
    }

    @Test
    void whenValidPayload_thenReturnsOk() throws Exception {
        mockMvc.perform(post("/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"valid name\"}"))
                .andExpect(status().isOk());
    }
}
