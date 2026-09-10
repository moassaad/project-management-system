# Project Context

## Project

Project Management System is a lightweight web application for software teams to manage projects, tasks, members, and comments.

The primary goal is to learn and apply modern software engineering practices while keeping the business domain intentionally simple.

## Scope

The MVP includes:

* Authentication
* Dashboard
* Projects
* Project Members
* Tasks
* Comments

Features outside the MVP must not be introduced without explicit approval.

## Architecture

The system follows:

```text
Frontend
    ↓
REST API
    ↓
Backend
    ↓
Database
```

The repository supports multiple frontend and backend implementations.

## Frontend

Initial frontend implementation:

```text
React + TypeScript + Vite
```

The frontend uses Feature-Based Architecture.

Core tools and patterns:

* React Router
* TanStack Query
* Zustand
* React Hook Form
* Zod

## API

The API uses:

* REST
* JSON
* HTTPS
* `/api/v1` versioning
* UUID identifiers
* Pagination
* RFC 9457 Problem Details

HTTP conventions:

```text
POST   Create
GET    Read
PUT    Full Update
PATCH  Partial Update
DELETE Delete
```

## Authentication

Authentication uses:

* Bearer Access Token
* Refresh Token
* Access Token stored in frontend memory
* Refresh Token stored in HttpOnly Secure Cookie
* Refresh Token Rotation

## Business Rules

The backend is the final authority for authentication, authorization, validation, and business rules.

The frontend may improve UX by hiding or disabling unauthorized actions but must never be treated as a security boundary.

## API Contract

The backend implementation generates the OpenAPI specification.

The generated OpenAPI document is not manually edited.

The shared API design and business rules must remain consistent across backend implementations.

## AI Agent Principles

The AI Agent is an implementation and review assistant.

Before modifying the project, it must read the relevant project documentation.

The Agent must not silently change established architectural or product decisions.

Important missing decisions must be identified instead of guessed.

The Agent should prefer simple, established solutions and avoid unnecessary abstractions or dependencies.

---

## AI Skills and Rules Strategy

The project prefers established and widely used AI Agent skills over custom project-specific skills.

### Skills

The AI Agent should use relevant established skills for common technologies and engineering practices when available and compatible with the project's tooling.

Relevant skill areas may include:

* React
* TypeScript
* Testing
* REST APIs
* Web Security
* Accessibility
* Code Review
* Git and Software Engineering Practices

The project should not create a custom skill when an established skill already provides the required knowledge.

### Custom Skills

Custom project-specific skills should be avoided by default.

A custom skill may only be introduced when:

1. An important project-specific requirement cannot be expressed clearly using existing rules or documentation.
2. A recurring implementation or review problem requires specialized guidance.
3. No suitable established skill provides the required behavior.

Any custom skill should have a clear purpose and should be documented before being introduced.

### Rules

Project-specific architectural and engineering constraints belong in project rules and documentation rather than custom skills whenever possible.

Examples include:

* HTTP method conventions
* API versioning
* Authentication strategy
* Feature-based frontend architecture
* State-management boundaries
* Backend authorization authority

### Priority

The Agent should prefer:

```text
Established Skills
      ↓
Project Documentation
      ↓
Project Rules
      ↓
Task-specific instructions
      ↓
Custom Skills only when necessary
```

A more specific project rule may override a generic practice when the project explicitly requires different behavior.

### Principle

The project favors established knowledge, simple rules, and minimal custom Agent infrastructure.

Custom Agent behavior should be introduced only when there is a demonstrated need.

---

## AI Agent Ticket Execution Strategy

The AI Agent must implement the project incrementally using small, focused tickets.

The Agent must not attempt to implement the entire project from a single prompt.

### Unit of Work

The default implementation unit is a Ticket.

A Ticket should represent one small, independently reviewable objective.

Larger features should be decomposed into multiple Tickets.

Sprints may be used later to group related Tickets, but the Agent should execute and validate work at the Ticket level.

### Ticket Requirements

Each Ticket should define:

* Goal
* Scope
* Acceptance Criteria
* Expected Outputs
* Relevant constraints
* Required validation

The Agent should begin by understanding the Ticket and the relevant project documentation before modifying code.

### Minimal Change Principle

The Agent must make the smallest set of changes required to complete the Ticket correctly.

The Agent must not:

* Refactor unrelated code
* Rename unrelated files
* Change unrelated architecture
* Add unnecessary dependencies
* Modify configuration without need
* Reformat unrelated files
* Fix unrelated issues unless they block the Ticket

If an unrelated change is genuinely required, the Agent must explicitly explain why.

