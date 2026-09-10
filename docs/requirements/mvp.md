# Project Management System

## 1. Requirements & Scope

### 1.1 Project Purpose

The Project Management System is a lightweight web application designed to help software teams manage projects and tasks.

The primary goal of this project is not to build a Jira replacement or a feature-heavy business product. The main goal is to provide a realistic application through which modern software engineering practices can be learned and applied, including:

* Clean and maintainable code
* Frontend architecture
* REST API integration
* Authentication and authorization
* Validation
* Testing
* Error handling
* Environment management
* Production-oriented development practices
* AI-assisted software development

The application should remain intentionally simple in business scope while allowing the technical architecture to be production-oriented.

---

### 1.2 Target Users

The system is intended for software team members who participate in one or more projects.

A user may be:

* A Project Owner
* A Project Member

A user can participate in multiple projects.

---

### 1.3 MVP Scope

The MVP consists of the following functional areas:

#### Authentication

* Login
* Logout
* Retrieve current authenticated user

Registration and password reset are outside the MVP.

#### Dashboard

The dashboard provides a lightweight overview of the user's work.

Initial dashboard information includes:

* My Projects
* My Tasks
* Basic project/task counts

The dashboard should remain simple and should not include advanced analytics.

#### Projects

Users should be able to:

* View projects available to them
* Create a project
* View project details
* Edit a project
* Delete a project

A project contains:

* Name
* Description
* Owner
* Members
* Tasks

#### Project Members

Project Owners should be able to:

* View project members
* Add existing users as project members
* Remove project members

The MVP does not include:

* Email invitations
* Invitation links
* Invitation workflow
* Team/organization management

The Project Owner is automatically added as a member when creating a project.

#### Tasks

Users with appropriate project permissions should be able to:

* View tasks
* Create tasks
* View task details
* Edit tasks
* Delete tasks

A task contains:

* Title
* Description
* Type
* Status
* Priority
* Assignee
* Due Date

Task types:

* Feature
* Bug
* Improvement

Task statuses:

* Todo
* In Progress
* Done

Task priorities:

* Low
* Medium
* High

The task list should support:

* Search
* Status filtering
* Type filtering
* Priority filtering

#### Comments

Project members should be able to:

* View task comments
* Add comments to tasks

Comment editing and deletion are outside the initial MVP unless added later.

---

### 1.4 Main Screens

The initial application should support the following routes/screens:

```text
/login
/dashboard
/projects
/projects/:projectId
/projects/:projectId/tasks/:taskId
```

Additional create/edit routes may be introduced during frontend architecture design. Create/edit functionality may also be implemented using modal or drawer patterns if that is a better UX decision.

---

### 1.5 Explicitly Out of Scope

The following features are intentionally excluded from the MVP:

* User registration
* Password reset
* Complex roles and permissions
* Sprints
* Epics
* Time tracking
* Notifications
* File attachments
* Reports
* Advanced analytics
* Real-time updates
* Invitations by email
* Organization/workspace management

These features must not be introduced by the AI Agent unless explicitly requested.

---

### 1.6 Non-Functional Goals

The system should be designed with the following qualities in mind:

* Maintainability
* Readability
* Testability
* Security
* Consistent error handling
* Clear separation of responsibilities
* Reusable components
* Predictable API integration
* Accessibility
* Scalability where reasonable
* Easy onboarding for another developer or AI Agent

The project should avoid unnecessary complexity and should not introduce technologies only because they are popular.

---

# 2. Business Rules

## 2.1 Authentication

1. Only authenticated users may access the internal application.
2. Unauthenticated users may access the login page.
3. Authentication is handled by the backend.
4. The backend is the final authority regarding authentication state.
5. The frontend may maintain authentication-related UI state, but must not be considered a security boundary.

---

## 2.2 Project Rules

1. A project has exactly one Project Owner.
2. The user who creates a project automatically becomes its Project Owner.
3. The Project Owner is also a project member.
4. The Project Owner cannot be removed from the project.
5. A Project Owner may edit the project.
6. A Project Owner may delete the project.
7. Deleting a project requires explicit confirmation from the user.
8. Deleting a project also deletes its associated tasks and comments according to the backend's persistence rules.
9. A user who is not a project member cannot access the project or its tasks.
10. A user may belong to multiple projects.

---

## 2.3 Project Member Rules

1. The Project Owner may add existing users to a project.
2. The Project Owner may remove project members.
3. A removed member immediately loses access to the project.
4. Removing a member does not delete their previously created tasks.
5. Tasks assigned to a removed member become Unassigned.
6. A project member may view the project and its tasks.
7. A project member may create tasks.
8. A project member may add comments.

---

## 2.4 Task Rules

1. Every task belongs to exactly one project.
2. Task Title is required.
3. Task Description is optional.
4. Task Type is optional unless future business rules require it.
5. Task Status defaults to `TODO` when not explicitly provided.
6. Task Priority defaults to `MEDIUM` when not explicitly provided.
7. A task may be unassigned.
8. If a task is assigned, its assignee must be a current member of the project.
9. The Project Owner may edit any task in the project.
10. The Project Owner may delete any task in the project.
11. The Task Assignee may edit their assigned task.
12. The Task Assignee may delete their assigned task.
13. Other project members may view the task and add comments but may not edit or delete it.
14. Backend authorization is the final authority for task permissions.

