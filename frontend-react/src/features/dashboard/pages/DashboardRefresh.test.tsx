import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server.ts'
import { setSessionHint } from '../../../lib/http/sessionHint.ts'
import { useAuthStore } from '../../auth/store/authStore.ts'
import { DashboardPage } from './DashboardPage.tsx'
import { useAuthBootstrap } from '../../auth/hooks/useAuthBootstrap.ts'

const MEMBER_ID = '00000000-0000-4000-a000-000000000002'
const ALPHA_ID = '00000000-0000-4000-a000-000000000010'

function DashboardWithBootstrap() {
  useAuthBootstrap()
  return <DashboardPage />
}

function createRouter() {
  return createMemoryRouter(
    [{ path: '/dashboard', element: <DashboardWithBootstrap /> }],
    { initialEntries: ['/dashboard'] },
  )
}

function renderWithFreshClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 30_000 },
      mutations: { retry: false },
    },
  })
  const router = createRouter()
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('Dashboard reload after browser refresh (behavior)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
    useAuthStore.getState().setBootstrapping(true)
    sessionStorage.clear()
  })

  afterEach(() => {
    useAuthStore.getState().clearAuth()
    useAuthStore.getState().setBootstrapping(true)
    sessionStorage.clear()
  })

  it('restores session via refresh, then loads dashboard with Bearer header and fresh fetch (behavior)', async () => {
    // Simulate tab that had authenticated session before refresh:
    // memory cleared, but sessionHint persists (sessionStorage) and
    // HttpOnly refresh cookie is sent via withCredentials (MSW mocks it).
    setSessionHint()
    // Ensure memory is empty to simulate browser refresh loss
    useAuthStore.getState().clearAuth()
    // But hint must remain after clearAuth (clearAuth clears hint) — so set again
    setSessionHint()
    useAuthStore.getState().setBootstrapping(true)

    let refreshCalls = 0
    let meCalls = 0
    let meAuthHeader: string | null = null
    let projectsAuthHeader: string | null = null
    let tasksAuthHeader: string | null = null

    server.use(
      http.post('*/api/v1/auth/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json({ data: { accessToken: 'refreshed-token-after-reload' } })
      }),
      http.get('*/api/v1/auth/me', ({ request }) => {
        meCalls += 1
        meAuthHeader = request.headers.get('Authorization')
        return HttpResponse.json({
          data: { id: MEMBER_ID, email: 'member@example.com' },
        })
      }),
      http.get('*/api/v1/projects', ({ request }) => {
        projectsAuthHeader = request.headers.get('Authorization')
        return HttpResponse.json({
          data: [
            {
              id: ALPHA_ID,
              name: 'Alpha Project',
              description: 'First project',
              ownerId: '00000000-0000-4000-a000-000000000001',
              createdAt: new Date().toISOString(),
            },
          ],
          meta: { currentPage: 1, perPage: 20, total: 1, lastPage: 1 },
        })
      }),
      http.get('*/api/v1/projects/:projectId/tasks', ({ request }) => {
        // Only capture first tasks call auth header
        if (!tasksAuthHeader) tasksAuthHeader = request.headers.get('Authorization')
        return HttpResponse.json({
          data: [
            {
              id: '00000000-0000-4000-a000-000000000a10',
              projectId: ALPHA_ID,
              title: 'Setup CI',
              description: null,
              type: 'FEATURE',
              status: 'TODO',
              priority: 'HIGH',
              assigneeId: MEMBER_ID,
              dueDate: null,
              createdAt: new Date().toISOString(),
            },
          ],
          meta: { currentPage: 1, perPage: 20, total: 1, lastPage: 1 },
        })
      }),
    )

    renderWithFreshClient()

    // Loading states during reload (bootstrap + dashboard fetch)
    expect(await screen.findByText(/loading/i)).toBeInTheDocument()

    // Dashboard renders data returned by backend, not from memory/Zustand
    expect(await screen.findByText('Alpha Project')).toBeInTheDocument()
    expect(screen.getByText('Setup CI')).toBeInTheDocument()

    // Verify refresh lifecycle: refresh first, then me with Bearer header
    expect(refreshCalls).toBe(1)
    expect(meCalls).toBe(1)
    expect(meAuthHeader).toBe('Bearer refreshed-token-after-reload')
    // Dashboard API requests made with Authorization header
    expect(projectsAuthHeader).toBe('Bearer refreshed-token-after-reload')
    expect(tasksAuthHeader).toBe('Bearer refreshed-token-after-reload')

    // Verify no reliance on Zustand for dashboard server data:
    // Dashboard data comes from TanStack Query (verified by fresh fetch
    // with new QueryClient), not from persisted store. Access token is
    // memory-only (verified by needing refresh to obtain it).
    expect(useAuthStore.getState().accessToken).toBe('refreshed-token-after-reload')
    expect(useAuthStore.getState().user?.id).toBe(MEMBER_ID)
  })

  it('fresh browser refresh triggers new fetch, not cached data (behavior)', async () => {
    setSessionHint()
    useAuthStore.getState().clearAuth()
    setSessionHint()
    useAuthStore.getState().setBootstrapping(true)

    let projectsFetchCount = 0

    server.use(
      http.post('*/api/v1/auth/refresh', () =>
        HttpResponse.json({ data: { accessToken: 'fresh-token-2' } }),
      ),
      http.get('*/api/v1/auth/me', () =>
        HttpResponse.json({ data: { id: MEMBER_ID, email: 'member@example.com' } }),
      ),
      http.get('*/api/v1/projects', () => {
        projectsFetchCount += 1
        return HttpResponse.json({
          data: [
            {
              id: ALPHA_ID,
              name: 'Alpha Project',
              description: null,
              ownerId: '00000000-0000-4000-a000-000000000001',
              createdAt: new Date().toISOString(),
            },
          ],
          meta: { currentPage: 1, perPage: 20, total: 1, lastPage: 1 },
        })
      }),
      http.get('*/api/v1/projects/:projectId/tasks', () =>
        HttpResponse.json({
          data: [],
          meta: { currentPage: 1, perPage: 20, total: 0, lastPage: 1 },
        }),
      ),
    )

    // First "page load" — fresh QueryClient, should fetch
    const client1 = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
    })
    const router1 = createRouter()
    const { unmount } = render(
      <QueryClientProvider client={client1}>
        <RouterProvider router={router1} />
      </QueryClientProvider>,
    )
    expect(await screen.findByText('Alpha Project')).toBeInTheDocument()
    expect(projectsFetchCount).toBe(1)

    unmount()

    // Simulate browser refresh: new JS context, new QueryClient, same sessionHint
    // (sessionStorage persists), bootstrap must run again.
    useAuthStore.getState().clearAuth()
    setSessionHint()
    useAuthStore.getState().setBootstrapping(true)

    const client2 = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
    })
    const router2 = createRouter()
    render(
      <QueryClientProvider client={client2}>
        <RouterProvider router={router2} />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Alpha Project')).toBeInTheDocument()
    // Second load must have triggered a fresh fetch, not served from previous
    // client's cache (which was discarded on refresh)
    expect(projectsFetchCount).toBe(2)
  })
})
