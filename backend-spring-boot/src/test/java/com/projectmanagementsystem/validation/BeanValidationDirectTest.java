package com.projectmanagementsystem.validation;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Direct Jakarta Validator test — verifies validation starter is on the classpath
 * and constraints behave as expected without Spring MVC.
 */
class BeanValidationDirectTest {

    private final Validator validator;

    BeanValidationDirectTest() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            this.validator = factory.getValidator();
        }
    }

    public record SampleDto(
            @NotBlank
            @Size(min = 3, max = 50)
            String name
    ) {}

    @Test
    void whenValid_thenNoViolations() {
        var dto = new SampleDto("valid name");
        var violations = validator.validate(dto);
        assertThat(violations).isEmpty();
    }

    @Test
    void whenBlank_thenViolation() {
        var dto = new SampleDto("");
        var violations = validator.validate(dto);
        assertThat(violations).isNotEmpty();
    }

    @Test
    void whenTooShort_thenViolation() {
        var dto = new SampleDto("ab");
        var violations = validator.validate(dto);
        assertThat(violations).isNotEmpty();
    }

    @Test
    void whenTooLong_thenViolation() {
        var dto = new SampleDto("a".repeat(51));
        var violations = validator.validate(dto);
        assertThat(violations).isNotEmpty();
    }
}
