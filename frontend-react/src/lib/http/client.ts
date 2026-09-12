import axios from 'axios'

import { config } from '../../config/env.ts'
import { useAuthStore } from '../store/auth-store.ts'
import { hasSessionHint } from './sessionHint.ts'
import { isTokenExpired } from './tokenExpiry.ts'

/**
 * Shared Axios HTTP client per FE-S003-05 and docs/architecture/system-architecture.md:313-449.
 *
 * Responsibilities (shared infrastructure only):
 *  - baseURL from typed `config.apiUrl` (no hard-coded URL, no direct import.meta.env in components)
 *  - common headers (`Content-Type: application/json`)
 *  - `Authorization: Bearer <token>` from memory-only store (never persisted)
 *  - `withCredentials: true` for refresh HttpOnly Secure Cookie (docs/api/api-design.md:592)
 *  - proactive refresh for provably-expired JWTs + guarded single retry on 401
 *  - common response/error handling — RFC 9457 `application/problem+json` passthrough (no swallowing)
 *
 * Must NOT contain business operations (createProject, etc.) — those belong to feature API layers
 * e.g. `src/features/projects/api/projects.api.ts`.
 *
 * Dependency direction: features/api → lib/http (allowed), lib/http → features (prohibited).
 */
export const httpClient = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Raw client for refresh — no interceptors, prevents recursion, never reads cookie via JS.
const rawRefreshClient = axios.create({
  baseURL: config.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Attach Authorization header from memory-only store (no persistence).
// Axios v1 headers is AxiosHeaders object; set safely for both object and AxiosHeaders types.
function setAuthHeader(headers: unknown, token: string): void {
  const writable = headers as unknown as Record<string, string> & {
    set?: (name: string, value: string) => void
  }
  if (writable && typeof writable.set === 'function') {
    writable.set('Authorization', `Bearer ${token}`)
  } else if (writable) {
    writable['Authorization'] = `Bearer ${token}`
  }
}

function isAuthRefreshUrl(url?: string): boolean {
  return !!url && url.includes('/auth/refresh')
}

function isAuthLoginUrl(url?: string): boolean {
  return !!url && url.includes('/auth/login')
}

// Shared single-flight refresh — one mechanism for the proactive path
// (expired token before a request) and the reactive path (401 after a
// request). Concurrent callers share the same promise: at most one
// POST /auth/refresh is ever in flight. Resolves with the new token, or null
// when no refresh is possible (no session) or it failed (auth cleared +
// login redirect already performed). The refresh call itself uses the raw
// client (no interceptors) so it is never retried — infinite loops impossible.
let refreshInflight: Promise<string | null> | null = null

function hasRefreshableSession(): boolean {
  return !!useAuthStore.getState().accessToken || hasSessionHint()
}

export function refreshAccessTokenShared(): Promise<string | null> {
  if (!hasRefreshableSession()) {
    return Promise.resolve(null)
  }
  if (!refreshInflight) {
    refreshInflight = rawRefreshClient
      .post<{ data: { accessToken: string } }>('/auth/refresh')
      .then((res) => {
        // Refresh token is HttpOnly cookie — withCredentials sends it automatically, never read via JS.
        const newToken = res.data.data.accessToken
        useAuthStore.getState().setAccessToken(newToken)
        return newToken as string | null
      })
      .catch(() => {
        useAuthStore.getState().clearAuth()
        // Redirect to login — backend is authoritative, frontend UX only.
        // Avoid redirect loop if already on /login.
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return null
      })
      .finally(() => {
        refreshInflight = null
      })
  }
  return refreshInflight
}

// Proactive refresh: a provably-expired JWT is refreshed before the
// authenticated request goes out; valid (or opaque) tokens are sent normally.
// Login/refresh never trigger a refresh.
httpClient.interceptors.request.use(async (requestConfig) => {
  const url = requestConfig.url ?? ''
  if (!isAuthLoginUrl(url) && !isAuthRefreshUrl(url)) {
    const token = useAuthStore.getState().accessToken
    if (token && isTokenExpired(token)) {
      await refreshAccessTokenShared()
    }
  }
  const current = useAuthStore.getState().accessToken
  if (current) {
    setAuthHeader(requestConfig.headers, current)
  }
  return requestConfig
})

// Reactive refresh: an authenticated 401 triggers at most one refresh +
// one retry. Refresh/login themselves and already-retried requests are
// never retried.
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined
    const status: number | undefined = error.response?.status
    const requestUrl: string | undefined = originalRequest?.url

    const shouldRefresh =
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRefreshUrl(requestUrl) &&
      !isAuthLoginUrl(requestUrl)

    if (!shouldRefresh || !originalRequest) {
      // For 401/403 use status/type, not detail string — passthrough RFC9457 ProblemDetails.
      return Promise.reject(error)
    }

    originalRequest._retry = true
    const token = await refreshAccessTokenShared()
    if (!token) {
      return Promise.reject(error)
    }
    setAuthHeader(originalRequest.headers, token)
    return httpClient(originalRequest)
  },
)