---

## 2.5 Comment Rules

1. A comment belongs to exactly one task.
2. Only project members may view or create comments for tasks in the project.
3. Any project member may add a comment.
4. Non-members cannot access task comments.
5. Comment content is required.
6. Comment editing/deletion is not part of the initial MVP.

---

## 2.6 Authorization Principle

The frontend may hide or disable actions based on known permissions to improve user experience.

However:

> Frontend authorization is not a security mechanism.

Every protected operation must be authorized by the backend.

For example, hiding the Delete button from a non-owner is useful for UX, but the backend must independently reject an unauthorized delete request.

---

# 3. System Architecture

## 3.1 Architectural Goal

The system should use a simple architecture that is easy to understand, maintain, test, and extend.

The initial architecture is:

```text
User
  |
  v
Frontend Application
(React + TypeScript + Vite)
  |
  | HTTPS / REST / JSON
  v
Backend API
  |
  v
Database
```

---

## 3.2 Repository Architecture

Multiple implementations will live in the same repository.

```text
project-management/
|
├── docs/
|
├── frontend-react/
├── frontend-vue/
├── frontend-angular/
|
├── backend-spring-boot/
├── backend-laravel/
|
└── README.md
```

Only implementations that are actually needed should be created.

The initial implementation is expected to be:

```text
frontend-react/
```

The backend framework will be selected separately during the Tech Stack phase.

---

## 3.3 Shared Documentation

The root `docs/` directory contains technology-independent project knowledge.

It should describe:

* Requirements
* Business Rules
* System Architecture
* API Contract

Shared documentation must not depend on a particular frontend or backend framework.

For example, business rules should not say:

> "Laravel should reject this request."

They should say:

> "The backend must reject unauthorized project deletion."

Framework-specific implementation details belong inside the respective implementation directory.

---

## 3.4 Responsibility Boundaries

### Frontend Responsibilities

The frontend is responsible for:

* User interface
* Routing
* Form interaction
* Client-side validation
* Loading states
* Error states
* API communication
* Presentation of server data
* Client-side UI state
* Accessibility
* User experience

The frontend must not be responsible for enforcing system security.

### Backend Responsibilities

The backend is responsible for:

* Authentication
* Authorization
* Business rules
* Server-side validation
* Data integrity
* Persistence
* API behavior
* Security
* Transactions where required
* Consistent error responses

### Database Responsibilities

The database is responsible for:

* Data persistence
* Relationships
* Appropriate constraints
* Referential integrity
* Indexing where required
* Efficient data retrieval

---

## 3.5 Backend Architecture Direction

The initial backend architecture should be a modular monolith rather than microservices.

```text
Frontend
   |
   v
Single Backend Application
   |
   v
Single Database
```

Microservices, distributed systems, message brokers, Kubernetes, service discovery, and similar infrastructure should not be introduced unless a real project requirement justifies them.

---

## 3.6 API Contract Principle

The API Contract is shared between frontend and backend implementations.

The API contract should be documented using OpenAPI.

The expected flow is:

```text
Requirements
     |
     v
Business Rules
     |
     v
API Design
     |
     v
OpenAPI Specification
     |
     +----------------------+
     |                      |
     v                      v
Frontend Implementations   Backend Implementations
```

The API Contract should be treated as the source of truth for:

* Endpoints
* Request structures
* Response structures
* Error structures
* Authentication requirements
* Query parameters
* Enums
* Pagination behavior

An AI Agent must not invent API endpoints or response structures when an official contract already exists.

---

# 4. API Design

## 4.1 API Style

The application will use:

```text
REST
JSON
HTTPS
OpenAPI
API Versioning
```

The API base path is:

```text
/api/v1
```

Example:

```text
/api/v1/projects
/api/v1/projects/{projectId}
```

---

## 4.2 Resource Naming

API resource names should:

* Be plural
* Use lowercase
* Use nouns rather than actions
* Use HTTP methods to describe the operation

Examples:

```text
/projects
/tasks
/comments
/members
```

The JSON naming convention is:

```text
camelCase
```

Example:

```json
{
  "projectId": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## 4.3 Authentication Endpoints

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

The API uses Bearer Token authentication.

Authenticated requests should use:

```http
Authorization: Bearer <access-token>
```

The exact access-token/refresh-token lifecycle remains an open authentication design decision and must be finalized before the authentication contract is considered complete.

---

## 4.4 Project Endpoints

```text
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/{projectId}
PATCH  /api/v1/projects/{projectId}
DELETE /api/v1/projects/{projectId}
```

Creating a project automatically makes the authenticated user its owner.

---

## 4.5 Project Member Endpoints

```text
GET    /api/v1/projects/{projectId}/members
POST   /api/v1/projects/{projectId}/members
DELETE /api/v1/projects/{projectId}/members/{userId}
```

Adding a member requires:

```text
user exists
+
current user has owner permissions
+
user is not already a member
```

---

## 4.6 Task Endpoints

```text
GET    /api/v1/projects/{projectId}/tasks
POST   /api/v1/projects/{projectId}/tasks

