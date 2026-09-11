import axios from 'axios'

import { config } from '../../config/env.ts'
import { useAuthStore } from '../store/auth-store.ts'

/**
 * Shared Axios HTTP client per FE-S003-05 and docs/architecture/system-architecture.md:313-449.
 *
 * Responsibilities (shared infrastructure only):
 *  - baseURL from typed `config.apiUrl` (no hard-coded URL, no direct import.meta.env in components)
 *  - common headers (`Content-Type: application/json`)
 *  - auth header placeholder (`Authorization: Bearer <token>` from memory — no token yet, structure only)
 *  - `withCredentials: true` for refresh HttpOnly Secure Cookie (docs/api/api-design.md:592)
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
httpClient.interceptors.request.use((requestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    // Axios v1 headers is AxiosHeaders object; set safely for both object and AxiosHeaders types
    const headers = requestConfig.headers as unknown as Record<string, string> & {
      set?: (name: string, value: string) => void
    }
    if (headers && typeof headers.set === 'function') {
      headers.set('Authorization', `Bearer ${token}`)
    } else if (headers) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  return requestConfig
})

// 401 refresh handling — concurrent queue, single refresh, redirect on failure.
type FailedQueueItem = {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

let isRefreshing = false
let failedQueue: FailedQueueItem[] = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (token) prom.resolve(token)
    else prom.reject(error)
  })
  failedQueue = []
}

function isAuthRefreshUrl(url?: string): boolean {
  return !!url && url.includes('/auth/refresh')
}

function isAuthLoginUrl(url?: string): boolean {
  return !!url && url.includes('/auth/login')
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined
    const status: number | undefined = error.response?.status
    const requestUrl: string | undefined = originalRequest?.url

    // Only handle 401, not for refresh/login itself, and not already retried.
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

    if (isRefreshing) {
      // Queue concurrent 401s — single refresh
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          const headers = originalRequest.headers as unknown as Record<string, string> & {
            set?: (name: string, value: string) => void
          }
          if (headers && typeof headers.set === 'function') {
            headers.set('Authorization', `Bearer ${token}`)
          } else if (headers) {
            headers['Authorization'] = `Bearer ${token}`
          }
          originalRequest._retry = true
          return httpClient(originalRequest)
        })
        .catch((queueError) => Promise.reject(queueError))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      // Refresh token is HttpOnly cookie — withCredentials sends it automatically, never read via JS.
      const res = await rawRefreshClient.post<{ data: { accessToken: string } }>('/auth/refresh')
      const newToken = res.data.data.accessToken
      useAuthStore.getState().setAccessToken(newToken)
      processQueue(null, newToken)

      const headers = originalRequest.headers as unknown as Record<string, string> & {
        set?: (name: string, value: string) => void
      }
      if (headers && typeof headers.set === 'function') {
        headers.set('Authorization', `Bearer ${newToken}`)
      } else if (headers) {
        headers['Authorization'] = `Bearer ${newToken}`
      }
      return httpClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      useAuthStore.getState().clearAuth()
      // Redirect to login — backend is authoritative, frontend UX only.
      // Avoid redirect loop if already on /login.
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
