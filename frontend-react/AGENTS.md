# Frontend React Agent Rules

## 1. Scope

These instructions apply specifically to the React frontend implementation.

Global repository rules are defined in:

```text
../AGENTS.md
```

Shared project requirements and decisions are documented under:

```text
../docs/
```

---

## 2. Technology

The frontend uses:

* React
* TypeScript
* Vite
* React Router
* TanStack Query
* Zustand
* React Hook Form
* Zod
* Vitest
* React Testing Library
* MSW

Use these technologies according to their documented responsibilities.

Do not introduce replacements without approval.

---

## 3. Architecture

The frontend uses Feature-Based Architecture.

Main structure:

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

Business features belong under:

```text
src/features/
```

Application infrastructure belongs under:

```text
src/app/
src/lib/
```

Reusable UI belongs under:

```text
src/components/
```

---

## 4. State Management

Use:

```text
Server State
→ TanStack Query

Local UI State
→ React State

Shared Client State
→ Zustand
```

Do not put server-owned API data into Zustand without a documented reason.

Do not use Zustand for state that can remain local.

---

## 5. API Communication

React components must not call the backend directly.

Use:

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

Feature-specific API operations belong inside the relevant feature.

Common HTTP infrastructure belongs under:

```text
src/lib/http/
```

---

## 6. Routing

Use the centralized React Router configuration under:

```text
src/app/router/
```

Routes should be classified as:

* Public
* Protected

Frontend route protection is for navigation and UX.

Backend authorization remains authoritative.

---

## 7. Forms and Validation

Use:

* React Hook Form
* Zod

Form schemas should represent UI/use-case requirements.

Do not automatically reuse API schemas as form schemas.

Backend validation remains authoritative.

---

## 8. Component Design

Prefer focused and readable components.

Avoid putting:

* API calls
* Large business logic
* Complex state management

directly inside JSX components.

Reuse existing components and patterns before creating new ones.

---

## 9. Testing

Use:

* Vitest
* React Testing Library
* MSW

Test observable behavior and user outcomes.

Do not make tests depend unnecessarily on implementation details.

---

## 10. Implementation Rule

Keep every Ticket focused.

Do not refactor unrelated frontend code during feature work.

Do not create new architecture layers without an actual requirement.

The frontend must remain runnable after every completed Ticket.

---

## Existing Project Preservation

The `frontend-react/` implementation has already been initialized using Vite with React and TypeScript.

The Agent must inspect the existing project before making changes.

The Agent must preserve the existing project structure and configuration when they already satisfy the current requirements.

The Agent must not recreate, reinitialize, or overwrite the frontend project from scratch.

When additional dependencies are required, the Agent should add only the required dependencies and keep the existing tooling intact unless a documented change is necessary.

Before modifying existing configuration, the Agent must determine whether the current configuration already satisfies the requirement.

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

Execute the current Sprint one Ticket at a time.

Follow AGENTS.md.

For each Ticket:
- implement it
- validate it
- update CHANGELOG when required
- report the result

Stop after each completed Ticket and wait for my approval before continuing.

---

# Frontend React Agent Instructions

## Repository Context

Current implementation directory:
`frontend-react/`

Repository root:
`..`

Before any task, read the global instructions:

`../AGENTS.md`

Shared project documentation is located at:

`../docs/`

Do not assume the current directory contains all project-level instructions.

Global repository instructions are defined in the repository-root AGENTS.md.
OpenCode automatically discovers applicable AGENTS.md files from the current directory toward the project root.

Read:
./AGENTS.md
../AGENTS.md
../docs/project-context.md