GET    /api/v1/projects/{projectId}/tasks/{taskId}
PATCH  /api/v1/projects/{projectId}/tasks/{taskId}
DELETE /api/v1/projects/{projectId}/tasks/{taskId}
```

A task may contain:

```json
{
  "title": "Implement login page",
  "description": "Create the login interface",
  "type": "FEATURE",
  "status": "TODO",
  "priority": "MEDIUM",
  "assigneeId": "uuid",
  "dueDate": "2026-09-20"
}
```

The following enums are defined by the contract:

```text
type:
FEATURE
BUG
IMPROVEMENT

status:
TODO
IN_PROGRESS
DONE

priority:
LOW
MEDIUM
HIGH
```

---

## 4.7 Task Filtering

Task collection endpoints should support query parameters rather than separate filtering endpoints.

Example:

```http
GET /api/v1/projects/{projectId}/tasks
```

Possible query parameters:

```text
search
status
type
priority
page
perPage
```

Example:

```http
GET /api/v1/projects/{projectId}/tasks?search=login&status=IN_PROGRESS&priority=HIGH&page=1&perPage=20
```

The exact filtering semantics will be finalized in the OpenAPI specification.

---

## 4.8 Comment Endpoints

```text
GET  /api/v1/projects/{projectId}/tasks/{taskId}/comments
POST /api/v1/projects/{projectId}/tasks/{taskId}/comments
```

Create comment:

```json
{
  "content": "The API integration is complete."
}
```

---

## 4.9 Pagination

Pagination is required for collection endpoints that may grow over time.

Initial pagination style:

```text
?page=1&perPage=20
```

Collection responses should include pagination metadata.

Example:

```json
{
  "data": [],
  "meta": {
    "currentPage": 1,
    "perPage": 20,
    "total": 100,
    "lastPage": 5
  }
}
```

The exact pagination behavior will be defined in the OpenAPI specification.

---

## 4.10 Resource Identifiers

Resources will use UUID identifiers.

Example:

```text
/api/v1/projects/550e8400-e29b-41d4-a716-446655440000
```

IDs exposed through the API must be represented consistently as strings.

---

## 4.11 Response Structure

The initial response convention is:

### Single Resource

```json
{
  "data": {
    "id": "uuid",
    "name": "Project A"
  }
}
```

### Resource Collection

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Project A"
    }
  ],
  "meta": {
    "currentPage": 1,
    "perPage": 20,
    "total": 1,
    "lastPage": 1
  }
}
```

The final response schemas will be defined in OpenAPI.

---

## 4.12 Error Response

The API should use a consistent error structure.

Example:

```json
{
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Project not found.",
    "details": null
  }
}
```

Validation errors may contain field-level details:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The given data is invalid.",
    "details": {
      "title": [
        "The title field is required."
      ]
    }
  }
}
```

The API should use standard HTTP status codes appropriately, including:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

The final list and semantics of errors will be defined in OpenAPI.

---

## 4.13 API Design Principles

The API should follow these principles:

1. Do not expose internal database implementation details unnecessarily.
2. Use consistent naming.
3. Use HTTP methods according to their intended semantics.
4. Keep response structures predictable.
5. Validate input on the backend.
6. Enforce authorization on the backend.
7. Use pagination for growing collections.
8. Use UUID identifiers.
9. Version the API.
10. Document the API through OpenAPI.
11. Avoid introducing custom endpoints when an existing REST resource design is sufficient.
12. Do not allow the AI Agent to invent or silently alter the API contract.

---

## 4.14 Open Decisions

The following decisions are intentionally not finalized yet:

### Authentication Token Lifecycle

The system currently uses Bearer Tokens, but the following remain to be decided:

* Access Token only
* Access Token + Refresh Token
* Token expiration policy
* Refresh behavior
* Token storage strategy on the frontend
* Logout and token invalidation behavior

These decisions must be finalized before implementation of authentication.

### Backend Framework

The backend framework remains undecided and will be finalized during the Tech Stack phase.

### Exact OpenAPI Schema

The detailed request/response schemas, reusable components, security schemes, and endpoint-level documentation will be finalized in:

```text
docs/api/openapi-v1.yaml
```

---

## 4.15 AI Agent Usage Rule

Before implementing a feature, the AI Agent must read the relevant project documentation.

At minimum:

```text
docs/requirements/
docs/business-rules/
docs/architecture/
docs/api/
```

The AI Agent must:

1. Understand the existing requirements.
2. Respect the business rules.
3. Follow the architecture.
4. Follow the API Contract.
5. Avoid introducing unnecessary technologies.
6. Avoid changing established architectural decisions without approval.
7. Identify important missing decisions instead of silently guessing.
8. Report assumptions when an implementation detail is genuinely unspecified.

The AI Agent is an implementation and review assistant.

The final architectural and product decisions remain controlled by the project owner.