### Incremental Execution

Each completed Ticket must leave the project in a working state.

The Agent must validate the implementation before considering the Ticket complete.

The Agent should prefer small changes that can be independently reviewed and reverted.

### Definition of Done

A Ticket is considered complete only when:

1. The requested scope is implemented.
2. Acceptance criteria are satisfied.
3. The application remains runnable.
4. Relevant tests pass.
5. Type checking passes when applicable.
6. Linting passes when applicable.
7. The build succeeds when applicable.
8. No unnecessary files were modified.
9. All changed files are reported.
10. Run and test instructions are provided.
11. Known limitations or unresolved issues are reported.

### Required Completion Report

At the end of every Ticket, the Agent must report:

```text
Status

Implemented

Files Added

Files Modified

Files Deleted

Reason for Each Relevant File Change

How to Run

How to Test

Validation Results

Known Issues

Next Suggested Ticket
```

The Agent must not claim a Ticket is complete if required validation could not be performed.

### Token and Cost Efficiency

The Agent should optimize for high-quality implementation with minimal unnecessary context and changes.

The Agent should:

* Read only documentation relevant to the Ticket.
* Reuse existing project patterns.
* Avoid unnecessary exploration.
* Avoid generating unnecessary code.
* Avoid unnecessary refactoring.
* Avoid repeating information already established in project documentation.
* Make focused changes.
* Validate the smallest relevant scope first.

Token efficiency must never come at the expense of correctness, security, tests, or maintainability.

### Decision Escalation

If implementation requires an important architectural, product, security, API, or technology decision that has not already been defined in project documentation, the Agent must stop before making that decision silently.

The Agent must report the decision and request explicit approval.

### Review Boundary

The Agent is responsible for implementation and technical self-review.

The project owner remains responsible for final architectural approval and functional verification.

The project owner should review the changed files and test the resulting behavior after each Ticket.

---

## AI Agent Ticket Workflow

For every Ticket, the AI Agent should follow this workflow:

1. Read the Ticket requirements.
2. Read only the relevant project documentation.
3. Identify affected features and files.
4. Create a concise implementation plan.
5. Implement the requested scope.
6. Run the application or relevant validation environment.
7. Run relevant tests.
8. Run type checking, linting, and build validation when applicable.
9. Review the final changes for correctness and unnecessary modifications.
10. Report the completed work and validation results.

The Agent should not expand the Ticket scope without explicit approval.

If an important architectural, security, API, technology, or product decision is required and has not been defined, the Agent must report the decision instead of silently choosing one.

---

## Development Standards

The project follows simple, consistent, and maintainable coding standards.

Core principles:

* Use TypeScript strict mode.
* Follow ESLint and Prettier configuration.
* Prefer clear and meaningful names.
* Keep components focused.
* Keep business logic out of large JSX blocks when it can be separated clearly.
* Do not introduce unnecessary dependencies.
* Reuse existing project patterns.
* Avoid dead code and unused abstractions.
* Do not perform direct HTTP requests from React components.
* Follow established API conventions.
* Avoid unrelated refactoring during feature work.
* Prefer simple solutions before introducing custom abstractions.

Existing project conventions take precedence over personal coding preferences.

---

## Testing Strategy

The frontend testing stack uses:

* Vitest
* React Testing Library
* MSW for API mocking

Tests should focus on observable behavior and user-visible outcomes rather than implementation details.

The initial testing levels are:

* Unit tests for isolated logic
* Component tests for UI behavior
* Integration tests for feature interactions and API-related flows

Tests should be added or updated when behavior changes.

The AI Agent must not remove or weaken existing tests merely to make an implementation pass.

End-to-end testing may be introduced later if the project requires it.

---

## Backend Implementation Strategy

The initial backend implementation uses Spring Boot.

The implementation directory is:

```text
backend-spring-boot/
```

The Spring Boot implementation must follow the shared requirements, business rules, architecture, and API design documented under the repository-level `docs/` directory.

The backend must expose the agreed REST API and generate the OpenAPI specification from the backend implementation.

The Spring Boot implementation may use Spring-specific patterns and libraries when appropriate, but it must remain compatible with the shared project contract.

Framework-specific decisions belong inside the Spring Boot implementation documentation and must not be treated as shared project requirements unless explicitly approved.


---

## Java Backend Tooling

The initial backend implementation uses:

* Spring Boot
* Java 21 LTS
* Maven

The backend implementation directory is:

```text
backend-spring-boot/
```

Java dependencies are managed using Maven through `pom.xml`.

The Agent must preserve the selected Java and Maven configuration and must not change the Java version or build system without explicit approval.


---