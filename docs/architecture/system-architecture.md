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

## Frontend Architecture Strategy

The React frontend uses Feature-Based Architecture as its primary organizational pattern.

The purpose of this architecture is to keep business features cohesive, reduce unnecessary coupling, and make the application easier to maintain, test, and extend.

### Main Structure

The frontend should organize application code primarily around business features.

Conceptually:

```text
src/
├── app/
├── features/
├── components/
├── lib/
├── config/
└── ...
```

The `features/` directory contains business-specific modules such as:

```text
features/
├── auth/
├── projects/
├── tasks/
└── comments/
```

Each feature should contain the code that primarily belongs to that feature.

Example:

```text
features/tasks/
├── api/
├── components/
├── hooks/
├── pages/
├── schemas/
├── types/
└── ...
```

The exact contents of each feature may vary according to the feature's actual requirements.

### Shared Code

Code that is genuinely reusable across multiple features should be placed in shared areas such as:

```text
components/
lib/
config/
```

Shared modules must not depend on a specific business feature.

For example:

```text
features/tasks  → components/ui     Allowed
features/tasks  → lib/http          Allowed
features/tasks  → config             Allowed
components/ui   → features/tasks     Not Allowed
lib/http        → features/tasks     Not Allowed
```

### Feature Dependencies

Dependencies between features should be minimized.

A feature may depend on another feature only when there is a clear architectural reason.

Circular dependencies between features are prohibited.

The following pattern should be avoided:

```text
features/tasks
      ↓
features/projects
      ↓
features/tasks
```

Features should communicate through stable shared abstractions or application-level mechanisms when direct coupling is unnecessary.

### Separation of Concerns

Feature modules should not become monolithic folders containing unrelated responsibilities.

The architecture should maintain clear boundaries between:

* UI
* API communication
* Server state
* Forms
* Validation
* Domain-specific types
* Feature-specific logic

Business logic should not be embedded directly inside large JSX components when it can be expressed independently and tested.

### AI Agent Rule

The AI Agent must follow the established feature boundaries.

The Agent must:

1. Identify the affected feature before modifying code.
2. Prefer existing shared abstractions before creating new ones.
3. Avoid moving feature code into shared directories without justification.
4. Avoid introducing dependencies between features unnecessarily.
5. Avoid circular dependencies.
6. Report any architectural conflict instead of silently bypassing established boundaries.

Any significant architectural change requires explicit approval.

--- 

## Frontend API Layer Strategy

The frontend separates feature-specific API operations from shared HTTP infrastructure.

The expected dependency flow is:

```text id="l1m3wo"
UI Component
    ↓
Feature Hook / Feature Logic
    ↓
Feature API Layer
    ↓
Shared HTTP Infrastructure
    ↓
Backend API
```

### Feature API Layer

Each business feature may define its API operations inside its feature directory.

Example:

```text id="5il9iy"
features/
└── tasks/
    └── api/
        └── tasks.api.ts
```

The feature API layer is responsible for:

* Defining feature-specific API operations
* Passing feature-specific request data
* Mapping feature-specific API operations to the shared HTTP client
* Keeping API details close to the relevant feature

### Shared HTTP Infrastructure

Common HTTP concerns belong in a shared infrastructure layer.

Example:

```text id="w4d9ww"
lib/
└── http/
```

The shared HTTP infrastructure may be responsible for:

* Base API URL
* HTTP request configuration
* Common headers
* Authentication header handling
* Common response processing
* Common HTTP error handling
* Request/response infrastructure
* Integration with the authentication lifecycle

It must not contain business-specific operations such as:

```text
createProject()
updateTask()
addComment()
```

Those operations belong to their respective feature API layers.

### Component Rule

React components must not directly perform HTTP requests.

Avoid:

```text id="6y9x1w"
Component
   ↓
fetch()
```

and:

```text id="b5j0o1"
Component
   ↓
axios.get(...)
```

Prefer:

```text id="2a1v0q"
Component
   ↓
Hook / Feature Logic
   ↓
Feature API
   ↓
HTTP Infrastructure
```

### Dependency Direction

The dependency direction should remain from higher-level feature behavior toward lower-level shared infrastructure.

Shared infrastructure must not depend on business features.

For example:

```text id="r3vj1z"
features/tasks/api
        ↓
lib/http
```

