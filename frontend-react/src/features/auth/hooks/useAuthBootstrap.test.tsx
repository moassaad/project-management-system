import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { setSessionHint } from '../../../lib/http/sessionHint.ts'
import { server } from '../../../../tests/mocks/server.ts'
import { useAuthStore } from '../store/authStore.ts'
import { useAuthBootstrap } from './useAuthBootstrap.ts'

const ME_URL = '*/api/v1/auth/me'
const REFRESH_URL = '*/api/v1/auth/refresh'

let calls: string[] = []

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

function useRecordingHandlers(refreshStatus = 200) {
  calls = []
  server.use(
    http.post(REFRESH_URL, () => {
      calls.push('POST /auth/refresh')
      if (refreshStatus !== 200) {
        return problem(401, 'Unauthorized', '/api/v1/auth/refresh')
      }
      return HttpResponse.json({ data: { accessToken: 'mock-refreshed-token' } })
    }),
    http.get(ME_URL, ({ request }) => {
      calls.push('GET /auth/me')
      if (request.headers.get('Authorization') === 'Bearer mock-refreshed-token') {
        return HttpResponse.json({
          data: { id: '00000000-0000-4000-a000-000000000001', email: 'test@example.com' },
        })
      }
      return problem(401, 'Unauthorized', '/api/v1/auth/me')
    }),
  )
}

function Probe() {
  const { isBootstrapping } = useAuthBootstrap()
  return <p>{isBootstrapping ? 'bootstrapping' : 'settled'}</p>
}

describe('useAuthBootstrap refresh-first (behavior)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
    useAuthStore.getState().setBootstrapping(true)
  })

  it('refreshes first, then loads user only with a token (behavior)', async () => {
    useRecordingHandlers()
    setSessionHint()
    render(<Probe />)

    await screen.findByText('settled')
    // Order matters: refresh before /me, exactly once each.
    expect(calls).toEqual(['POST /auth/refresh', 'GET /auth/me'])
    expect(useAuthStore.getState().user?.email).toBe('test@example.com')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('never calls /me when refresh fails; clears auth (behavior)', async () => {
    useRecordingHandlers(401)
    setSessionHint()
    render(<Probe />)

    await screen.findByText('settled')
    expect(calls).toEqual(['POST /auth/refresh'])
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('uses existing token for /me without refreshing (behavior)', async () => {
    useRecordingHandlers()
    useAuthStore.getState().setAccessToken('mock-refreshed-token')
    render(<Probe />)

    await screen.findByText('settled')
    expect(calls).toEqual(['GET /auth/me'])
    expect(useAuthStore.getState().user?.email).toBe('test@example.com')
  })

  it('does nothing when already authenticated (behavior)', async () => {
    useRecordingHandlers()
    useAuthStore.getState().setAuth(
      { id: '00000000-0000-4000-a000-000000000001', email: 'test@example.com' },
      'mock-access-token',
    )
    render(<Probe />)

    await screen.findByText('settled')
    expect(calls).toEqual([])
  })

  it('makes no calls when no session hint exists (behavior)', async () => {
    useRecordingHandlers()
    render(<Probe />)

    await screen.findByText('settled')
    expect(calls).toEqual([])
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('concurrent mounts share one refresh/me round-trip (behavior)', async () => {
    useRecordingHandlers()
    setSessionHint()
    render(
      <>
        <Probe />
        <Probe />
      </>,
    )

    await waitFor(() => expect(screen.getAllByText('settled')).toHaveLength(2))
    expect(calls).toEqual(['POST /auth/refresh', 'GET /auth/me'])
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })
})
