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

The general roadmap is maintained under:

docs/roadmap/

GitHub Issues are the source of work for Sprints and Tickets.

The repository-level roadmap defines the planned implementation order.
GitHub Sprint Issues and Ticket Issues define the active execution work.

Do not create or maintain implementation-specific Sprint or Ticket markdown files as a duplicate source of work.

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

---

### Sprint Execution

When a Sprint is selected:

1. Read the Sprint GitHub Issue and applicable project documentation.
2. Identify the next unblocked Ticket GitHub Issue labeled `ready`.
3. Implement only that Ticket.
4. Validate the implementation.
5. Update the implementation CHANGELOG when required.
6. Update the Ticket GitHub Issue with the result and apply `review`.
7. Propose a Git commit message.
8. Stop and wait for project-owner review.

Do not automatically continue to the next Ticket unless explicitly instructed.

### Ticket Planning

When given a new client requirement or feature:

1. Analyze the requirement.
2. Create or update the appropriate Sprint GitHub Issue.
3. Break it into small Ticket GitHub Issues.
4. Link Tickets to the Sprint using GitHub Sub-issues when available.
5. Identify dependencies and possible parallel work.
6. Apply the appropriate GitHub labels.
7. Wait for project-owner approval before marking Tickets as `ready` or beginning implementation.
8. After approval, mark executable Tickets as `ready`.

The Agent should keep Sprint and Ticket plans concise.

### GitHub Planning

When a new requirement is planned:

1. Create or update one Sprint GitHub Issue.
2. Create one Ticket GitHub Issue for each executable Ticket.
3. Link Ticket Issues to the Sprint Issue using GitHub Sub-issues when available.
4. Apply the appropriate labels.
5. Mark executable Tickets as `ready`.
6. Identify dependencies and parallel work.
7. Do not create duplicate local Ticket markdown files.

The Sprint Issue is the planning container.
Ticket Issues are the execution units.

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
- Update the Ticket GitHub Issue after validation.
- Apply the `review` label.
- Propose a focused Git commit message.


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

### Sprint and Ticket Storage

GitHub Issues are the source of work for Sprints and Tickets.

Do not create or maintain implementation-specific `sprints/*.md` files as a duplicate source of Tickets.

The repository-level roadmap under `docs/roadmap/` remains the high-level project plan.

Sprint scope and Ticket execution details are maintained in GitHub Issues.

---

Execute the current Sprint one Ticket at a time.

Follow AGENTS.md.

For each Ticket:

- implement it
- validate it
- update CHANGELOG when required
- report the result

Stop after each completed Ticket and wait for my approval before continuing.

---

## GitHub Issue Lifecycle

GitHub Issues are the primary work-tracking mechanism for Sprints and Tickets.

### Sprint

A Sprint is represented by a GitHub Issue labeled:

```text
sprint
```

and implementation scope:

```text
frontend
```

or:

```text
backend
```

### Ticket

Each Ticket is represented by a GitHub Issue labeled:

```text
ticket
```

and:

```text
frontend
```

or:

```text
backend
```

When GitHub Sub-issues are available, Tickets should be linked to their Sprint Issue as Sub-issues.

### Ticket Labels

Use these labels when applicable:

```text
sprint
ticket
frontend
backend
ready
review
blocked
in progress
```

Do not create duplicate or unnecessary labels.

Use existing labels whenever possible.

### Ticket Lifecycle

A Ticket follows this lifecycle:

```text
blocked
   ↓
ready
   ↓
in progress
   ↓
review
   ↓
closed
```

Definitions:

* `blocked` = Ticket cannot currently be implemented because one or more dependencies are incomplete.
* `ready` = Ticket is approved and all dependencies required for implementation are satisfied.
* `in progress` = Agent is currently implementing the Ticket.
* `review` = Implementation is complete and waiting for project-owner approval.
* `closed` = Ticket has been explicitly approved and completed.

The Agent MUST update GitHub Issue labels to reflect the current lifecycle state.

### When Starting a Ticket

When the Agent begins implementation of a Ticket:

1. Remove `ready`.
2. Remove `blocked` if it is still present and all dependencies are satisfied.
3. Apply `in progress`.

