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

// Passthrough for RFC 9457 problem+json — do not transform error detail; let callers handle status/type.
httpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)
