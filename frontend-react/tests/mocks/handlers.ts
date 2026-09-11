import { http, HttpResponse } from 'msw'

/**
 * MSW handlers — Axios + TanStack Query compatible, behavior-focused.
 * Example handler for GET /api/v1/health (public liveness from Sprint 002 backend).
 * Uses wildcard so it matches regardless of baseURL (http://localhost:8080/api/v1 via config.apiUrl).
 */
export const handlers = [
  http.get('*/api/v1/health', () =>
    HttpResponse.json({ data: { status: 'UP' } }),
  ),
  // Exact fallback for jsdom base
  http.get('http://localhost:8080/api/v1/health', () =>
    HttpResponse.json({ data: { status: 'UP' } }),
  ),
]