The actively implemented Ticket MUST have `in progress`.

The Agent MUST NOT leave an actively implemented Ticket labeled only `ready`.

### When Implementation Is Complete

After implementation and validation are complete:

1. Update the implementation CHANGELOG when required.
2. Update the Ticket GitHub Issue with a concise completion summary.
3. Remove `in progress`.
4. Apply `review`.
5. Stop and wait for project-owner approval.

The completed Ticket MUST remain open while it is in `review`.

### After Project-Owner Approval

When the project owner explicitly approves the current Ticket using:

* `approved`
* `approval`
* `done`

the Agent MUST:

1. Verify that the approved Ticket is the current Ticket awaiting review.
2. Remove `review`.
3. Close the approved Ticket GitHub Issue.
4. Identify the next Ticket in the same implementation area.
5. Check whether its dependencies are satisfied.

If the next Ticket has all dependencies completed:

1. Remove `blocked` if present.
2. Apply `ready`.
3. Begin implementation.
4. Remove `ready`.
5. Apply `in progress`.
6. Implement only that Ticket.
7. Validate it.
8. Update CHANGELOG when required.
9. Update the Ticket GitHub Issue.
10. Remove `in progress`.
11. Apply `review`.
12. Stop and wait for project-owner approval again.

If the next Ticket still has incomplete dependencies:

1. Keep `blocked`.
2. Do not apply `ready`.
3. Continue searching for the next executable Ticket in the same implementation area.

When another executable Ticket is found:

1. Remove `blocked` if present and its dependencies are satisfied.
2. Apply `ready`.
3. Begin implementation.
4. Continue using the same lifecycle.

If no executable Ticket exists, stop and report that there is no currently executable Ticket.

### Automatic State Progression

The Agent is responsible for automatically maintaining Ticket state.

The Agent MUST NOT wait for the project owner to manually apply `ready` when a Ticket is executable.

When a Ticket becomes executable because all dependencies are completed, the Agent MUST:

```text
blocked → ready
```

When the Agent starts that Ticket:

```text
ready → in progress
```

When implementation is complete:

```text
in progress → review
```

After explicit approval:

```text
review → closed
```

### Agent Execution

When instructed to execute the current Sprint, the Agent MUST:

1. Determine the current implementation area from the working directory and Ticket scope.
2. Read the current Sprint Issue.
3. Find the next executable Ticket in that implementation area.
4. A Ticket is executable only when:

   * it is open;
   * it is not blocked, or its dependencies are now satisfied;
   * all required dependencies are completed;
   * it belongs to the current implementation area.
5. If the Ticket is executable and lacks `ready`, apply `ready`.
6. Mark the Ticket `in progress`.
7. Read the Ticket and relevant project documentation.
8. Implement only that Ticket.
9. Validate the implementation.
10. Update the implementation CHANGELOG when required.
11. Update the Ticket GitHub Issue with the implementation result and validation.
12. Remove `in progress`.
13. Apply `review`.
14. Stop and wait for explicit project-owner approval.

The Agent MUST implement only one Ticket at a time.

The Agent MUST NOT start another Ticket while the current Ticket is in `review`.

### Approval Boundary

Human review is required after every completed Ticket.

Approval of the current Ticket means:

```text
review → closed
```

and authorizes the Agent to continue to the next executable Ticket.

The Agent MUST NOT interpret unrelated user messages as approval.

Approval applies only to the current Ticket awaiting review.

### Scope Protection

The Agent must never modify unrelated Issues.

The Agent must never close unrelated Issues.

The Agent must never silently change Ticket scope.

The Agent must never change dependencies unless explicitly authorized.

### Sprint Completion

The Sprint Issue should remain open while related Tickets are incomplete.

The Sprint Issue may be considered complete only after all related Tickets are closed, unless the project owner explicitly changes the rule.

---

After implementation:

Run the required validation.
Update the CHANGELOG when required.
Update the GitHub Ticket.
Apply the appropriate GitHub labels.
Propose a focused commit message.
Stop and wait for explicit human approval.

Do not implement another Ticket before approval.