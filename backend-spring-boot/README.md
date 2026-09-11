# Backend — Spring Boot

Project Management System — Spring Boot backend (`backend-spring-boot/`).

## Technology

- Spring Boot 4.1.1 (`spring-boot-starter-parent:4.1.1`)
- Java 21 LTS
- Maven (Maven Wrapper `mvnw` — no local Maven required)
- `groupId: com.projectmanagementsystem`
- `artifactId: backend-spring-boot`
- `base package: com.projectmanagementsystem`

## Prerequisites

- Java 21 LTS (Temurin 21.0.12.1 or similar)
  - System `java` is currently 17 on this host — use ephemeral JDK at `/tmp/jdk21` until `openjdk-21-jdk` is installed:
    ```bash
    export JAVA_HOME=/tmp/jdk21
    export PATH=$JAVA_HOME/bin:$PATH
    java -version  # must report 21
    ```
  - Or set `JAVA_HOME=/tmp/jdk21` per command: `JAVA_HOME=/tmp/jdk21 ./mvnw ...`
- No local Maven required — use `./mvnw`
- Docker (for PostgreSQL and Testcontainers) — optional for `verify` (skips gracefully if unavailable, see How to Test)

## How to Run

```bash
# from backend-spring-boot/
./mvnw spring-boot:run          # or: JAVA_HOME=/tmp/jdk21 ./mvnw spring-boot:run
# without Docker/PostgreSQL (H2 fallback, Sprint 002):
JAVA_HOME=/tmp/jdk21 ./mvnw spring-boot:run -Dspring-boot.run.profiles=h2
```

- Starts embedded Tomcat on `http://localhost:8080/` (see `src/main/resources/application.yml:1`)
- Health: `GET /api/v1/health` → `200 {"data":{"status":"UP"}}` (public, no auth): `curl http://localhost:8080/api/v1/health`
- Unknown `/api/v1/*` returns `404 application/problem+json` via `GlobalExceptionHandler`
- `curl http://localhost:8080/` still `404` for root

## Configuration

`src/main/resources/application.yml`:

```yaml
server:
  port: 8080

spring:
  application:
    name: backend-spring-boot
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/pms}
    username: ${SPRING_DATASOURCE_USERNAME:pms}
    password: ${SPRING_DATASOURCE_PASSWORD:pms}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
```

Change `server.port` to run on a different port.

**Database (PostgreSQL 16-alpine + JPA/Flyway):**
- `application.yml` — `spring.datasource` via `${SPRING_DATASOURCE_URL}` defaults `jdbc:postgresql://localhost:5432/pms` `pms/pms` + Hikari + `spring.jpa.hibernate.ddl-auto=validate` `open-in-view=false` + `spring.flyway.enabled=true` `locations=classpath:db/migration`
- `application-dev.yml` — explicit `jdbc:postgresql://localhost:5432/pms` for local dev
- `application-test.yml` / `src/test/resources/application.yml` — H2 `jdbc:h2:mem:testdb;MODE=PostgreSQL` `create-drop` `flyway.enabled=false` for fast `verify` without Docker; Testcontainers override via `AbstractIntegrationTest` when Docker available
- `application-h2.yml` — H2 `devdb` `create` `flyway.enabled=false` for `spring-boot:run -Dspring-boot.run.profiles=h2` without Docker
- Flyway baseline `src/main/resources/db/migration/V1__baseline.sql` — pgcrypto comment placeholder, no domain tables, `BaseEntity` `@MappedSuperclass` `UUID @UuidGenerator` `@CreationTimestamp/@UpdateTimestamp`
- Local DB: `docker-compose.yml` (`pms-db`, `postgres:16-alpine`, `5432:5432`, `POSTGRES_DB=pms POSTGRES_USER=pms POSTGRES_PASSWORD=pms`, volume `pms-db-data`, healthcheck `pg_isready`)
  ```bash
  docker compose up -d pms-db   # from backend-spring-boot/
  docker compose down
  ```
- `spring-boot:run` requires DB — use `h2` profile if Docker unavailable; `verify` uses H2 by default, Testcontainers `SmokeIT` uses real postgres when Docker available

