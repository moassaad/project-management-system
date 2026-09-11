import { create } from 'zustand'

/**
 * Shared client state for authentication — memory-only Access Token.
 *
 * State Ownership Rule (per docs/architecture/system-architecture.md:453-531):
 *  - Server State → TanStack Query (projects/tasks/comments fetched from API)
 *  - Local UI State → React useState/useReducer (modal, dropdown, local form UI)
 *  - Shared Client State → Zustand (cross-feature client state like auth)
 *
 * Anti-duplication rule: server-owned data (projects/tasks) must remain in
 * TanStack Query and must NOT be duplicated into Zustand. This store holds only
 * client-owned `accessToken` and derived `isAuthenticated`.
 *
 * Token Storage Strategy (per docs/api/api-design.md:556):
 *  - `accessToken` lives only in frontend memory (never persisted).
 *  - Never store in localStorage/sessionStorage/persistent storage.
 *  - Refresh Token is HttpOnly Secure Cookie — frontend never reads it directly.
 *  - No persistence plugin is used intentionally — store is memory-only.
 */

type AuthState = {
  /** Access token in memory only; null when unauthenticated. */
  accessToken: string | null
  /** Derived from presence of accessToken; UX-only flag (backend is authoritative). */
  isAuthenticated: boolean
  /** Store a new access token (memory only). */
  setAccessToken: (token: string) => void
  /** Clear authentication (logout / session expiry). */
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  setAccessToken: (token: string) =>
    set({ accessToken: token, isAuthenticated: true }),
  clearAuth: () => set({ accessToken: null, isAuthenticated: false }),
}))
