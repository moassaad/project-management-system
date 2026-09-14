package com.projectmanagementsystem.config;

import org.springframework.boot.diagnostics.FailureAnalysis;
import org.springframework.boot.diagnostics.FailureAnalyzer;

/**
 * Friendly hint when default PostgreSQL is not available.
 * Default profile needs postgres at localhost:5432 (docker-compose pms-db).
 * Without Docker use H2: JAVA_HOME=$HOME/.jdk21 ./mvnw spring-boot:run -Dspring-boot.run.profiles=h2
 */
public class PostgresConnectionFailureAnalyzer implements FailureAnalyzer {

    @Override
    public FailureAnalysis analyze(Throwable failure) {
        Throwable cur = failure;
        boolean isAuth = false;
        Throwable matched = null;
        while (cur != null) {
            String m = cur.getMessage();
            String cn = cur.getClass().getName();
            if (m != null && (m.contains("password authentication failed for user \"pms\"") || m.contains("FATAL: password authentication failed"))) {
                isAuth = true;
                matched = cur;
                break;
            }
            if (m != null && m.contains("Unable to determine Dialect")) {
                isAuth = true;
                matched = cur;
                break;
            }
            if (cn.contains("PSQLException") || cn.contains("AuthException")) {
                isAuth = true;
                matched = cur;
                break;
            }
            cur = cur.getCause();
        }
        if (!isAuth) return null;
        String description = "PostgreSQL at localhost:5432 not reachable or password mismatch (user \"pms\").";
        String action = "Start DB: docker-compose up -d pms-db (or docker compose up -d pms-db) from backend-spring-boot/, "
                + "or run without Docker via H2: JAVA_HOME=$HOME/.jdk21 SEED_USER_EMAIL=dev@example.com SEED_USER_PASSWORD=DevPass123! ./mvnw spring-boot:run -Dspring-boot.run.profiles=h2 "
                + "then curl http://localhost:8080/api/v1/health";
        return new FailureAnalysis(description, action, matched != null ? matched : failure);
    }
}