**Validation & Errors (RFC 9457):**
- `spring-boot-starter-validation` (Jakarta Validation 3.x, Hibernate Validator)
- `GlobalExceptionHandler` `@RestControllerAdvice` produces `application/problem+json` (`type https://api.example.com/problems/...`): `MethodArgumentNotValidException→422` `errors: [{detail,pointer:"#/field"}]`, `ConstraintViolationException→400`, `ResourceNotFoundException/NoResourceFound→404`, `Exception→500` (no stack/DB exposure)
- CORS temporary `CorsConfig` → `http://localhost:5173` `allowCredentials:true` `GET/POST/PATCH/DELETE` (hardened Sprint 013)

## How to Test

```bash
# from backend-spring-boot/
./mvnw test          # unit + MockMvc (20 tests) — uses H2, no Docker needed
./mvnw verify        # full build + repackage (target/*.jar) + failsafe SmokeIT (skipped if Docker unavailable)
./mvnw test -Dtest=SmokeIT  # Testcontainers postgres:16-alpine — requires Docker, proves Flyway V1 + JPA bootstrap
./mvnw validate      # POM validation only
```

All commands require Java 21 — prefix with `JAVA_HOME=/tmp/jdk21` if system default is 17:

```bash
JAVA_HOME=/tmp/jdk21 ./mvnw verify -B
```

Expected: `Tests run: 20, Failures: 0, Errors: 0` (plus `SmokeIT` `Skipped:1` if Docker unavailable, `1 PASS` if Docker available) + `BUILD SUCCESS`.

**Testcontainers Harness (BE-S002-08):**
- `src/test/java/com/projectmanagementsystem/AbstractIntegrationTest.java` — `@Testcontainers(disabledWithoutDocker=true)` `@Container PostgreSQLContainer("postgres:16-alpine")` `@DynamicPropertySource` overriding `spring.datasource.*` + `spring.flyway.enabled=true` + `ddl-auto=validate`
- `SmokeIT.java` extends harness — `@SpringBootTest` `assertThat(dataSource).isNotNull()` + `flyway_schema_history version=1` check + JPA bootstrap
- Usage for future domain IT: `class MyIT extends AbstractIntegrationTest { @SpringBootTest @Test ... }`
- Prereq: Docker running (`docker info`), Temurin 21 at `/tmp/jdk21` if host java 17. `mvn verify` skips gracefully if Docker unavailable.

## Project Structure

```
backend-spring-boot/
├── pom.xml
├── mvnw / mvnw.cmd / .mvn/wrapper/
├── docker-compose.yml
├── src/
│   ├── main/java/com/projectmanagementsystem/
│   │   ├── Application.java
│   │   ├── config/ (CorsConfig, package-info)
│   │   ├── common/
│   │   │   ├── entity/BaseEntity
│   │   │   └── exception/{GlobalExceptionHandler,ResourceNotFoundException}
│   │   └── api/{HealthController, package-info}
│   ├── main/resources/
│   │   ├── application.yml (+ jpa/flyway)
│   │   ├── application-dev.yml
│   │   ├── application-test.yml
│   │   ├── application-h2.yml (dev without Docker)
│   │   └── db/migration/V1__baseline.sql
│   └── test/
│       ├── resources/application.yml (H2 for unit tests)
│       └── java/com/projectmanagementsystem/
│           ├── ApplicationTests.java
│           ├── AbstractIntegrationTest.java (Testcontainers harness)
│           ├── SmokeIT.java (Flyway/JPA on real DB)
│           ├── common/exception/GlobalExceptionHandlerTest.java
│           ├── validation/{BeanValidationDirectTest,BeanValidationWebMvcTest}
│           └── api/HealthControllerTest.java
├── sprints/sprint-001-bootstrap.md
├── README.md
└── CHANGELOG.md
```

## Sprint 001 — Bootstrap

Bootstrap only — no database, JPA, Flyway, validation, RFC 9457, `/api/v1`, OpenAPI, auth, or domain code (deferred to Sprint 002+ per `docs/roadmap/project-roadmap.md`).

Tickets: `BOOT-001` (pom) → `BOOT-002` (wrapper) → `BOOT-003` (skeleton) → `BOOT-004` (context test) → `BOOT-005` (this README/CHANGELOG).
