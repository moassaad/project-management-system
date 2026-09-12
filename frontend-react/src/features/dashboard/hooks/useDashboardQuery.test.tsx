import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server.ts'
import { useAuthStore } from '../../auth/store/authStore.ts'
import { useDashboardQuery } from './useDashboardQuery.ts'

const MEMBER_ID = '00000000-0000-4000-a000-000000000002'

function DashboardProbe() {
  const query = useDashboardQuery()
  if (query.isLoading) return <p>Loading dashboard…</p>
  if (query.isError) return <p role="alert">Failed to load dashboard.</p>
  const counts = query.data?.counts
  return (
    <div>
      <ul aria-label="dashboard projects">
        {query.data?.projects.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
      <ul aria-label="dashboard my tasks">
        {query.data?.myTasks.map((t) => (
          <li key={t.id}>{t.title}</li>
        ))}
      </ul>
      <p>
        projects:{counts?.projectCount} tasks:{counts?.taskCount} todo:{counts?.todoCount} done:
        {counts?.doneCount}
      </p>
    </div>
  )
}

function renderProbe() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardProbe />
    </QueryClientProvider>,
  )
}

function signInAsMember() {
  useAuthStore.getState().setAuth(
    { id: MEMBER_ID, email: 'member@example.com' },
    'mock-access-token',
  )
}

describe('useDashboardQuery (behavior)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('derives projects, my tasks, and counts (behavior)', async () => {
    signInAsMember()
    renderProbe()

    expect(await screen.findByText('Alpha Project')).toBeInTheDocument()
    expect(screen.getByText('Beta Project')).toBeInTheDocument()
    // Only tasks assigned to the current user.
    expect(screen.getByText('Setup CI')).toBeInTheDocument()
    expect(screen.queryByText('Fix login bug')).not.toBeInTheDocument()
    expect(screen.queryByText('Write docs')).not.toBeInTheDocument()
    expect(screen.getByText(/projects:2 tasks:3 todo:1 done:1/)).toBeInTheDocument()
  })

  it('returns empty dashboard when no projects (behavior)', async () => {
    signInAsMember()
    server.use(
      http.get('*/api/v1/projects', () =>
        HttpResponse.json({
          data: [],
          meta: { currentPage: 1, perPage: 20, total: 0, lastPage: 1 },
        }),
      ),
    )
    renderProbe()

    expect(await screen.findByText(/projects:0 tasks:0 todo:0 done:0/)).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('surfaces error when projects fail to load (behavior)', async () => {
    signInAsMember()
    server.use(
      http.get('*/api/v1/projects', () =>
        HttpResponse.json(
          {
            type: 'https://api.example.com/problems/server-error',
            title: 'Server error',
            status: 500,
            detail: 'boom',
            instance: '/api/v1/projects',
          },
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderProbe()

    expect(await screen.findByText(/failed to load dashboard/i)).toBeInTheDocument()
  })
})
