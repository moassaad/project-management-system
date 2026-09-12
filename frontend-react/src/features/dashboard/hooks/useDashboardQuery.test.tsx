import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server.ts'
import { useAuthStore } from '../../auth/store/authStore.ts'
import { useDashboardQuery } from './useDashboardQuery.ts'

const MEMBER_ID = '00000000-0000-4000-a000-000000000002'
const BETA_ID = '00000000-0000-4000-a000-000000000020'

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
      <p>
        failed:{query.data?.failedProjectIds.length ?? 0} truncated:
        {String(query.data?.truncated ?? false)}
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

  it('isolates per-project task failures and derives counts from loaded data (behavior)', async () => {
    signInAsMember()
    server.use(
      http.get(`*/api/v1/projects/${BETA_ID}/tasks`, () =>
        HttpResponse.json(
          {
            type: 'https://api.example.com/problems/server-error',
            title: 'Server error',
            status: 500,
            detail: 'boom',
            instance: `/api/v1/projects/${BETA_ID}/tasks`,
          },
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderProbe()

    // Alpha renders; Beta skipped; counts exclude Beta's task.
    expect(await screen.findByText('Setup CI')).toBeInTheDocument()
    expect(screen.queryByText('Write docs')).not.toBeInTheDocument()
    expect(screen.getByText(/projects:2 tasks:2 todo:1 done:0/)).toBeInTheDocument()
    expect(screen.getByText(/failed:1 truncated:false/)).toBeInTheDocument()
  })

  it('flags truncation when pagination caps are hit (behavior)', async () => {
    signInAsMember()
    server.use(
      http.get(`*/api/v1/projects/${BETA_ID}/tasks`, ({ request }) => {
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page') ?? '1')
        const perPage = Number(url.searchParams.get('perPage') ?? '20')
        const all = Array.from({ length: 61 }, (_, i) => ({
          id: `beta-task-${i + 1}`,
          projectId: BETA_ID,
          title: `Beta task ${i + 1}`,
          description: null,
          type: 'FEATURE',
          status: 'TODO',
          priority: 'MEDIUM',
          assigneeId: null,
          dueDate: null,
          createdAt: new Date().toISOString(),
        }))
        const start = (page - 1) * perPage
        return HttpResponse.json({
          data: all.slice(start, start + perPage),
          meta: { currentPage: page, perPage, total: all.length, lastPage: 4 },
        })
      }),
    )
    renderProbe()

    // 2 Alpha + 60 Beta (cap 3 pages); counts approximate.
    expect(await screen.findByText(/tasks:62/)).toBeInTheDocument()
    expect(screen.getByText(/failed:0 truncated:true/)).toBeInTheDocument()
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
