# Project Management System

A lightweight project management system for software teams.

The main goal of this project is to learn and practice modern software engineering practices through a realistic but intentionally simple application.

The project focuses on:

* Maintainable architecture
* Clean and readable code
* REST API design
* Authentication and authorization
* Testing
* Environment management
* Production-oriented development
* AI-assisted software development

The business domain is intentionally kept simple so the technical practices remain the main focus.

---

## Repository Structure

This repository contains shared project documentation and multiple possible implementations.

```text
project-management-system/
│
├── AGENTS.md
├── README.md
│
├── docs/
│   ├── project-context.md
│   ├── requirements/
│   ├── business-rules/
│   ├── architecture/
│   ├── api/
│   └── roadmap/
│
├── frontend-react/
│   ├── AGENTS.md
│   ├── sprints/
│   ├── CHANGELOG.md
│   └── ...
│
└── backend-spring-boot/
    ├── AGENTS.md
    ├── sprints/
    ├── CHANGELOG.md
    └── ...
```

Future implementations may be added without changing the shared project requirements.

Examples:

```text
frontend-vue/
frontend-angular/
backend-laravel/
```

---

## Project Architecture

The system follows a simple client-server architecture:

```text
User
  │
  ▼
Frontend
  │
  │ HTTPS / REST / JSON
  ▼
Backend API
  │
  ▼
Database
```

The backend is responsible for authentication, authorization, validation, business rules, and data integrity.

The frontend is responsible for user experience, routing, forms, presentation, client-side validation, and API interaction.

Frontend checks are not considered a security boundary.

---

## API

The API follows:

* REST
* JSON
* HTTPS
* API versioning
* UUID identifiers
* Pagination
* RFC 9457 Problem Details

Base path:

```text
/api/v1
```

HTTP conventions:

```text
POST    Create
GET     Read
PUT     Full Update
PATCH   Partial Update
DELETE  Delete
```

The OpenAPI specification is generated from the backend implementation rather than maintained manually.

---

## Authentication

The application uses:

```text
Access Token + Refresh Token
```

Authentication strategy:

```text
Access Token
→ Bearer Token
→ Frontend Memory

Refresh Token
→ HttpOnly + Secure Cookie
→ Refresh Token Rotation
```

The backend remains the final authority for authentication and authorization.

---

## MVP Features

The MVP includes:

### Authentication

* Login
* Logout
* Current authenticated user

### Dashboard

* My Projects
* My Tasks
* Basic counts

### Projects

* List
* Create
* View
* Edit
* Delete

### Project Members

* List members
* Add existing users
* Remove members

### Tasks

* List
* Create
* View
* Edit
* Delete
* Status
* Priority
* Type
* Assignee
* Due Date
* Search
* Filtering

### Comments

* List
* Add comment

---

## Frontend Implementation

The initial frontend implementation is:

```text
React
TypeScript
Vite
npm
```

The frontend uses Feature-Based Architecture.

Core frontend technologies include:

```text
React Router
TanStack Query
Zustand
React Hook Form
Zod
Vitest
React Testing Library
MSW
```

These technologies are introduced as needed during the appropriate implementation Sprints.

---

## Backend Implementation

The initial backend implementation is:

```text
Spring Boot 4.1.1
Java 21 LTS
Maven
PostgreSQL 16 + H2 (profiles)
Flyway migrations
```

The backend is a modular monolith (`Controller → Service → Repository`).

Database strategy is environment-driven:

```text
PostgreSQL 16 (production, docker-compose.yml + Testcontainers for tests)
H2 in-memory (local dev without Docker: profiles h2 / test)
```

```text
V1__baseline (BaseEntity UUID) → V2 users/refresh_tokens → V3 projects/project_members → V4 tasks → V5 comments
```

All domain work is delivered through Sprints 002-015 (see `docs/roadmap/project-roadmap.md`).

---

## Documentation

Shared project knowledge is stored under:

```text
docs/
```

Important documentation:

```text
docs/project-context.md
```

High-level product requirements:

```text
docs/requirements/
```

Business rules:

```text
docs/business-rules/
```

Architecture decisions:

```text
docs/architecture/
```

API design and contract documentation:

```text
docs/api/
```

Implementation roadmap:

```text
docs/roadmap/
```

---

## AI-Assisted Development

AI Agents are used as implementation and review assistants.

The repository uses:

```text
AGENTS.md
```

for general Agent instructions.

Each implementation may provide additional instructions through its own `AGENTS.md`.

The Agent follows an incremental workflow:

```text
Requirement
    ↓
Sprint Planning
    ↓
Tickets
    ↓
Ticket Implementation
    ↓
Validation
    ↓
Review
    ↓
Next Ticket
```

The Agent should:

* Make small focused changes
* Avoid unrelated modifications
* Reuse existing project patterns
* Run relevant validation
* Report changed files
* Explain relevant changes
* Update the implementation CHANGELOG when required
* Ask before making important unresolved decisions

---

## Sprint and Ticket Workflow

Sprints are planning units.

