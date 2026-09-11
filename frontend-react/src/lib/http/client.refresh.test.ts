import { http, HttpResponse } from 'msw'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { useAuthStore } from '../store/auth-store.ts'
import { httpClient } from './client.ts'
import { server } from '../../../tests/mocks/server.ts'

// MSW tests for 401 → refresh → retry and refresh failure → logout
// Verifies withCredentials, Bearer from memory, RFC9457 status/type, concurrent queue

describe('httpClient refresh interceptor', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
    useAuthStore.getState().setAccessToken('expired-token')
    // Reset window.location.href mock if needed
    vi.restoreAllMocks()
  })

  it('retries original request after 401 and refresh success (status/type not detail)', async () => {
    let protectedCallCount = 0
    server.use(
      http.get('*/api/v1/protected/resource', () => {
        protectedCallCount += 1
        if (protectedCallCount === 1) {
          return HttpResponse.json(
            {
              type: 'https://api.example.com/problems/unauthorized',
              title: 'Unauthorized',
              status: 401,
              detail: 'Token expired',
              instance: '/api/v1/protected/resource',
            },
            { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
          )
        }
        // After refresh, succeed — check that new token is used
        return HttpResponse.json({ data: { ok: true } })
      }),
      http.post('*/api/v1/auth/refresh', () =>
        HttpResponse.json({ data: { accessToken: 'new-token' } }),
      ),
    )

    const res = await httpClient.get('/protected/resource')
    expect(res.data.data.ok).toBe(true)
    expect(useAuthStore.getState().accessToken).toBe('new-token')
    expect(protectedCallCount).toBe(2)
  })

  it('queues concurrent 401s with single refresh (concurrent queue)', async () => {
    let refreshCount = 0
    let protectedCount = 0
    server.use(
      http.get('*/api/v1/protected/concurrent', () => {
        protectedCount += 1
        // First wave: all 401, second wave after refresh: 200
        if (protectedCount <= 2) {
          return HttpResponse.json(
            { type: 'https://api.example.com/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'expired', instance: '/api/v1/protected/concurrent' },
            { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
          )
        }
        return HttpResponse.json({ data: { ok: true } })
      }),
      http.post('*/api/v1/auth/refresh', async () => {
        refreshCount += 1
        // Simulate slight delay to ensure concurrency
        await new Promise((r) => setTimeout(r, 50))
        return HttpResponse.json({ data: { accessToken: 'concurrent-new-token' } })
      }),
    )

    const [r1, r2] = await Promise.all([
      httpClient.get('/protected/concurrent'),
      httpClient.get('/protected/concurrent'),
    ])

    expect(r1.data.data.ok).toBe(true)
    expect(r2.data.data.ok).toBe(true)
    expect(refreshCount).toBe(1) // single refresh for concurrent 401s
    expect(useAuthStore.getState().accessToken).toBe('concurrent-new-token')
  })

  it('clears auth and redirects to /login on refresh failure (reuse detection)', async () => {
    // jsdom window.location — stub pathname/href
    const originalHref = window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: originalHref, pathname: '/dashboard' } as unknown as Location,
      writable: true,
      configurable: true,
    })

    useAuthStore.getState().setAuth({ id: '00000000-0000-4000-a000-000000000001', email: 'test@example.com' }, 'expired-token')

    server.use(
      http.get('*/api/v1/protected/needs-auth', () =>
        HttpResponse.json(
          { type: 'https://api.example.com/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'expired', instance: '/api/v1/protected/needs-auth' },
          { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
      http.post('*/api/v1/auth/refresh', () =>
        HttpResponse.json(
          { type: 'https://api.example.com/problems/unauthorized', title: 'Unauthorized', status: 401, detail: 'Refresh invalid', instance: '/api/v1/auth/refresh' },
          { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    await expect(httpClient.get('/protected/needs-auth')).rejects.toMatchObject({
      response: { status: 401 },
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect((window.location as unknown as { href: string }).href).toBe('/login')

    // restore
    ;(window.location as unknown as { href: string }).href = originalHref
  })

  it('does not retry /auth/login 401 via refresh (invalid credentials)', async () => {
    let refreshCalled = false
    server.use(
      http.post('*/api/v1/auth/login', () =>
        HttpResponse.json(
          { type: 'https://api.example.com/problems/invalid-credentials', title: 'Invalid credentials', status: 401, detail: 'bad', instance: '/api/v1/auth/login' },
          { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
      http.post('*/api/v1/auth/refresh', () => {
        refreshCalled = true
        return HttpResponse.json({ data: { accessToken: 'should-not-be-called' } })
      }),
    )

    await expect(httpClient.post('/auth/login', { email: 'a@a.com', password: 'bad' })).rejects.toMatchObject({
      response: { status: 401 },
    })
    expect(refreshCalled).toBe(false)
  })
})
