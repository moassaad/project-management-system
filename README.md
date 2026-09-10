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
```

The backend is designed as a modular monolith.

The initial database strategy is:

```text
PostgreSQL
Testcontainers
```

Database and backend foundation work is introduced through the appropriate Sprints.

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

Tickets are execution units.

A typical workflow is:

```text
Client Requirement
        ↓
Sprint
        ↓
Tickets
        ↓
Dependencies
        ↓
Parallel Work
        ↓
Ticket 1
        ↓
Validation
        ↓
Review
        ↓
Ticket 2
        ↓
...
```

Independent Tickets may be executed in parallel when there are no blocking dependencies.

Each implementation maintains its own Sprint files and Changelog.

Examples:

```text
frontend-react/sprints/
backend-spring-boot/sprints/
```

and:

```text
frontend-react/CHANGELOG.md
backend-spring-boot/CHANGELOG.md
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

## Getting Started

The repository contains independent frontend and backend implementations.

### Frontend

```bash
cd frontend-react
npm install
npm run dev
```

Additional commands are documented inside:

```text
frontend-react/README.md
```

### Backend

```bash
cd backend-spring-boot
./mvnw spring-boot:run
```

Additional commands and backend prerequisites are documented inside:

```text
backend-spring-boot/README.md
```

The exact setup requirements may evolve as implementation Sprints are completed.

---

## Current Implementation Status

Current implementations:

```text
frontend-react
    React + TypeScript + Vite
    Initial Vite project created

backend-spring-boot
    Spring Boot + Java 21 + Maven
    Bootstrap pending
```

The project is developed incrementally according to:

```text
docs/roadmap/project-roadmap.md
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
