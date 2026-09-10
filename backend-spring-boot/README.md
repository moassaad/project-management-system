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
- No local Maven required — use `./mvnw`

## How to Run

```bash
# from backend-spring-boot/
./mvnw spring-boot:run          # or: JAVA_HOME=/tmp/jdk21 ./mvnw spring-boot:run
```

- Starts embedded Tomcat on `http://localhost:8080/` (see `src/main/resources/application.yml:1`)
- No controllers yet — `curl http://localhost:8080/` returns `404` (proves wiring):
  ```bash
  curl -s -w "%{http_code}\n" http://localhost:8080/
  # {"timestamp":"...","status":404,"error":"Not Found","path":"/"}
  ```

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

**Database (PostgreSQL 16-alpine):**
- `application.yml` defines datasource via `${SPRING_DATASOURCE_URL}` / `USERNAME` / `PASSWORD` (defaults `jdbc:postgresql://localhost:5432/pms` / `pms`/`pms`) + Hikari defaults — no JPA/Flyway yet
- `application-dev.yml` keeps explicit `jdbc:postgresql://localhost:5432/pms` for local dev
- `application-test.yml` keeps placeholder `${SPRING_DATASOURCE_URL}` for Testcontainers override (BE-S002-08)
- Local DB: `docker-compose.yml` (`pms-db`, `postgres:16-alpine`, `5432:5432`, `POSTGRES_DB=pms POSTGRES_USER=pms POSTGRES_PASSWORD=pms`, volume `pms-db-data`, healthcheck `pg_isready`)
  ```bash
  docker compose up -d pms-db   # from backend-spring-boot/
  docker compose down
  ```
- `spring-boot:run` will start even if DB unreachable (Hikari lazy), but will fail on first connection — expected until DB is up; verify property binding via `./mvnw verify -DskipTests`

No JPA/Flyway/validation/security yet (Sprint 002+).

## How to Test

```bash
# from backend-spring-boot/
./mvnw test          # run ApplicationTests.contextLoads() only
./mvnw verify        # full build + repackage (target/*.jar)
./mvnw validate      # POM validation only
```

All commands require Java 21 — prefix with `JAVA_HOME=/tmp/jdk21` if system default is 17:

```bash
JAVA_HOME=/tmp/jdk21 ./mvnw verify -B
```

Expected: `Tests run: 1, Failures: 0, Errors: 0` + `BUILD SUCCESS`.

## Project Structure

```
backend-spring-boot/
├── pom.xml
├── mvnw / mvnw.cmd / .mvn/wrapper/
├── docker-compose.yml
├── src/
│   ├── main/java/com/projectmanagementsystem/
│   │   ├── Application.java
│   │   ├── config/ (package-info)
│   │   ├── common/ (package-info)
│   │   └── api/ (package-info)
│   ├── main/resources/
│   │   ├── application.yml
│   │   ├── application-dev.yml
│   │   └── application-test.yml
│   └── test/java/com/projectmanagementsystem/ApplicationTests.java
├── sprints/sprint-001-bootstrap.md
├── README.md
└── CHANGELOG.md
```

## Sprint 001 — Bootstrap

Bootstrap only — no database, JPA, Flyway, validation, RFC 9457, `/api/v1`, OpenAPI, auth, or domain code (deferred to Sprint 002+ per `docs/roadmap/project-roadmap.md`).

Tickets: `BOOT-001` (pom) → `BOOT-002` (wrapper) → `BOOT-003` (skeleton) → `BOOT-004` (context test) → `BOOT-005` (this README/CHANGELOG).