is allowed.

The reverse dependency:

```text id="cm6p8u"
lib/http
        ↓
features/tasks/api
```

is prohibited.

### AI Agent Rule

When implementing API-related functionality, the AI Agent must first determine whether the operation belongs to a specific feature.

Feature-specific API operations must be implemented inside the relevant feature API layer.

Common HTTP behavior must be implemented in the shared HTTP infrastructure.

The Agent must not bypass these layers by placing direct HTTP requests inside UI components.

---

## Frontend State Management Strategy

The frontend distinguishes between Server State, Local UI State, and Shared Client State.

### Server State

Data retrieved from or synchronized with the backend is considered Server State.

Server State should be managed using TanStack Query.

Examples include:

* Projects
* Tasks
* Comments
* Current user data
* Other backend resources

Server State should not be duplicated in Zustand unless a specific architectural decision justifies the duplication.

### Local UI State

State that is local to a component or a small UI subtree should use React's built-in state mechanisms such as:

```text
useState
useReducer
```

Examples include:

* Modal visibility
* Dropdown state
* Temporary UI values
* Local interaction state

A global state library must not be used for state that can remain local to a component.

### Shared Client State

State that is client-owned and genuinely needs to be shared across unrelated components or features may be managed using Zustand.

Examples may include:

* Global UI preferences
* Cross-feature client state
* Authentication-related client state that does not represent server-owned resource data

### State Ownership Rule

Every piece of state must have a clear owner.

Before introducing Zustand, the developer or AI Agent should determine whether the state is:

1. Server State
2. Local UI State
3. Shared Client State

The selected state-management mechanism must match the ownership of the state.

### Anti-Duplication Rule

The same server-owned data should not be maintained independently in multiple state-management systems without a documented reason.

For example, a list of Tasks returned by the API should normally remain in TanStack Query rather than being copied into Zustand.

### AI Agent Rule

The AI Agent must not automatically place new state into Zustand.

Before adding global client state, the Agent must determine whether:

* React local state is sufficient, or
* The state is server-owned and belongs to TanStack Query, or
* The state genuinely needs cross-component or cross-feature client ownership.

The Agent should prefer the simplest appropriate state-management mechanism.

---

## Frontend Forms and Validation Strategy

The frontend uses React Hook Form for form state and form lifecycle management.

Zod is used for client-side schema validation.

The expected flow is:

```text id="c4ut1w"
User Input
    ↓
React Hook Form
    ↓
Zod Validation
    ↓
Feature Logic
    ↓
Feature API Layer
    ↓
Backend API
```

### Form Schemas

Form validation schemas should represent the requirements of the specific UI form or use case.

Examples include:

```text id="i2v92y"
CreateProjectFormSchema
UpdateProjectFormSchema
CreateTaskFormSchema
UpdateTaskFormSchema
LoginFormSchema
```

The frontend must not assume that a form schema is identical to the backend API schema.

A UI form may:

* combine multiple fields
* omit server-managed fields
* transform values before submission
* apply UI-specific validation rules

### API Contract

The backend API contract is defined through the generated OpenAPI specification.

API request and response types should be derived from or aligned with the OpenAPI contract rather than independently invented by the frontend.

### Validation Responsibilities

Client-side validation provides immediate feedback and improves user experience.

Backend validation remains authoritative.

A request that passes client-side validation may still be rejected by the backend.

The frontend must correctly handle server-side validation errors returned through the API error contract.

### Schema Separation

Form schemas and API schemas should remain conceptually separate unless they are genuinely identical and reusing the same representation does not introduce coupling.

The project should prefer clear boundaries over unnecessary schema reuse.

### AI Agent Rule

The AI Agent must not automatically reuse API schemas as form schemas.

Before reusing a schema, the Agent must determine whether the two schemas represent the same responsibility.

When the representations differ, separate schemas should be created.

---

## Frontend Routing Strategy

The React frontend uses React Router for application routing.

Routing configuration is centralized under the application layer rather than being distributed across individual business features.

Recommended conceptual structure:

```text
src/
└── app/
    └── router/
        ├── index.tsx
        ├── protected-route.tsx
        └── public-route.tsx
```

### Route Categories

Application routes are classified as either:

* Public routes
* Protected routes

Example:

