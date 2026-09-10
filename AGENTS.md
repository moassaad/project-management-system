# AGENTS.md

## 1. Purpose

This file defines the general operating rules for AI Agents working on this repository.

The Agent is an implementation and review assistant.

The Agent must follow the project's documented requirements, business rules, architecture, API contract, and development standards.

The Agent must not silently make important product, architectural, security, API, or technology decisions.

---

## 2. Source of Truth

Before implementing a task, the Agent must read:

1. `AGENTS.md`
2. `docs/project-context.md`
3. Relevant files under:

   * `docs/requirements/`
   * `docs/business-rules/`
   * `docs/architecture/`
   * `docs/api/`

The Agent should read only the documentation relevant to the current task whenever possible.

Do not load unrelated project documentation unnecessarily.

---

## 3. Project Principles

The project prioritizes:

* Correctness
* Maintainability
* Simplicity
* Testability
* Security
* Clear architecture
* Small changes
* High-quality implementation
* Low unnecessary token/context consumption

The Agent should prefer established and well-known solutions over custom abstractions.

Do not introduce complexity without a real requirement.

---

## 4. Implementation Model

The project is implemented incrementally using small Tickets.

The Agent must not attempt to implement the entire project from a single prompt.

Each Ticket should represent one focused and independently reviewable objective.

A Ticket may be part of a larger Feature or Sprint.

The Agent should complete only the requested Ticket scope unless additional changes are strictly necessary.

---

## 5. Ticket Execution Workflow

For every Ticket:

```text
Read
  ↓
Understand
  ↓
Plan
  ↓
Implement
  ↓
Run
  ↓
Test
  ↓
Validate
  ↓
Review
  ↓
Report
```

### Step 1 — Read

Read:

* `AGENTS.md`
* Relevant project context
* Relevant requirements
* Relevant business rules
* Relevant architecture documentation
* Relevant API documentation

Do not unnecessarily read unrelated files.

### Step 2 — Understand

Identify:

* Goal
* Scope
* Non-goals
* Acceptance criteria
* Affected feature
* Relevant existing implementation

### Step 3 — Plan

Create a concise implementation plan before modifying code.

The plan should identify:

* Main approach
* Expected files to change
* Tests required

Do not produce unnecessary detailed planning for trivial changes.

### Step 4 — Implement

Implement only the requested scope.

Prefer existing project patterns.

Reuse existing utilities, components, hooks, services, schemas, and abstractions when appropriate.

Do not create duplicate infrastructure.

### Step 5 — Run

Run the application or the smallest relevant execution environment needed to validate the change.

### Step 6 — Test

Run relevant automated tests.

Add or update tests when the Ticket changes observable behavior or introduces testable logic.

### Step 7 — Validate

When applicable, run:

* Type checking
* Linting
* Formatting checks
* Tests
* Production build

The Agent must not claim success for a check it did not actually run.

### Step 8 — Review

Before finishing:

* Review all changed files.
* Verify acceptance criteria.
* Check for unrelated modifications.
* Check for unnecessary dependencies.
* Check for obvious regressions.
* Check that architecture rules were respected.

### Step 9 — Report

Provide the required completion report described below.

---

## 6. Minimal Change Principle

Make the smallest set of changes required to complete the Ticket correctly.

Do not modify unrelated files.

Do not:

* Refactor unrelated code
* Rename unrelated files
* Reformat unrelated code
* Add unnecessary dependencies
* Change unrelated configuration
* Rewrite working infrastructure without need
* Fix unrelated bugs unless they block the Ticket

If an unrelated change is required, explain why it is necessary.

---

## 7. Project Working State

Every completed Ticket must leave the project in a working state.

A Ticket is not considered complete if the implementation prevents the project from:

* Starting
* Building
* Running relevant tests

unless the Ticket explicitly concerns a temporary or intentionally incomplete state.

---

## 8. Architecture Rules

The frontend uses Feature-Based Architecture.

Core structure:

```text
src/
├── app/
├── features/
├── components/
├── lib/
├── config/
├── hooks/
├── utils/
├── types/
└── styles/
```

