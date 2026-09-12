import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../../../tests/mocks/server.ts'
import { useAuthStore } from '../store/auth-store.ts'
import { httpClient } from './client.ts'

// Behavior tests for proactive expiry refresh + no-session guard.
// Complements client.refresh.test.ts (reactive 401 path, unchanged).

function jwt(expSeconds: number): string {
  const b64 = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${b64({ alg: 'none' })}.${b64({ exp: expSeconds })}.sig`
}

const expiredJwt = () => jwt(Math.floor(Date.now() / 1000) - 120)
const validJwt = () => jwt(Math.floor(Date.now() / 1000) + 3600)

describe('httpClient proactive refresh', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('refreshes an expired token before the request (no 401 round-trip)', async () => {
    let refreshCount = 0
    let protectedCalls = 0
    let seenAuth: string | null = null
    useAuthStore.getState().setAccessToken(expiredJwt())
    server.use(
      http.post('*/api/v1/auth/refresh', () => {
        refreshCount += 1
        return HttpResponse.json({ data: { accessToken: 'fresh-token' } })
      }),
      http.get('*/api/v1/protected/proactive', ({ request }) => {
        protectedCalls += 1
        seenAuth = request.headers.get('Authorization')
        return HttpResponse.json({ data: { ok: true } })
      }),
    )

    const res = await httpClient.get('/protected/proactive')

    expect(res.data.data.ok).toBe(true)
    expect(refreshCount).toBe(1)
    expect(protectedCalls).toBe(1)
    expect(seenAuth).toBe('Bearer fresh-token')
    expect(useAuthStore.getState().accessToken).toBe('fresh-token')
  })

  it('sends a valid token normally without refreshing', async () => {
    let refreshCalled = false
    const token = validJwt()
    useAuthStore.getState().setAccessToken(token)
    server.use(
      http.post('*/api/v1/auth/refresh', () => {
        refreshCalled = true
        return HttpResponse.json({ data: { accessToken: 'should-not-be-called' } })
      }),
      http.get('*/api/v1/protected/valid', ({ request }) =>
        HttpResponse.json({
          data: { auth: request.headers.get('Authorization') },
        }),
      ),
    )

    const res = await httpClient.get('/protected/valid')

    expect(res.data.data.auth).toBe(`Bearer ${token}`)
    expect(refreshCalled).toBe(false)
  })

  it('makes no refresh call when no session exists', async () => {
    let refreshCalled = false
    server.use(
      http.post('*/api/v1/auth/refresh', () => {
        refreshCalled = true
        return HttpResponse.json({ data: { accessToken: 'should-not-be-called' } })
      }),
      http.get('*/api/v1/protected/nosession', () =>
        HttpResponse.json(
          {
            type: 'https://api.example.com/problems/unauthorized',
            title: 'Unauthorized',
            status: 401,
            detail: 'no session',
            instance: '/api/v1/protected/nosession',
          },
          { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    await expect(httpClient.get('/protected/nosession')).rejects.toMatchObject({
      response: { status: 401 },
    })
    expect(refreshCalled).toBe(false)
  })

  it('shares one proactive refresh across concurrent requests', async () => {
    let refreshCount = 0
    useAuthStore.getState().setAccessToken(expiredJwt())
    server.use(
      http.post('*/api/v1/auth/refresh', async () => {
        refreshCount += 1
        await new Promise((r) => setTimeout(r, 50))
        return HttpResponse.json({ data: { accessToken: 'shared-fresh-token' } })
      }),
      http.get('*/api/v1/protected/shared', () => HttpResponse.json({ data: { ok: true } })),
    )

    const [r1, r2] = await Promise.all([
      httpClient.get('/protected/shared'),
      httpClient.get('/protected/shared'),
    ])

    expect(r1.data.data.ok).toBe(true)
    expect(r2.data.data.ok).toBe(true)
    expect(refreshCount).toBe(1)
    expect(useAuthStore.getState().accessToken).toBe('shared-fresh-token')
  })
})
