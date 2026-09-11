package com.projectmanagementsystem.validation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies Jakarta Bean Validation auto-configuration.
 * No production controller required — test-only controller lives within this slice.
 */
@WebMvcTest(BeanValidationWebMvcTest.TestController.class)
class BeanValidationWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @RestController
    static class TestController {

        @PostMapping("/test/validation")
        public String validate(@Valid @RequestBody SampleDto dto) {
            return "ok";
        }
    }

    public record SampleDto(
            @NotBlank
            @Size(min = 3, max = 50)
            String name
    ) {}

    @Test
    void whenValidPayload_thenReturnsOk() throws Exception {
        mockMvc.perform(post("/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"valid name\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void whenBlankName_thenTriggersMethodArgumentNotValidException() throws Exception {
        // Empty string triggers @NotBlank -> 400 Bad Request (default Spring error before RFC 9457 handler)
        mockMvc.perform(post("/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void whenNameTooShort_thenTriggersValidationFailure() throws Exception {
        // Too short triggers @Size(min=3) -> 400
        mockMvc.perform(post("/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"ab\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void whenNameTooLong_thenTriggersValidationFailure() throws Exception {
        String longName = "a".repeat(51);
        mockMvc.perform(post("/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + longName + "\"}"))
                .andExpect(status().isBadRequest());
    }
}