Use established architecture boundaries.

### State

```text
Server State
    → TanStack Query

Local UI State
    → React State

Shared Client State
    → Zustand
```

Do not duplicate server-owned state in Zustand without a documented reason.

### API

Feature-specific API operations belong inside the relevant feature.

Common HTTP infrastructure belongs in the shared HTTP layer.

Do not perform direct HTTP requests from React components.

Preferred flow:

```text
Component
   ↓
Feature Logic / Hook
   ↓
Feature API
   ↓
Shared HTTP Infrastructure
   ↓
Backend API
```

### Routing

Use the centralized React Router configuration.

Do not create independent routing systems inside features.

### Forms

Use:

* React Hook Form
* Zod

Form schemas and API schemas should remain conceptually separate unless they are genuinely the same representation.

---

## 9. API Rules

The API follows:

* REST
* JSON
* HTTPS
* `/api/v1`
* UUID identifiers
* Pagination
* RFC 9457 Problem Details

HTTP conventions:

```text
POST   → Create
GET    → Read
PUT    → Full Update
PATCH  → Partial Update
DELETE → Delete
```

Do not use `PUT` and `PATCH` interchangeably.

The backend is the final authority for:

* Authentication
* Authorization
* Validation
* Business rules
* Data integrity

Frontend checks are not security boundaries.

---

## 10. Authentication Rules

Authentication uses:

* Bearer Access Token
* Refresh Token
* Refresh Token Rotation

Storage strategy:

```text
Access Token
→ Frontend Memory

Refresh Token
→ HttpOnly + Secure Cookie
```

The frontend must not attempt to read the Refresh Token directly.

Authentication behavior must follow the documented API contract.

Do not introduce an alternative authentication strategy without explicit approval.

---

## 11. API Contract Rule

The API Contract is defined through the backend implementation and generated OpenAPI specification.

The generated OpenAPI file must not be manually edited.

API changes must be implemented in the backend and the OpenAPI specification regenerated.

Do not invent undocumented API endpoints or response structures when an existing contract is available.

---

## 12. Business Rules

Business rules are documented under:

```text
docs/business-rules/
```

The Agent must follow them exactly.

If the frontend hides an action based on permissions, the backend must still be treated as the final authority.

Do not weaken or bypass business rules to simplify implementation.

---

## 13. Technology Rules

Use established project dependencies and patterns.

Do not add a new dependency unless:

1. It solves a real requirement.
2. Existing project capabilities are insufficient.
3. The dependency is appropriate for the project.
4. The addition is within the Ticket scope.

Do not add libraries merely because they are popular.

---

## 14. Custom Abstraction Rule

Prefer framework and library capabilities before creating custom abstractions.

Do not create:

* Generic wrappers
* Generic utilities
* Additional architecture layers
* Custom state systems
* Custom API frameworks

unless repeated real usage justifies them.

---

## 15. Testing Rules

Tests should focus on behavior rather than implementation details.

Frontend testing uses:

* Vitest
* React Testing Library
* MSW

Do not remove or weaken existing tests just to make a Ticket pass.

When behavior changes, determine whether existing tests need to be updated or new tests added.

---

## 16. Token and Context Efficiency

The Agent must optimize for quality with minimal unnecessary context consumption.

The Agent should:

* Read only relevant documentation
* Inspect only relevant code first
* Reuse existing patterns
* Avoid unnecessary exploration
* Avoid unnecessary explanations
* Avoid generating unused code
* Avoid unrelated refactoring
* Keep plans concise
* Keep final reports structured

Token efficiency must never reduce:

* Correctness
* Security
* Required testing
* Maintainability
* Acceptance-criteria compliance

---

## 17. Decision Escalation

The Agent must not silently decide important unresolved matters.

Stop and request approval when a task requires a new decision involving:

* Architecture
* Security
* Authentication
* Authorization
* API design
* Database design
* Major dependency changes
* Technology selection
* Product behavior
* Breaking changes

For minor implementation details, use established project conventions and proceed.

---

## 18. File Scope

