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

Sprint and Ticket work is managed through GitHub Issues according to the repository-root AGENTS.md.

Do not use local `sprints/*.md` files as the source of work.

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
