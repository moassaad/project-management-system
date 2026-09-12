import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server.ts'
import { useAuthStore } from '../store/authStore.ts'
import { me } from './auth.api.ts'

// Dedicated GET /auth/me behavior probes for FE-AUTH-M1:
// header attach, user payload, 401 session transition (single retry + logout flow).

function problem(status: number, title: string, instance: string) {
  return HttpResponse.json(
    {
      type: `https://api.example.com/problems/${title.toLowerCase().replace(/ /g, '-')}`,
      title,
      status,
      detail: title,
      instance,
    },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

describe('auth.api me() (behavior)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('attaches Bearer token and returns the user (behavior)', async () => {
    let seenAuth: string | null = null
    useAuthStore.getState().setAccessToken('memory-token')
    server.use(
      http.get('*/api/v1/auth/me', ({ request }) => {
        seenAuth = request.headers.get('Authorization')
        return HttpResponse.json({
          data: { id: '00000000-0000-4000-a000-000000000001', email: 'test@example.com' },
        })
      }),
    )

    const user = await me()

    expect(seenAuth).toBe('Bearer memory-token')
    expect(user).toEqual({
      id: '00000000-0000-4000-a000-000000000001',
      email: 'test@example.com',
    })
  })

  it('sends no Authorization header without a token (behavior)', async () => {
    let seenAuth: string | null | undefined
    server.use(
      http.get('*/api/v1/auth/me', ({ request }) => {
        seenAuth = request.headers.get('Authorization')
        return HttpResponse.json({
          data: { id: '00000000-0000-4000-a000-000000000001', email: 'test@example.com' },
        })
      }),
    )

    await me()

    expect(seenAuth).toBeNull()
  })

  it('treats 401 as session transition: single retry then cleared auth (behavior)', async () => {
    const originalHref = window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: originalHref, pathname: '/dashboard' } as unknown as Location,
      writable: true,
      configurable: true,
    })
    let meCalls = 0
    let refreshCalls = 0
    useAuthStore.getState().setAccessToken('stale-token')
    server.use(
      http.get('*/api/v1/auth/me', () => {
        meCalls += 1
        return problem(401, 'Unauthorized', '/api/v1/auth/me')
      }),
      http.post('*/api/v1/auth/refresh', () => {
        refreshCalls += 1
        return problem(401, 'Unauthorized', '/api/v1/auth/refresh')
      }),
    )

    await expect(me()).rejects.toMatchObject({ response: { status: 401 } })
    // No pointless retry with a known-dead token: one attempt, one refresh,
    // then the logout flow (a retry only follows a successful refresh).
    expect(meCalls).toBe(1)
    expect(refreshCalls).toBe(1)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect((window.location as unknown as { href: string }).href).toBe('/login')

    ;(window.location as unknown as { href: string }).href = originalHref
  })
})