The Agent should identify the expected files before implementation whenever practical.

The Agent must minimize file changes.

After implementation, report:

* Added files
* Modified files
* Deleted files

Every non-obvious file modification should have a reason.

---

## 19. Completion Report

Every completed Ticket must end with:

```text
Status

Implemented

Files Added

Files Modified

Files Deleted

Why Relevant Files Changed

How to Run

How to Test

Validation Results

Known Issues

Next Suggested Ticket
```

The Agent must explicitly state when a validation step could not be performed.

---

## 20. Definition of Done

A Ticket is Done only when:

* The requested scope is implemented.
* Acceptance criteria are satisfied.
* The project remains runnable.
* Relevant tests pass.
* Type checking passes when applicable.
* Linting passes when applicable.
* Build succeeds when applicable.
* No unnecessary files were changed.
* Changes have been reviewed.
* Run instructions are provided.
* Test instructions are provided.
* Known issues are reported.

---

## 21. Final Authority

The project owner has final authority over:

* Product decisions
* Architecture decisions
* Security decisions
* API decisions
* Technology choices
* Scope changes

The Agent should recommend improvements when appropriate but must not silently apply significant changes.

---

## 22. Default Behavior

When uncertain:

1. Check project documentation.
2. Check existing implementation patterns.
3. Prefer the simplest established solution.
4. Avoid unnecessary changes.
5. Ask for approval only when the decision is important.
6. Keep the project working after the Ticket.

---

## 23. Validation Requirements

* Application runs
* Relevant tests pass
* Type checking passes
* Linting passes
* Build passes when applicable

---

## 24. Completion Report

The Agent must report:

* Status
* Implemented changes
* Added files
* Modified files
* Deleted files
* Reasons for relevant changes
* How to run
* How to test
* Validation results
* Known issues
* Next suggested Ticket

---

## Sprint and Ticket Planning

The project uses Sprints for planning and Tickets for execution.

When the project owner provides a new requirement or feature request, the Agent should:

1. Understand the requirement.
2. Create or update the appropriate Sprint.
3. Break the requirement into small, independently executable Tickets.
4. Identify dependencies between Tickets.
5. Identify Tickets that can be executed in parallel.
6. Start with the first unblocked Ticket.

The Agent must not attempt to implement an entire Sprint in one step.

### Sprint

A Sprint is a planning unit that groups related Tickets around a specific goal.

A Sprint should contain:

* Sprint goal
* Tickets
* Ticket dependencies
* Parallelization opportunities
* Completion criteria

### Ticket

A Ticket is the default execution unit.

The project owner may provide only a requirement or feature description.

The Agent is responsible for converting the requirement into a concise Ticket containing the necessary goal, scope, acceptance criteria, and validation requirements.

### Execution

Tickets must be implemented one at a time unless multiple independent Tickets are explicitly assigned to separate workers or agents.

Every completed Ticket must leave the affected project implementation in a working and validated state.

### Parallel Work

Parallel execution is allowed only when Tickets have no blocking dependency.

The Agent must identify dependencies before recommending parallel work.

Integration work should occur after the required implementations are available.

### Scope

The Agent must not expand a Ticket into unrelated work.

If completing the Ticket requires an important architectural or product decision, the Agent must request approval rather than silently changing the project direction.

---

## Changelog Scope

Each implementation must maintain its own `CHANGELOG.md`.

The Changelog belongs inside the implementation directory:

```text
frontend-react/CHANGELOG.md
frontend-vue/CHANGELOG.md
backend-spring-boot/CHANGELOG.md
backend-laravel/CHANGELOG.md
```

When a Ticket changes an implementation, the Agent must update only that implementation's Changelog.

Examples:

```text
frontend-react/CHANGELOG.md
```

for React frontend changes.

```text
backend-spring-boot/CHANGELOG.md
```

for Spring Boot backend changes.

The root repository must not contain a shared implementation Changelog.

### Changelog Content

The Changelog should contain concise, human-readable entries for meaningful changes.

It should not duplicate detailed Git history or list every modified line.

Each entry should identify the relevant Ticket when applicable.

