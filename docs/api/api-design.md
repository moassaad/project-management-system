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


## Authentication Lifecycle

The API uses Bearer Token authentication.

Authenticated requests must include:

```http
Authorization: Bearer <access-token>
```

The authentication lifecycle consists of login, authenticated requests, token expiration, token refresh, and logout.

### Login

```http
POST /api/v1/auth/login
```

A successful login returns the authenticated user and the authentication credentials defined by the authentication contract.

### Access Token

The access token is used to authorize normal API requests.

The frontend must attach the access token to protected requests according to the API authentication contract.

### Refresh Token

The refresh-token strategy, expiration policy, storage mechanism, rotation policy, and invalidation behavior must be defined before authentication implementation begins.

### Logout

```http
POST /api/v1/auth/logout
```

Logout must invalidate authentication credentials according to the backend authentication strategy.

### Authentication Security Principle

Authentication behavior must be implemented by the backend and must not rely on frontend checks as a security boundary.

The frontend may manage authentication state for user experience, but the backend remains the final authority.


## Authentication Token Strategy

The API uses an Access Token + Refresh Token authentication model.

### Access Token

The Access Token is used to authenticate normal protected API requests.

Authenticated requests must include:

```http
Authorization: Bearer <access-token>
```

Access Tokens should have a relatively short lifetime to reduce the impact of token exposure.

### Refresh Token

The Refresh Token is used to obtain a new Access Token after the Access Token expires.

The Refresh Token must not be used as a replacement for the Access Token when accessing normal protected API resources.

A dedicated refresh endpoint will be provided:

```http
POST /api/v1/auth/refresh
```

A successful refresh operation returns a new valid Access Token according to the defined token lifecycle.

### Authentication Flow

```text
Login
  |
  +--> Access Token
  |
  +--> Refresh Token
          |
          v
     Normal API Requests
          |
          v
   Access Token Expires
          |
          v
   POST /auth/refresh
          |
          v
   New Access Token
          |
          v
   Continue API Requests
```

### Logout

The client uses:

```http
POST /api/v1/auth/logout
```

Logout must invalidate the authentication credentials according to the backend authentication implementation.

### Token Rotation and Invalidation

The exact refresh-token rotation, expiration, storage, and invalidation policies must be defined during the authentication implementation design.

These policies must prioritize security and prevent reuse of invalidated refresh tokens.

### Frontend Security Principle

The frontend must treat authentication credentials as security-sensitive data.

The frontend must not assume that possessing an Access Token grants permanent access.

A `401 Unauthorized` response must be handled as an authentication state transition and may trigger the refresh-token flow according to the authentication implementation.

The backend remains the final authority for authentication and authorization.


## Token Storage Strategy

The application uses the following token storage strategy:

### Access Token

The Access Token is maintained in frontend application memory.

It must not be persisted in:

* localStorage
* sessionStorage
* browser persistent storage

The Access Token is sent with protected API requests using:

```http
Authorization: Bearer <access-token>
```

Because the Access Token exists only in memory, it is lost when the application is fully reloaded or the browser context is closed. The frontend must use the Refresh Token flow to obtain a new Access Token when appropriate.

### Refresh Token

The Refresh Token is stored by the backend in a:

* HttpOnly cookie
* Secure cookie
* appropriately configured SameSite cookie

The Refresh Token must not be directly accessible through JavaScript.

The frontend must not read, manipulate, or persist the Refresh Token.

### Security Principle

Authentication credentials must follow the principle of least exposure.

The Access Token should have a shorter lifetime, while the Refresh Token provides controlled session continuity.

The backend remains responsible for validating, rotating, expiring, and invalidating Refresh Tokens.

### CSRF and CORS

Because the Refresh Token is transmitted using a cookie, the authentication implementation must explicitly address:

* CSRF protection
* CORS configuration
* SameSite cookie policy
* Secure cookie configuration
* Allowed origins

These settings must be defined consistently between the frontend and backend implementations.

### Refresh Flow

```text
Application Starts
      |
      v
No Access Token in Memory
      |
      v
POST /api/v1/auth/refresh
      |
      | Refresh Token sent automatically by browser cookie
      v
Backend validates Refresh Token
      |
      v
New Access Token
      |
      v
Store Access Token in Frontend Memory
      |
      v
Normal API Requests
```

The frontend must never attempt to obtain the Refresh Token value from the cookie.

## Refresh Token Rotation Strategy

The application uses Refresh Token Rotation.

Each successful refresh operation issues:

* A new Access Token
* A new Refresh Token

The previously used Refresh Token is invalidated and must no longer be accepted.

### Refresh Flow

```text
Refresh Token A
      |
      v
POST /api/v1/auth/refresh
      |
      v
Backend validates Token A
      |
      +----> Token A invalidated
      |
      +----> New Access Token
      |
      +----> Refresh Token B
```

The browser receives the new Refresh Token through the configured HttpOnly, Secure cookie.

The frontend receives the new Access Token and stores it in application memory.

### Security Requirements

The backend must ensure that:

1. A refresh token can only be used according to its validity period.
2. A successfully used refresh token cannot be reused after rotation.
3. Invalid, expired, revoked, or previously rotated refresh tokens are rejected.
4. Refresh-token reuse should be detectable and handled according to the backend security policy.
5. Refresh tokens must not be exposed to frontend JavaScript.

### Token Chain

Refresh tokens are treated as part of a rotating token chain.

```text
Refresh Token A
      |
      v
Refresh
      |
      +--> Access Token B
      +--> Refresh Token B
                    |
                    v
                 Refresh
                    |
                    +--> Access Token C
                    +--> Refresh Token C
```

