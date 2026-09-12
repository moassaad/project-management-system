import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server.ts'
import { TaskCreatePage } from './TaskCreatePage.tsx'
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
      { path: '/projects/:projectId/tasks/new', element: <TaskCreatePage /> },
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
    // Badges are <span>; the filter <option>s share the same text.
    expect(screen.getByText('TODO', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('HIGH', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('FEATURE', { selector: 'span' })).toBeInTheDocument()
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

  it('New Task action navigates to the create form (behavior)', async () => {
    const user = userEvent.setup()
    renderWithRouter([`/projects/${ALPHA_ID}/tasks`])
    await screen.findByText('Setup CI')

    await user.click(screen.getByRole('link', { name: /^new task$/i }))

    expect(await screen.findByRole('form', { name: /task form/i })).toBeInTheDocument()
  })

  it('New Task action is present in the empty state (behavior)', async () => {
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
    expect(screen.getByRole('link', { name: /^new task$/i })).toHaveAttribute(
      'href',
      `/projects/${ALPHA_ID}/tasks/new`,
    )
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

describe('TasksPage pagination and loading/error states (behavior)', () => {
  function useTwentyFiveTasks() {
    server.use(
      http.get('*/api/v1/projects/:projectId/tasks', ({ request }) => {
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page') ?? '1')
        const perPage = Number(url.searchParams.get('perPage') ?? '20')
        const all = Array.from({ length: 25 }, (_, i) => ({
          id: `task-${i + 1}`,
          projectId: ALPHA_ID,
          title: `Task ${i + 1}`,
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
          meta: { currentPage: page, perPage, total: all.length, lastPage: 2 },
        })
      }),
    )
  }

  it('pages through results with page info (behavior)', async () => {
    const user = userEvent.setup()
    useTwentyFiveTasks()
    renderWithRouter([`/projects/${ALPHA_ID}/tasks`])
    await screen.findByText('Task 1')
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('Showing 20 of 25 tasks')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^next$/i }))

    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument()
    expect(screen.getByText('Task 21')).toBeInTheDocument()
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^previous$/i }))

    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('Task 1')).toBeInTheDocument()
  })

  it('announces loading status while fetching (behavior)', async () => {
    server.use(
      http.get('*/api/v1/projects/:projectId/tasks', async () => {
        await new Promise((r) => setTimeout(r, 100))
        return HttpResponse.json({
          data: [],
          meta: { currentPage: 1, perPage: 20, total: 0, lastPage: 1 },
        })
      }),
    )
    renderWithRouter([`/projects/${ALPHA_ID}/tasks`])

    expect(screen.getByRole('status', { name: /loading tasks/i })).toBeInTheDocument()
    expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument()
  })

  it('surfaces 400 invalid filter values (behavior)', async () => {
    server.use(
      http.get('*/api/v1/projects/:projectId/tasks', () =>
        HttpResponse.json(
          {
            type: 'https://api.example.com/problems/invalid-filter',
            title: 'Invalid filter',
            status: 400,
            detail: 'Bad status value',
            instance: `/api/v1/projects/${ALPHA_ID}/tasks`,
          },
          { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderWithRouter([`/projects/${ALPHA_ID}/tasks`])

    expect(await screen.findByText(/invalid filter values/i)).toBeInTheDocument()
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
