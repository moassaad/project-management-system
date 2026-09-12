import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server.ts'
import { TaskDetailsPage } from './TaskDetailsPage.tsx'
import { TasksPage } from './TasksPage.tsx'

const ALPHA_ID = '00000000-0000-4000-a000-000000000010'
const TASK_A10 = '00000000-0000-4000-a000-000000000a10'

function renderWithRouter(initialEntries: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(
    [
      { path: '/projects/:projectId/tasks', element: <TasksPage /> },
      { path: '/projects/:projectId/tasks/:taskId', element: <TaskDetailsPage /> },
    ],
    { initialEntries },
  )
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('TasksPage', () => {
  it('lists tasks with status/priority/type badges (behavior)', async () => {
    renderWithRouter([`/projects/${ALPHA_ID}/tasks`])

    expect(await screen.findByText('Setup CI')).toBeInTheDocument()
    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
    expect(screen.getByText('TODO')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('FEATURE')).toBeInTheDocument()
  })

  it('shows empty state when no tasks (behavior)', async () => {
    server.use(
      http.get('*/api/v1/projects/:projectId/tasks', () =>
        HttpResponse.json({
          data: [],
          meta: { currentPage: 1, perPage: 20, total: 0, lastPage: 1 },
        }),
      ),
    )
    renderWithRouter([`/projects/${ALPHA_ID}/tasks`])

    expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument()
  })

  it('shows error state on server failure using status (behavior)', async () => {
    server.use(
      http.get('*/api/v1/projects/:projectId/tasks', () =>
        HttpResponse.json(
          {
            type: 'https://api.example.com/problems/server-error',
            title: 'Server error',
            status: 500,
            detail: 'boom',
            instance: `/api/v1/projects/${ALPHA_ID}/tasks`,
          },
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderWithRouter([`/projects/${ALPHA_ID}/tasks`])

    expect(await screen.findByText(/unable to load tasks/i)).toBeInTheDocument()
  })
})

describe('TaskDetailsPage', () => {
  it('renders task details with badges (behavior)', async () => {
    renderWithRouter([`/projects/${ALPHA_ID}/tasks/${TASK_A10}`])

    expect(await screen.findByText('Setup CI')).toBeInTheDocument()
    expect(screen.getByText('Add pipeline')).toBeInTheDocument()
    expect(screen.getByText('TODO')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('FEATURE')).toBeInTheDocument()
  })

  it('shows unassigned when no assignee (behavior)', async () => {
    renderWithRouter([`/projects/${ALPHA_ID}/tasks/00000000-0000-4000-a000-000000000a20`])

    expect(await screen.findByText('Fix login bug')).toBeInTheDocument()
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
  })

  it('handles 404 for unknown task (behavior)', async () => {
    renderWithRouter([`/projects/${ALPHA_ID}/tasks/00000000-0000-4000-a000-00000000ffff`])

    expect(await screen.findByText(/task not found/i)).toBeInTheDocument()
  })
})