Tickets are execution units (GitHub Issues are the source of truth — no local `sprints/*.md` duplicate, per `AGENTS.md`).

A typical workflow is:

```text
Client Requirement
        ↓
Sprint (GitHub Issue, label sprint)
        ↓
Tickets (GitHub Issues, label ticket, blocked/ready/in progress/review/closed)
        ↓
Dependencies
        ↓
Parallel Work
        ↓
Ticket 1 → Validation → Review → Ticket 2 …
```

Independent Tickets may be executed in parallel when there are no blocking dependencies.

Each implementation maintains its own Changelog (not Sprint markdown):

```text
frontend-react/CHANGELOG.md
backend-spring-boot/CHANGELOG.md
```

Roadmap:

```text
docs/roadmap/project-roadmap.md
```

---

## Development Principles

The project intentionally prefers simple, established solutions.

Key principles:

* Keep the architecture understandable.
* Prefer existing framework and library capabilities.
* Avoid unnecessary abstractions.
* Avoid unnecessary dependencies.
* Keep features cohesive.
* Keep changes small and reviewable.
* Keep the project runnable after every completed Ticket.
* Treat the backend as the final authority for security and business rules.
* Do not introduce major architectural changes without approval.

---

## Prerequisites

- **Node 20+** and **npm 10+** for `frontend-react/` (Vite / Vitest / MSW).
- **Java 21 LTS** (`Temurin 21.0.12.1` or similar) for `backend-spring-boot/` — host `java` is 17 on some machines, use ephemeral JDK at `/tmp/jdk21`:
  ```bash
  export JAVA_HOME=/tmp/jdk21
  export PATH=$JAVA_HOME/bin:$PATH
  java -version  # must report 21
  # or per-command: JAVA_HOME=/tmp/jdk21 ./mvnw ...
  # persistent: ln -s $HOME/.jdk21 /tmp/jdk21
  ```
- **Docker** (optional) for PostgreSQL 16 and Testcontainers — `backend` `verify` and `h2` profile run without Docker via H2.
- No local Maven required — use `./mvnw` wrapper.

## Environment Variables

All secrets are **env-only** — never committed (see `.gitignore`, `.env.example`).

**Frontend** (public, Vite inlines `VITE_*` at build — never put secrets here):

| Variable | Default / Example | Notes |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api/v1` | `frontend-react/.env.example` docs `config.apiUrl`; `DEV` fallback with `console.warn` + `^https?://` validation, prod set via `VITE_API_URL=https://api.example.com/api/v1 npm run build` |

**Backend** (read from `application.yml` `${VAR:default}`):

| Variable | Default | Required in prod |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/pms` | yes (e.g. `jdbc:postgresql://db:5432/pms`) |
| `SPRING_DATASOURCE_USERNAME` | `pms` | yes |
| `SPRING_DATASOURCE_PASSWORD` | `pms` | yes — must change from `pms` |
| `JWT_SECRET` | `dev-secret-…` (hard-coded dev fallback) | yes — `>=32B` (`openssl rand -base64 64`) |
| `SEED_USER_EMAIL` | — | yes (e.g. `admin@example.com`) |
| `SEED_USER_PASSWORD` | — | yes (strong, BCrypt-hashed) |
| `REFRESH_COOKIE_SECURE` | `true` | `true` in prod (`false` for local plain-HTTP via `application-h2.yml` / `application-dev.yml`) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | `https://app.example.com` (comma-separated) |
| `LOG_LEVEL` | `INFO` | `INFO` (`DEBUG` for verbose) |

See `docs/api/api-design.md` (Token Storage / Refresh Rotation / CORS) and `backend-spring-boot/README.md` → **Configuration** for details.

## Getting Started

### Frontend

```bash
cd frontend-react
npm install
# dev (VITE_API_URL defaults to http://localhost:8080/api/v1)
npm run dev              # http://localhost:5173
# build with explicit API URL
VITE_API_URL=https://api.example.com/api/v1 npm run build
npx vite preview         # serve dist/ (base /)
```

See `frontend-react/README.md` for prerequisites, `VITE_API_URL`, and test commands.

### Backend

```bash
cd backend-spring-boot
# H2 without Docker (recommended for local dev)
JAVA_HOME=/tmp/jdk21 ./mvnw spring-boot:run -Dspring-boot.run.profiles=h2
# with PostgreSQL (docker-compose.yml: postgres:16-alpine pms-db)
docker compose up -d pms-db
JAVA_HOME=/tmp/jdk21 ./mvnw spring-boot:run
# production (env as above, Flyway validate + baseline V1→V5)
export SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/pms
export SPRING_DATASOURCE_USERNAME=pms
export SPRING_DATASOURCE_PASSWORD=secret
export JWT_SECRET="$(openssl rand -base64 64)"
export REFRESH_COOKIE_SECURE=true
export CORS_ALLOWED_ORIGINS=https://app.example.com
export SEED_USER_EMAIL=admin@example.com
export SEED_USER_PASSWORD=strong-password
JAVA_HOME=/tmp/jdk21 ./mvnw spring-boot:run
```

