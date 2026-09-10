# Spring Boot Agent Rules

## Global Project Rules

Before implementation, read:

```text
../AGENTS.md
```

## Shared Project Documentation

Read relevant documentation from:

```text
../docs/
```

Especially:

```text
../docs/project-context.md
../docs/requirements/
../docs/business-rules/
../docs/architecture/
../docs/api/
../docs/roadmap/
```

Read only what is relevant to the current Ticket.

## Backend Scope

This directory contains the Spring Boot backend implementation.

The implementation must follow the shared project requirements and API design.

Framework-specific implementation should use standard Spring Boot practices.

Avoid custom infrastructure when standard Spring Boot capabilities or established libraries provide the required solution.

## API

The backend must implement the documented REST API.

API changes must be reflected through the backend implementation and OpenAPI generation.

Do not manually edit generated OpenAPI output.

## Business Rules

Business rules are defined in:

```text
../docs/business-rules/
```

The backend is the final authority for:

* Authentication
* Authorization
* Validation
* Business rules
* Data integrity

## Database

Database-related implementation must follow the shared data requirements and avoid unnecessary changes outside the current Ticket.

## Testing

New or changed backend behavior should have appropriate tests.

Do not remove or weaken tests to make a Ticket pass.

## Minimal Changes

Modify only the files required for the current Ticket.

Do not refactor unrelated Spring Boot code.

## Changelog

Update:

```text
CHANGELOG.md
```

for meaningful changes introduced by completed Tickets.

## Completion

Before marking a Ticket Done:

* Run the relevant application checks.
* Run relevant tests.
* Run build validation.
* Review changed files.
* Report all relevant changes.
* Report how to run the backend.
* Report how to test the Ticket.
* Report any known issues.

---
