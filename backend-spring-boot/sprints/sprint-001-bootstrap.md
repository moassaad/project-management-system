# Sprint 001 — Backend Bootstrap

## Goal
Establish a minimal runnable Spring Boot project on Java 21 / Maven with Maven Wrapper, basic application skeleton, minimal configuration, and green build verification so Sprint 002 can start from a verified base.

## Scope
Sprint 001 is bootstrap only.

Included:
- Maven project initialization
- Spring Boot application skeleton
- Java 21 LTS configuration
- Maven Wrapper
- Minimal application configuration
- Basic context test
- `mvn verify` green
- Basic README/run instructions
- CHANGELOG initialization

Not included (belongs to later Sprints per `docs/roadmap/project-roadmap.md`):
- PostgreSQL
- JPA / Hibernate
- Flyway / migration
- UUID / domain persistence
- Validation framework setup
- RFC 9457 Problem Details
- API `/api/v1` foundation
- OpenAPI generation
- Authentication / JWT / Refresh Token / Token Rotation
- Projects / Tasks / Comments / Members
- Business authorization
- Production deployment
- Testcontainers

## Technology
- Spring Boot 4.1.1 (`spring-boot-starter-parent:4.1.1`)
- Java 21 LTS
- Maven
- groupId: `com.projectmanagementsystem`
- artifactId: `backend-spring-boot`
- version: `0.0.1-SNAPSHOT`
- base package: `com.projectmanagementsystem`

## Invariant
After every Ticket the project remains runnable (`./mvnw spring-boot:run` starts on 8080) and `./mvnw verify` can be executed (green after BOOT-004).

---

## Tickets

### Ticket ID
BOOT-001

### Title
Initialize Maven Project with Spring Boot 4.1.1 and Java 21

### Goal
Create the minimal `pom.xml` with approved coordinates on Java 21.

### Acceptance Criteria
- `backend-spring-boot/pom.xml` uses `spring-boot-starter-parent:4.1.1`, `groupId=com.projectmanagementsystem`, `artifactId=backend-spring-boot`, `version=0.0.1-SNAPSHOT`, `packaging=jar`
- Properties enforce `java.version=21`, `maven.compiler.source=21`, `maven.compiler.target=21`; starters only `spring-boot-starter-webmvc` + `spring-boot-starter-test` (test scope) — no `data-jpa`, `spring-boot-starter-validation`, `security`, `actuator`, `postgresql`, `flyway`, `springdoc`, `testcontainers`, or domain dependencies
- `mvn validate` succeeds; `mvn compile` succeeds after BOOT-003

### Dependencies
None

---

### Ticket ID
BOOT-002

### Title
Add Maven Wrapper and Base Ignore Rules

### Goal
Make builds reproducible without a preinstalled Maven.

### Acceptance Criteria
- Wrapper committed: `mvnw`, `mvnw.cmd`, `.mvn/wrapper/maven-wrapper.properties` (+ jar), executable (`chmod +x mvnw`)
- `.gitignore` covers `target/`, `!.mvn/wrapper/maven-wrapper.jar`, `*.class`, IDE (`*.iml`, `.idea/`, `.vscode/`)
- `./mvnw --version` reports Maven + Java 21, `./mvnw validate` passes
- No source changes; project remains runnable

### Dependencies
BOOT-001

---

### Ticket ID
BOOT-003

### Title
Create Application Skeleton and Minimal Configuration

### Goal
Provide the base package and minimal config to run the application.

### Acceptance Criteria
- Main class `src/main/java/com/projectmanagementsystem/Application.java` with `@SpringBootApplication` in base package `com.projectmanagementsystem`; standard `src/main/java`, `src/main/resources`, `src/test/java` layout
- `src/main/resources/application.yml` contains only `server.port: 8080` and `spring.application.name: backend-spring-boot` — no datasource, no JPA, no validation, no security
- `./mvnw spring-boot:run` starts embedded Tomcat on 8080, `curl http://localhost:8080/` returns 404 (no controllers yet) — proves wiring; `./mvnw compile` passes

### Dependencies
BOOT-001

---

### Ticket ID
BOOT-004

### Title
Establish Basic Context Test and Build Verification

### Goal
Prove green build with a single context test and no database.

### Acceptance Criteria
- `src/test/java/com/projectmanagementsystem/ApplicationTests.java` with `contextLoads()` using `spring-boot-starter-test` + JUnit 5 only — no `Testcontainers` / `PostgreSQL` / database wiring
- `./mvnw test` and `./mvnw verify` green without DB or env vars; Java 21 enforcement verified (compiler properties / enforcer)
- No additional code or dependencies introduced

### Dependencies
BOOT-003

---

### Ticket ID
BOOT-005

### Title
Add Run Instructions and Initialize Changelog

### Goal
Make the bootstrap usable and auditable for the next Sprint.

### Acceptance Criteria
- `backend-spring-boot/README.md` documents prerequisites (Java 21), `./mvnw spring-boot:run`, `./mvnw verify`, `./mvnw test`, port config via `application.yml`
- `backend-spring-boot/CHANGELOG.md` created with `## [Unreleased] — Sprint 001 Bootstrap (BOOT-001..BOOT-004)` entry
- Final check: `./mvnw verify` green, app starts/stops cleanly — no domain, auth, persistence, or API foundation added

### Dependencies
BOOT-004

---

## Dependencies Summary

```
BOOT-001
 ├─ BOOT-002
 └─ BOOT-003 → BOOT-004 → BOOT-005
```

- BOOT-001 is root.
- BOOT-002 and BOOT-003 both require BOOT-001.
- BOOT-004 requires BOOT-003.
- BOOT-005 requires BOOT-004.

## Parallelizable Work

- After BOOT-001: BOOT-002 (wrapper, `.gitignore`) and BOOT-003 (skeleton, `application.yml`) are file-disjoint and can run in parallel on 2 workers.
- BOOT-004 and BOOT-005 are strictly sequential (test must exist before docs claim green build).
- Max parallelism = 2. No ticket blocks Sprint 002 until BOOT-005 completes.

## Completion Criteria

- `./mvnw verify` green without database
- `./mvnw spring-boot:run` starts on 8080
- No Sprint 002 work (DB, JPA, Flyway, Validation, RFC 9457, `/api/v1`, OpenAPI, Auth) introduced
- `README.md` and `CHANGELOG.md` present

## Notes

- Approved stack includes PostgreSQL and Testcontainers per prior prompt, but explicitly deferred from Sprint 001 to keep bootstrap minimal — wiring belongs to Sprint 002 per roadmap.
- Remains small and focused: 5 Tickets, each leaves project in working state.