Example:

```text
## Unreleased

### Added
- [AUTH-003] Added login form and authentication state handling.

### Changed
- [AUTH-004] Updated authentication refresh flow.

### Fixed
- [AUTH-005] Fixed unauthorized redirect behavior.
```

The Agent must update the Changelog as part of completing a relevant Ticket.

-------------------------------------------------------------------------------------------

# AGENTS.md

## 1. Purpose

This file defines the general operating rules for AI Agents working on this repository.

The Agent is an implementation, planning, and review assistant.

The Agent must follow the project's documented requirements, business rules, architecture, API contract, and development standards.

The Agent must not silently make important product, architectural, security, API, or technology decisions.

---

## 2. Repository Structure

The repository may contain multiple implementations of the same system.

```text
project-management/
├── AGENTS.md
├── docs/
├── frontend-react/
├── frontend-vue/
├── backend-spring-boot/
├── backend-laravel/
└── ...
```

Shared project knowledge belongs under `docs/`.

Framework-specific implementation knowledge belongs inside the relevant implementation directory.

---

## 3. Source of Truth

Before working on a task, the Agent must read:

1. `AGENTS.md`
2. `docs/project-context.md`
3. Relevant files under:

   * `docs/requirements/`
   * `docs/business-rules/`
   * `docs/architecture/`
   * `docs/api/`
   * `docs/roadmap/`

For implementation work, the Agent must also read the implementation-specific `AGENTS.md`.

The Agent should read only the documentation relevant to the current task whenever possible.

Do not unnecessarily load unrelated project context.

---

## 4. Planning vs Implementation

The repository uses two main AI working modes.

### Planning Mode

Planning Mode operates from the repository root.

Use it when the task is to:

* Analyze a new requirement
* Create or update a Sprint
* Break a requirement into Tickets
* Identify dependencies
* Identify parallel work
* Update the implementation roadmap

Planning Mode must not implement application code unless explicitly requested.

### Implementation Mode

Implementation Mode operates within the relevant implementation directory.

Examples:

```text
frontend-react/
backend-spring-boot/
backend-laravel/
```

Use it when implementing or reviewing a Ticket for that implementation.

---

## 5. Sprint Model

Sprints are planning units.

A Sprint groups related Tickets around one meaningful goal.

The general roadmap is maintained under:

```text
docs/roadmap/
```

Implementation-specific Sprint files belong inside the relevant implementation:

```text
frontend-react/sprints/
backend-<framework>/sprints/
```

A Sprint should identify:

* Goal
* Tickets
* Dependencies
* Parallel work
* Completion criteria

The Agent must not attempt to implement an entire Sprint in one step.

---

## 6. Ticket Model

A Ticket is the default execution unit.

The project owner may provide a simple requirement or feature description.

The Agent is responsible for converting that requirement into small, independently reviewable Tickets.

A Ticket should be focused enough to implement, test, review, and leave the project working.

The Agent should avoid unnecessarily large Tickets.

---

## 7. Ticket Execution Workflow

For every Ticket:

```text
Read
  ↓
Understand
  ↓
Plan
  ↓
Implement
  ↓
Run
  ↓
Test
  ↓
Validate
  ↓
Review
  ↓
Update CHANGELOG
  ↓
Report
```

The Agent must not consider a Ticket complete before required validation has been performed.

---

## 8. Minimal Change Principle

Make the smallest set of changes necessary to complete the Ticket correctly.

Do not modify unrelated files.

Do not:

* Refactor unrelated code
* Rename unrelated files
* Reformat unrelated files
* Add unnecessary dependencies
* Change unrelated configuration
* Rewrite working infrastructure without need
* Introduce new architecture without justification

If an additional change is genuinely required, explain why it is necessary.

---

## 9. Working State Requirement

Every completed Ticket must leave the affected implementation in a working state.

The Agent must verify, as applicable:

* Application starts
* Relevant tests pass
* Type checking passes
* Linting passes
* Build succeeds

The Agent must not claim that a check passed unless it actually ran it.

---

## 10. Testing

