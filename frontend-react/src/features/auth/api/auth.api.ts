import { httpClient } from '../../../lib/http/client.ts'

import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  User,
} from '../types/auth.types.ts'

/**
 * Frontend auth API layer — thin wrapper over shared Axios client.
 * Uses `withCredentials: true` already configured in httpClient for refresh HttpOnly cookie.
 * baseURL comes from `config.apiUrl` (VITE_API_URL), no hard-coded URL, no component fetch.
 *
 * Endpoints per docs/api/api-design.md: POST /auth/login, POST /auth/refresh, POST /auth/logout, GET /auth/me
 * Tenant: /api/v1 is already in baseURL, so paths are relative to it (e.g. `/auth/login` → `/api/v1/auth/login`).
 */

type Wrapped<T> = { data: T }

export async function login(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const res = await httpClient.post<Wrapped<LoginResponse>>(
    '/auth/login',
    payload,
  )
  return res.data.data
}

export async function refresh(): Promise<RefreshResponse> {
  const res = await httpClient.post<Wrapped<RefreshResponse>>(
    '/auth/refresh',
  )
  return res.data.data
}

export async function logout(): Promise<void> {
  await httpClient.post('/auth/logout')
}

export async function me(): Promise<User> {
  const res = await httpClient.get<Wrapped<User>>('/auth/me')
  return res.data.data
}
