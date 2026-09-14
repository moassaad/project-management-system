package com.projectmanagementsystem.config;

import org.springframework.boot.diagnostics.AbstractFailureAnalyzer;
import org.springframework.boot.diagnostics.FailureAnalysis;

/**
 * Friendly hint when default PostgreSQL is not available.
 * Default profile needs postgres at localhost:5432 (docker-compose pms-db).
 * Without Docker use H2: JAVA_HOME=$HOME/.jdk21 ./mvnw spring-boot:run -Dspring-boot.run.profiles=h2
 */
public class PostgresConnectionFailureAnalyzer extends AbstractFailureAnalyzer<Exception> {

    @Override
    protected FailureAnalysis analyze(Throwable rootFailure, Exception cause) {
        String msg = cause.getMessage() != null ? cause.getMessage() : "";
        Throwable cur = cause;
        boolean isAuth = false;
        while (cur != null) {
            String m = cur.getMessage();
            if (m != null && m.contains("password authentication failed for user \"pms\"")) {
                isAuth = true;
                break;
            }
            if (cur.getClass().getName().contains("PSQLException") || cur.getClass().getName().contains("AuthException")) {
                // also check message contains FATAL
                if (m != null && m.contains("FATAL")) isAuth = true;
            }
            cur = cur.getCause();
        }
        if (!isAuth) return null;
        String description = "PostgreSQL at localhost:5432 not reachable or password mismatch (user \"pms\").";
        String action = "Start DB: docker-compose up -d pms-db (or docker compose up -d pms-db) from backend-spring-boot/, "
                + "or run without Docker via H2: JAVA_HOME=$HOME/.jdk21 SEED_USER_EMAIL=dev@example.com SEED_USER_PASSWORD=DevPass123! ./mvnw spring-boot:run -Dspring-boot.run.profiles=h2 "
                + "then curl http://localhost:8080/api/v1/health";
        return new FailureAnalysis(description, action, cause);
    }
}
