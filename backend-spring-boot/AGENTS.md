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

## Service and Repository Pattern

The backend should use a clear Service/Repository architecture for business functionality.

### Repository

Repositories are responsible for data access and persistence.

Use repositories for:

* Database queries
* Entity persistence
* Entity retrieval
* Data-access-specific operations

Repositories must not contain business logic.

### Service

Services are responsible for application and business logic.

Use services for:

* Business rules
* Use-case orchestration
* Validation that belongs to business logic
* Coordinating multiple repositories or application operations
* Transaction boundaries when required

Controllers should not contain business logic.

Controllers should delegate application work to Services.

### Controller Responsibility

Controllers are responsible for:

* Receiving HTTP requests
* Request/response mapping
* Calling the appropriate Service
* Returning the appropriate HTTP response
* HTTP-specific concerns

Controllers should remain thin.

### Pattern Usage

Preferred flow:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

Do not bypass the Service layer for business operations unless there is a clear and documented reason.

Do not introduce unnecessary interfaces or abstractions.

Use interfaces where they provide a real architectural or testing benefit, not only to follow the pattern mechanically.

Keep each layer focused on its own responsibility.

---

## Clean Code and Backend Skills

The Agent should use the repository's applicable development Skills when they are available and relevant to the current Ticket.

The Agent should prefer Skills that improve:

* Clean Code
* SOLID principles
* Maintainability
* Spring Boot best practices
* REST API design
* Testing
* Database access
* Security
* Validation
* Error handling

Skills must be used as implementation guidance, not as a reason to introduce unnecessary abstractions or dependencies.

The Agent must continue to follow:

* the project architecture;
* the current Ticket scope;
* documented project decisions;
* existing project conventions.

When multiple Skills apply, use only the Skills relevant to the current Ticket.

Do not load or apply unrelated Skills unnecessarily.

Clean Code principles should be applied pragmatically.

Prefer:

* Clear and descriptive names
* Small focused methods
* Single responsibility
* Low coupling
* High cohesion
* Simple control flow
* Reuse of existing patterns
* Explicit error handling
* Testable design

Avoid:

* God classes
* Large methods
* Duplicate business logic
* Unnecessary abstractions
* Premature optimization
* Deep inheritance hierarchies
* Mixing responsibilities between Controller, Service, and Repository
* Adding libraries when standard Spring Boot capabilities are sufficient

The Agent should favor readable and maintainable code over clever or overly abstract solutions.

---
