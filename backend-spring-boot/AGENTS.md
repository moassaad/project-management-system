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

### Sprint Execution

When a Sprint is selected:

1. Read the Sprint file and applicable project documentation.
2. Identify the next unblocked Ticket.
3. Implement only that Ticket.
4. Validate the implementation.
5. Update the implementation CHANGELOG when required.
6. Report the result.
7. Stop after the Ticket is complete.

Do not automatically continue to the next Ticket unless explicitly instructed.

### Ticket Planning

When given a new client requirement or feature:

1. Analyze the requirement.
2. Create or update the appropriate Sprint.
3. Break it into small Tickets.
4. Identify dependencies and possible parallel work.
5. Do not implement until the Sprint plan is approved.

The Agent should keep Sprint and Ticket plans concise.

### Ticket Definition

A Ticket should contain only:

- ID
- Title
- Goal
- Acceptance Criteria
- Dependencies

### Ticket Completion

Every completed Ticket must leave the implementation runnable.

The Agent must:

- Run relevant validation.
- Report actual results.
- Report added, modified, and deleted files.
- Explain non-obvious file changes.
- Provide run/test commands.
- Report known issues.
- Update the implementation CHANGELOG when appropriate.

### Minimal Change

Modify only files necessary for the current Ticket.

Do not perform unrelated refactoring, cleanup, renaming, formatting, dependency changes, or architecture changes.

### Stop Conditions

Stop and ask the project owner when:

- an important architectural decision is required;
- a security decision is required;
- an API contract decision is required;
- a technology/dependency decision is required;
- the Ticket acceptance criteria are ambiguous;
- a required change would expand the Ticket scope significantly.

Do not silently make important decisions.

### Validation

Never claim a command passed unless it was actually executed.

A Ticket is not complete if required validation could not be performed, unless the Agent explicitly reports why.

### Changelog

Each implementation maintains its own CHANGELOG.md.

The Agent updates only the CHANGELOG belonging to the implementation being modified.

---

# Spring Boot Agent Instructions

## Repository Context

Current implementation directory:
`backend-spring-boot/`

Repository root:
`..`

Before any task, read:

`../AGENTS.md`

Shared project documentation:

`../docs/`

Global repository instructions are defined in the repository-root AGENTS.md.
OpenCode automatically discovers applicable AGENTS.md files from the current directory toward the project root.

Read:
./AGENTS.md
../AGENTS.md
../docs/project-context.md