Behavioral correctness is more important than implementation details.

Tests should be added or updated when a Ticket changes observable behavior or introduces testable logic.

Existing tests must not be removed or weakened merely to make the implementation pass.

---

## 11. Token and Context Efficiency

Optimize for high-quality implementation using minimal unnecessary context.

The Agent should:

* Read only relevant documentation
* Inspect relevant code first
* Reuse existing patterns
* Avoid unnecessary exploration
* Keep plans concise
* Avoid generating unused code
* Avoid unrelated refactoring
* Avoid unnecessary dependencies
* Avoid repeating information already documented

Token efficiency must never reduce correctness, security, testing, or maintainability.

---

## 12. Architecture Decisions

The Agent must follow established architecture and project rules.

Important unresolved decisions must not be guessed silently.

The Agent must request approval when implementation requires a significant decision involving:

* Architecture
* Security
* Authentication
* Authorization
* API design
* Database design
* Technology selection
* Major dependency changes
* Breaking changes
* Product behavior

For minor implementation details, follow existing conventions and proceed.

---

## 13. Existing Patterns

Before creating a new abstraction, utility, component, service, hook, or helper, the Agent should check whether an existing project solution already solves the problem.

Prefer reuse over duplication.

Prefer simple established solutions over custom infrastructure.

---

## 14. API Rules

The project API follows:

* REST
* JSON
* HTTPS
* `/api/v1`
* UUID identifiers
* Pagination
* RFC 9457 Problem Details

HTTP conventions:

```text
POST   → Create
GET    → Read
PUT    → Full Update
PATCH  → Partial Update
DELETE → Delete
```

Do not use `PUT` and `PATCH` interchangeably.

The backend is the final authority for:

* Authentication
* Authorization
* Validation
* Business rules
* Data integrity

---

## 15. Authentication Rules

The authentication strategy uses:

* Bearer Access Token
* Refresh Token
* Refresh Token Rotation
* Access Token stored in frontend memory
* Refresh Token stored in an HttpOnly Secure Cookie

The frontend must not attempt to access the Refresh Token value directly.

Authentication implementation must follow the documented authentication contract.

---

## 16. Business Rules

Business rules are documented under:

```text
docs/business-rules/
```

The Agent must follow these rules exactly.

Frontend authorization checks are for UX only.

Backend authorization remains the final security boundary.

---

## 17. Changelog

Each implementation maintains its own:

```text
CHANGELOG.md
```

Examples:

```text
frontend-react/CHANGELOG.md
backend-spring-boot/CHANGELOG.md
backend-laravel/CHANGELOG.md
```

The Agent must update the relevant implementation Changelog when a completed Ticket makes a meaningful behavior, architecture, configuration, or user-facing change.

Changelog entries must be concise and should reference the Ticket ID when applicable.

Do not use the Changelog as a replacement for Git history.

---

## 18. Completion Report

Every completed Ticket must report:

```text
Status

Implemented

Files Added

Files Modified

Files Deleted

Why Relevant Files Changed

How to Run

How to Test

Validation Results

Known Issues

Next Suggested Ticket
```

The Agent must clearly report when a validation step could not be performed.

---

## 19. Definition of Done

A Ticket is Done only when:

* The requested scope is implemented
* Acceptance criteria are satisfied
* The application remains runnable
* Relevant tests pass
* Type checking passes when applicable
* Linting passes when applicable
* Build succeeds when applicable
* No unnecessary files were changed
* Relevant changes were reviewed
* CHANGELOG was updated when required
* Run instructions are provided
* Test instructions are provided
* Known issues are reported

---

## 20. Final Authority

The project owner has final authority over:

* Product decisions
* Architecture decisions
* Security decisions
* API decisions
* Technology choices
* Scope changes

The Agent may recommend alternatives but must not silently apply significant changes.

---

## 21. Default Behavior

When uncertain:

1. Read the relevant project documentation.
2. Check existing implementation patterns.
3. Prefer the simplest established solution.
4. Avoid unnecessary changes.
5. Escalate important decisions.
6. Keep the project working.
7. Report the result clearly.
