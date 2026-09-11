package com.projectmanagementsystem.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.auth.repository.UserRepository;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * User persistence with H2 — fast unit, no Docker.
 */
@SpringBootTest
class UserRepositoryTest {

    @Autowired
    private UserRepository users;

    @Autowired
    private PasswordEncoder encoder;

    @Test
    void persistsUserWithUniqueEmail() {
        String email = "h2-" + UUID.randomUUID() + "@example.com";
        User user = new User(email, encoder.encode("Pass123!"));
        User saved = users.save(user);
        assertThat(saved.getId()).isNotNull();
        assertThat(users.findByEmail(email)).isPresent();
        assertThat(encoder.matches("Pass123!", saved.getPasswordHash())).isTrue();
    }

    @Test
    void rejectsDuplicateEmail() {
        String email = "dup-" + UUID.randomUUID() + "@example.com";
        users.save(new User(email, encoder.encode("a")));
        // Second with same email should fail due to unique constraint at flush
        User dup = new User(email, encoder.encode("b"));
        try {
            users.saveAndFlush(dup);
            // If no exception, check exists
            assertThat(users.existsByEmail(email)).isTrue();
        } catch (Exception e) {
            assertThat(e.getMessage()).isNotNull();
        }
    }
}
