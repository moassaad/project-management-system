package com.projectmanagementsystem;

import static org.assertj.core.api.Assertions.assertThat;

import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Smoke integration test proving Flyway baseline + JPA bootstrap on real PostgreSQL.
 * Extends {@link AbstractIntegrationTest} harness.
 * Skips gracefully if Docker unavailable.
 */
@SpringBootTest
class SmokeIT extends AbstractIntegrationTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void contextLoadsWithRealDb() {
        assertThat(dataSource).isNotNull();
        assertThat(jdbcTemplate).isNotNull();

        // Flyway baseline applied: check flyway_schema_history exists and V1 applied
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '1'", Integer.class);
        assertThat(count).isGreaterThanOrEqualTo(1);

        // JPA bootstrap proven via context load with validate and BaseEntity
        // No domain tables yet, but EntityManagerFactory initialized (implicit via context load)
    }
}
