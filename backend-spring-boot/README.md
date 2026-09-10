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
```

Change `server.port` to run on a different port. No datasource/JPA/validation/security configured in Sprint 001 (bootstrap only).

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
├── src/
│   ├── main/java/com/projectmanagementsystem/Application.java
│   ├── main/resources/application.yml
│   └── test/java/com/projectmanagementsystem/ApplicationTests.java
├── sprints/sprint-001-bootstrap.md
├── README.md
└── CHANGELOG.md
```

## Sprint 001 — Bootstrap

Bootstrap only — no database, JPA, Flyway, validation, RFC 9457, `/api/v1`, OpenAPI, auth, or domain code (deferred to Sprint 002+ per `docs/roadmap/project-roadmap.md`).

Tickets: `BOOT-001` (pom) → `BOOT-002` (wrapper) → `BOOT-003` (skeleton) → `BOOT-004` (context test) → `BOOT-005` (this README/CHANGELOG).