A previous token in the chain must not remain valid after successful rotation.

### Failure Handling

If the Refresh Token is invalid, expired, revoked, or reused, the backend must reject the refresh request.

The frontend should treat this as an expired authentication session and transition the user to the appropriate unauthenticated state.

The exact HTTP response and error code will be defined in the OpenAPI specification.

## HTTP Method Convention

The API follows a consistent RESTful HTTP method convention.

### POST — Create

`POST` is used to create a new resource.

Example:

```http
POST /api/v1/projects
POST /api/v1/projects/{projectId}/tasks
```

### GET — Read

`GET` is used to retrieve resources.

Example:

```http
GET /api/v1/projects
GET /api/v1/projects/{projectId}
```

### PUT — Full Update

`PUT` is used when the client provides the complete representation of the resource to replace the existing representation.

Example:

```http
PUT /api/v1/projects/{projectId}
```

A `PUT` request should contain all fields required for the complete resource representation.

### PATCH — Partial Update

`PATCH` is used when only specific fields of a resource need to be changed.

Example:

```http
PATCH /api/v1/projects/{projectId}
```

Request:

```json
{
  "name": "Updated Project Name"
}
```

Another example:

```json
{
  "status": "DONE"
}
```

### DELETE — Delete

`DELETE` is used to remove a resource.

Example:

```http
DELETE /api/v1/projects/{projectId}
DELETE /api/v1/projects/{projectId}/tasks/{taskId}
```

### Consistency Rule

The same HTTP method semantics must be followed across all backend implementations.

The AI Agent must not use `PUT` and `PATCH` interchangeably.

When introducing a new endpoint, the implementation must follow the established HTTP method convention unless a documented architectural decision explicitly requires otherwise.

## API Error Handling

The API uses RFC 9457 Problem Details for HTTP APIs as the standard format for error responses.

Error responses serialized as JSON should use:

```http
Content-Type: application/problem+json
```

The API must use standard HTTP status codes to communicate the general category of the error, while the Problem Details body provides machine-readable and human-readable information.

### Standard Problem Details

The API may use the standard RFC 9457 members:

```json
{
  "type": "https://api.example.com/problems/resource-not-found",
  "title": "Resource not found",
  "status": 404,
  "detail": "The requested project was not found.",
  "instance": "/api/v1/projects/{projectId}"
}
```

The standard members are:

* `type`: URI identifying the problem type.
* `title`: Short, human-readable summary of the problem type.
* `status`: HTTP status code associated with the problem.
* `detail`: Human-readable explanation specific to the occurrence.
* `instance`: URI identifying the specific occurrence of the problem.

The `detail` field must not be used as a machine-readable error code. Clients should use `type`, `status`, and defined extension members instead.

### Validation Errors

Validation errors may use an extension member to provide field-level validation information.

Example:

```json
{
  "type": "https://api.example.com/problems/validation-error",
  "title": "Validation failed",
  "status": 422,
  "detail": "One or more fields are invalid.",
  "errors": [
    {
      "detail": "The title field is required.",
      "pointer": "#/title"
    }
  ]
}
```

The `errors` member is an API-specific extension and should contain structured validation information.

### HTTP Status Codes

The API should use HTTP status codes according to their standard semantics.

Expected statuses include:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Content
500 Internal Server Error
```

The API must not redefine standard HTTP status code semantics.

### Client Handling

The frontend must treat the HTTP status code as the primary classification of the failure.

The frontend may use the Problem Details `type` and defined extension members for more specific behavior.

The frontend must not parse human-readable `detail` text to determine application behavior.

### Security

Problem Details responses must not expose:

* Stack traces
* Database errors
* Internal class names
* File paths
* Secrets
* Tokens
* Sensitive implementation details

Error details should provide enough information for the client to handle the problem without unnecessarily exposing internal system information.

### Consistency

All backend implementations must follow the same Problem Details contract.

The AI Agent must not introduce a separate custom error response format for a specific backend implementation.

The final Problem Details schemas and problem types will be defined in the OpenAPI specification.

## OpenAPI Generation Strategy

The OpenAPI specification is generated from the backend API implementation rather than maintained manually as the primary source.

The backend implementation is responsible for defining:

* Endpoints
* HTTP methods
* Request schemas
* Response schemas
* Validation constraints
* Authentication requirements
* Error responses
* Query parameters
* Resource schemas

The backend framework and its OpenAPI tooling will generate the OpenAPI document.

The generated specification should be exported as:

```text
docs/api/openapi-v1.yaml
```

or an equivalent generated JSON representation.

### Source of Truth

The backend implementation is the executable source of truth for the API behavior.

The API design documentation remains the source of truth for framework-independent API conventions and architectural decisions.

The generated OpenAPI document is the machine-readable contract consumed by frontend tooling and other clients.

### Generated File Rule

The generated OpenAPI file must not be manually edited.

When the API changes, the backend implementation and its API documentation/annotations must be updated first, then the OpenAPI document must be regenerated.

### Compatibility Requirement

All backend implementations must follow the shared API design and business rules.

When multiple backend implementations exist, their generated OpenAPI specifications must remain compatible with the agreed API contract.

Any intentional breaking change must be explicitly documented and require an API version change.

### AI Agent Rule

The AI Agent must not manually edit the generated OpenAPI file.

When an API change is required, the Agent must modify the backend API implementation and regenerate the OpenAPI document.

The Agent must report any detected mismatch between the generated OpenAPI document and the shared API design.
