# Changelog

All notable changes to the Spring Boot backend (`backend-spring-boot/`) are documented here.

## [Unreleased]

### Added
- [BOOT-001] Initialize Maven project with Spring Boot 4.1.1 and Java 21 — `pom.xml` with `spring-boot-starter-parent:4.1.1`, `com.projectmanagementsystem:backend-spring-boot:0.0.1-SNAPSHOT`, `java.version=21`, `spring-boot-starter-webmvc` + `spring-boot-starter-test`
- [BOOT-002] Add Maven Wrapper and base ignore rules — `mvnw`/`mvnw.cmd`/` .mvn/wrapper/maven-wrapper.properties` (Maven 3.9.9, wrapper 3.3.4) + `.gitignore`
- [BOOT-003] Create application skeleton and minimal configuration — `Application.java` (`com.projectmanagementsystem`) + `application.yml` (`server.port:8080`)
- [BOOT-004] Establish basic context test and build verification — `ApplicationTests.contextLoads()` — `mvn verify` green without DB
- [BOOT-005] Add run instructions and initialize changelog — `README.md` + this CHANGELOG

_Sprint 001 — Backend Bootstrap — bootstrap only; no database, JPA, Flyway, validation, RFC 9457, `/api/v1`, OpenAPI, or auth (deferred to Sprint 002+)._

### Added (Sprint 002)
- [BE-S002-01] Establish backend structure and environment profiles — `config/`, `common/`, `api/` packages (package-info) + `application-dev.yml` / `application-test.yml` placeholders (no datasource/domain)
- [BE-S002-02] Configure PostgreSQL datasource and Docker Compose — `org.postgresql:postgresql` (runtime), `docker-compose.yml` (`postgres:16-alpine`, `pms-db`, `5432:5432`), `spring.datasource` (`SPRING_DATASOURCE_*` placeholders, Hikari) + README docs
- [BE-S002-04] Add Bean Validation foundation — `spring-boot-starter-validation` (Jakarta Validation 3.x, Hibernate Validator 9.1.3), sample DTO `@NotBlank`/`@Size` with `MockMvc` standalone + direct `Validator` tests verifying `MethodArgumentNotValidException` → 400 (no custom Problem Details yet, deferred to BE-S002-05)
- [BE-S002-05] Implement RFC 9457 Problem Details error handling — `GlobalExceptionHandler` (`@RestControllerAdvice`) with `ProblemDetail` (`type` `https://api.example.com/problems/...`, `title`, `status`, `detail`, `instance`, `errors: [{detail, pointer: \"#/field\"}]`): `MethodArgumentNotValidException` → 422, `ConstraintViolationException` → 400, `ResourceNotFoundException` → 404, generic `Exception` → 500; all `application/problem+json`, no stack/DB/class exposure
- [BE-S002-03] Introduce JPA, Flyway, and UUID base entity — `spring-boot-starter-data-jpa`, `flyway-core`, `flyway-database-postgresql`, `V1__baseline.sql` (pgcrypto comment baseline, no domain tables), `spring.jpa.hibernate.ddl-auto=validate`, `open-in-view=false`, `flyway.enabled/locations`, `BaseEntity` (`@MappedSuperclass`, `@Id UUID @GeneratedValue @UuidGenerator`, `@CreationTimestamp createdAt`, `@UpdateTimestamp updatedAt`), H2 `src/test/resources/application.yml` for `verify` without Docker
