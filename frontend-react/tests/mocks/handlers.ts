import { http, HttpResponse } from 'msw'

/**
 * MSW handlers — Axios + TanStack Query compatible, behavior-focused.
 * Example handler for GET /api/v1/health (public liveness from Sprint 002 backend).
 * Uses wildcard so it matches regardless of baseURL (http://localhost:8080/api/v1 via config.apiUrl).
 * Added auth handlers for FE-S004-01 (mocked for tests, not business feature).
 */
export const handlers = [
  http.get('*/api/v1/health', () =>
    HttpResponse.json({ data: { status: 'UP' } }),
  ),
  // Exact fallback for jsdom base
  http.get('http://localhost:8080/api/v1/health', () =>
    HttpResponse.json({ data: { status: 'UP' } }),
  ),

  // Auth mocks — behavior-focused, align with auth.api.ts expectations
  http.post('*/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string }
    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        data: {
          accessToken: 'mock-access-token',
          user: { id: '00000000-0000-4000-a000-000000000001', email: body.email },
        },
      })
    }
    return HttpResponse.json(
      {
        type: 'https://api.example.com/problems/invalid-credentials',
        title: 'Invalid credentials',
        status: 401,
        detail: 'Email or password is incorrect.',
        instance: '/api/v1/auth/login',
      },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
    )
  }),
  http.post('*/api/v1/auth/refresh', () =>
    HttpResponse.json({ data: { accessToken: 'mock-refreshed-token' } }),
  ),
  http.post('*/api/v1/auth/logout', () => new HttpResponse(null, { status: 204 })),
  http.get('*/api/v1/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (auth === 'Bearer mock-access-token' || auth === 'Bearer mock-refreshed-token') {
      return HttpResponse.json({
        data: { id: '00000000-0000-4000-a000-000000000001', email: 'test@example.com' },
      })
    }
    return HttpResponse.json(
      {
        type: 'https://api.example.com/problems/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'Not authenticated.',
        instance: '/api/v1/auth/me',
      },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
    )
  }),
]