Health check (public, no auth — readiness/liveness probe):

```bash
curl http://localhost:8080/api/v1/health
# {"data":{"status":"UP"}}
```

Additional backend run options and `application.yml` profiles (`h2`/`dev`/`test`) are documented in `backend-spring-boot/README.md` → **How to Run** / **Configuration**.

## How to Test

**Frontend** (`frontend-react/` — Vitest + RTL + MSW, 35 files 175+ tests):

```bash
cd frontend-react
npm run test            # vitest --run 35 files 175+ passed
npm run test -- src/features/tasks/api/tasks.api.test.ts  # single suite
npx tsc -b && npm run lint  # type + lint green
```

**Backend** (`backend-spring-boot/` — JUnit 5 + MockMvc + H2 + Testcontainers, 144 tests):

```bash
cd backend-spring-boot
JAVA_HOME=/tmp/jdk21 ./mvnw verify -o -B          # offline: H2, no Docker needed (repackage + 144 PASS, 4 skipped without Docker)
JAVA_HOME=/tmp/jdk21 ./mvnw verify -B             # full: Testcontainers postgres:16-alpine if Docker available (SmokeIT)
JAVA_HOME=/tmp/jdk21 ./mvnw test -Dtest=TaskControllerTest   # single suite (any *Test class)
```

Expected: `Tests run: 144, Failures: 0, Errors: 0, Skipped: 4` + `BUILD SUCCESS` and `frontend` `35 passed`.

## Known Limitations (MVP)

- **Auth:** No registration endpoint — seed user via `SEED_USER_EMAIL/PASSWORD` + `POST /auth/login`; no password reset; Access `15m` / Refresh `7d` single-use `jti` rotation.
- **Projects:** Paginated `page/perPage` scoped to membership; `GET /projects` client `5*20 ≈100` then truncation notice (`failedProjectIds`/`truncated`) — no org/team hierarchy.
- **Tasks:** `3*20` tasks per project truncation client-side; search case-insensitive `LIKE` without FTS; no real-time/websocket, no bulk ops, no attachments.
- **Comments:** List/create only, no edit/delete, ordered by `createdAt`.
- **Frontend:** No APM/analytics, `VITE_API_URL` public, refresh via `HttpOnly Secure SameSite=Strict` `withCredentials:true`; no offline support; validation 255 chars, `dueDate` ISO `YYYY-MM-DD`.
- **Backend:** No rate limiting, no Actuator/APM beyond `GET /health` + stdout logs `LOG_LEVEL`; Flyway `validate` only, no down migrations; CORS fixed `http://localhost:5173` + `CORS_ALLOWED_ORIGINS` env.

---

## Current Implementation Status

All Sprints **001 → 015** are implemented and verified (see `docs/roadmap/project-roadmap.md` and `CHANGELOG`s):

```text
frontend-react:      React + TypeScript + Vite + React Router + TanStack Query + Zustand + RHF + Zod + Vitest/RTL/MSW
                     Feature-Based Architecture (src/app, src/features/*, src/lib/http, src/components/ui, src/config)
                     Auth (login/refresh rotation/Bootstrap), Projects/Members/Tasks/Comments, Dashboard, search/filter,
                     validation 255 + RFC9457 errors, loading/empty/error + retry, 35 files 175 tests, Vite build 545.96 kB

backend-spring-boot: Spring Boot 4.1.1 + Java 21 + Maven + PostgreSQL/H2 + Flyway + JPA + Validation + RFC9457
                     Auth (JWT access 15m / refresh 7d rotation jti, HttpOnly Secure SameSite Strict, SeedUser),
                     Projects/Members/Tasks/Comments CRUD + authorization (owner/member/assignee),
                     search/filter, pagination, OpenAPI generated (docs/api/openapi-v1.yaml), 144 tests verify green

shared docs:         docs/project-context, mvp, business-rules, architecture, api-design, openapi-v1.yaml, roadmap — consistent (DOC-S015-01)

run/test/cleanup:    README/CHANGELOG per implementation, known limitations, no TODO/secrets, tsc/lint/build/verify green (DOC-S015-02)
```

See:

```text
frontend-react/CHANGELOG.md
backend-spring-boot/CHANGELOG.md
```

---

## Contributing

Changes should follow the project's documented architecture and development rules.

Before implementing work:

1. Read the relevant `AGENTS.md`.
2. Read the relevant project documentation.
3. Work within the current Sprint and Ticket scope.
4. Run the required validation.
5. Review the changed files.
6. Update the implementation Changelog when required.

---

## Project Goal

This project is primarily a learning and engineering exercise.

The goal is not to maximize the number of features or technologies.

The goal is to build a small, realistic system while practicing:

```text
Requirements
   ↓
Architecture
   ↓
Implementation
   ↓
Testing
   ↓
Review
   ↓
Refactoring
   ↓
Production
```

with AI assisting the development process without replacing engineering decisions.
