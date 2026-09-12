import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server.ts'
import { useAuthStore } from '../../auth/store/authStore.ts'
import { DashboardPage } from './DashboardPage.tsx'

const ALPHA_ID = '00000000-0000-4000-a000-000000000010'
const TASK_A10 = '00000000-0000-4000-a000-000000000a10'

function renderWithRouter() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(
    [{ path: '/dashboard', element: <DashboardPage /> }],
    { initialEntries: ['/dashboard'] },
  )
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

function signInAsMember() {
  useAuthStore.getState().setAuth(
    { id: '00000000-0000-4000-a000-000000000002', email: 'member@example.com' },
    'mock-access-token',
  )
}

describe('DashboardPage (behavior)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('renders counts, projects, and my tasks with links (behavior)', async () => {
    signInAsMember()
    renderWithRouter()

    expect(await screen.findByText('Alpha Project')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Alpha Project' }),
    ).toHaveAttribute('href', `/projects/${ALPHA_ID}`)
    expect(screen.getByText('Beta Project')).toBeInTheDocument()
    expect(screen.getByText('Setup CI')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Setup CI' })).toHaveAttribute(
      'href',
      `/projects/${ALPHA_ID}/tasks/${TASK_A10}`,
    )
    // Tasks not assigned to the current user stay out of My Tasks.
    expect(screen.queryByText('Fix login bug')).not.toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('To do')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('shows empty states when no projects or tasks (behavior)', async () => {
    signInAsMember()
    server.use(
      http.get('*/api/v1/projects', () =>
        HttpResponse.json({
          data: [],
          meta: { currentPage: 1, perPage: 20, total: 0, lastPage: 1 },
        }),
      ),
    )
    renderWithRouter()

    expect(await screen.findByText(/no projects yet/i)).toBeInTheDocument()
    expect(screen.getByText(/no tasks assigned to you/i)).toBeInTheDocument()
  })

  it('shows a non-blocking notice on partial task failure (behavior)', async () => {
    signInAsMember()
    server.use(
      http.get('*/api/v1/projects/00000000-0000-4000-a000-000000000020/tasks', () =>
        HttpResponse.json(
          {
            type: 'https://api.example.com/problems/server-error',
            title: 'Server error',
            status: 500,
            detail: 'boom',
            instance: '/api/v1/projects/00000000-0000-4000-a000-000000000020/tasks',
          },
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderWithRouter()

    expect(await screen.findByText('Alpha Project')).toBeInTheDocument()
    expect(screen.getByText(/couldn.t be loaded; showing partial data/i)).toBeInTheDocument()
  })

  it('shows error state on server failure using status (behavior)', async () => {
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
    renderWithRouter()

    expect(await screen.findByText(/unable to load dashboard/i)).toBeInTheDocument()
  })
})
