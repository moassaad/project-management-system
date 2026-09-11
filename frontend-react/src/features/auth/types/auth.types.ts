/**
 * Auth contract types — aligned with OpenAPI (camelCase, UUID string)
 * per FE-S004-01 and docs/api/api-design.md.
 * Backend is source of truth; these mirror expected JSON shapes.
 */

/** User returned by auth endpoints — UUID string + email */
export type User = {
  id: string // UUID v4 string
  email: string
}

/** POST /api/v1/auth/login request */
export type LoginRequest = {
  email: string
  password: string
}

/** POST /api/v1/auth/login response data (backend wraps in {data: {...}} per api-design 4.11) */
export type LoginResponse = {
  accessToken: string
  user: User
}

/** POST /api/v1/auth/refresh response */
export type RefreshResponse = {
  accessToken: string
}

/**
 * Frontend AuthState — memory-only (per docs/api/api-design.md:556).
 * accessToken lives only in Zustand memory, never persisted.
 * user is server-owned but cached via TanStack Query for /auth/me (not duplicated in Zustand beyond initial login if needed).
 * This interface describes the shape that Zustand store may hold; actual store may evolve to include user.
 */
export type AuthState = {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
}
