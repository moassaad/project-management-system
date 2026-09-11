package com.projectmanagementsystem.auth.config;

import com.projectmanagementsystem.auth.entity.User;
import com.projectmanagementsystem.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Seed user for local dev — email/pass from env (not hard-coded as secret).
 * Documented in README: SEED_USER_EMAIL / SEED_USER_PASSWORD.
 * If env not set, no seed (or dev default for local testing via profile).
 */
@Configuration
public class SeedUserInitializer {

    private static final Logger log = LoggerFactory.getLogger(SeedUserInitializer.class);

    @Value("${app.seed.email:}")
    private String seedEmail;

    @Value("${app.seed.password:}")
    private String seedPassword;

    @Bean
    ApplicationRunner seedUser(UserRepository users, PasswordEncoder encoder) {
        return args -> {
            if (seedEmail == null || seedEmail.isBlank() || seedPassword == null || seedPassword.isBlank()) {
                log.info("Seed user not configured — set SEED_USER_EMAIL and SEED_USER_PASSWORD for local dev");
                return;
            }
            if (users.existsByEmail(seedEmail)) {
                log.info("Seed user already exists: {}", seedEmail);
                return;
            }
            User user = new User(seedEmail, encoder.encode(seedPassword));
            users.save(user);
            log.info("Seeded user: {}", seedEmail);
        };
    }
}