```text
/login                    → Public

/dashboard                → Protected
/projects                 → Protected
/projects/:projectId      → Protected
/projects/:projectId/tasks/:taskId → Protected
```

### Protected Routes

Protected routes require an authenticated frontend session.

Conceptually:

```text
Protected Route
      ↓
Authenticated?
   ├── Yes → Render route
   └── No  → Navigate to /login
```

Frontend route protection exists for navigation and user experience.

It is not a security boundary.

The backend must independently authenticate and authorize every protected API operation.

### Public Routes

Public routes are accessible without authentication.

Authenticated users attempting to access routes such as `/login` may be redirected according to the application's authentication UX.

### Centralized Routing

Route definitions should remain centralized and predictable.

Business features may provide pages and feature components, but they should not independently control global application routing rules.

For example:

```text
app/router/
    ↓
features/projects/pages/
```

is preferred over allowing each feature to independently register routes in unrelated locations.

### AI Agent Rule

The AI Agent must use the existing routing configuration when adding or modifying routes.

The Agent must:

1. Classify the route as public or protected.
2. Place route configuration in the centralized router.
3. Reuse existing route guards/boundaries.
4. Avoid creating duplicate routing mechanisms.
5. Avoid implementing authorization logic inside route components.
6. Remember that backend authorization remains authoritative.

---

## Application Providers Strategy

Global application providers are centralized under:

```text id="9azvxm"
src/app/providers/
```

Providers should be initialized at the application boundary and should not be distributed arbitrarily across business features.

Conceptually:

```text id="fc5o9m"
main.tsx
   ↓
AppProviders
   ├── QueryClientProvider
   └── Other Global Providers
           ↓
          App
           ↓
         Router
```

### Provider Responsibilities

Application providers are responsible for initializing infrastructure that must be available across the application.

Examples may include:

* TanStack Query provider
* Global application configuration
* Other genuinely global providers

Feature-specific state or behavior should remain inside the appropriate feature unless it genuinely needs application-wide scope.

### Provider Rules

1. Global providers must be registered through the application provider layer.
2. Providers must not be unnecessarily duplicated.
3. Features should not create application-wide providers without architectural justification.
4. Provider ordering must be intentional when one provider depends on another.
5. The application entry point should remain simple and delegate provider composition to the application layer.

### AI Agent Rule

When a new global provider is required, the AI Agent must place it within the existing application provider structure.

The Agent must not wrap individual feature components with global providers unless there is a documented reason.

Before introducing a new provider, the Agent should verify whether an existing provider or application mechanism already solves the requirement.

---

## Frontend Architecture Summary

The React frontend follows a conventional Feature-Based Architecture.

The architecture intentionally prefers established React patterns and mature libraries over custom abstractions.

Core decisions:

* React Router for routing
* TanStack Query for server state
* Zustand for shared client state
* React state for local UI state
* React Hook Form for form management
* Zod for client-side validation
* Feature API modules for feature-specific API operations
* Shared HTTP infrastructure for common HTTP concerns
* Centralized application providers
* Centralized application routing

New abstractions should only be introduced when an actual repeated problem justifies them.

The AI Agent should prefer existing project patterns and established library capabilities before creating custom infrastructure.

---

## Frontend Project Structure

The React implementation uses the following high-level structure:

```text
frontend-react/
├── .ai/
├── public/
├── src/
│   ├── app/
│   ├── features/
│   ├── components/
│   ├── lib/
│   ├── config/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   ├── styles/
│   └── main.tsx
├── tests/
├── .env.example
├── package.json
└── README.md
```

The structure should remain simple and evolve only when justified by actual project needs.

Business features belong under `src/features/`.

Application-wide infrastructure belongs under `src/app/` and `src/lib/`.

Reusable UI belongs under `src/components/`.

Configuration belongs under `src/config/`.

The project must avoid creating directories solely for organizational appearance.

---

## Frontend Environment Strategy

The frontend uses Vite environment modes:

* development
* staging
* production

API configuration must be provided through Vite environment variables.

Example:

```text
VITE_API_URL
```

Frontend environment variables are considered public configuration.

Secrets and credentials must never be stored in frontend environment variables because Vite variables are exposed to the client application.

Environment-specific configuration should be kept separate from source code where appropriate.

A committed `.env.example` file should document required variables without containing secrets.

---


