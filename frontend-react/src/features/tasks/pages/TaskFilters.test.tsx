import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server.ts'
import { TasksPage } from './TasksPage.tsx'

const ALPHA_ID = '00000000-0000-4000-a000-000000000010'

function renderList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(
    [{ path: '/projects/:projectId/tasks', element: <TasksPage /> }],
    { initialEntries: [`/projects/${ALPHA_ID}/tasks`] },
  )
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('Task list search and filters (behavior)', () => {
  it('searches by title/description debounced (behavior)', async () => {
    const user = userEvent.setup()
    renderList()
    await screen.findByText('Fix login bug')

    await user.type(screen.getByLabelText(/^search$/i), 'ci')

    // Settles only on the refetched list: stale list still shows Fix login
    // bug, loading shows neither — all three must hold together.
    await waitFor(() => {
      expect(screen.queryByLabelText(/loading tasks/i)).not.toBeInTheDocument()
      expect(screen.getByText('Setup CI')).toBeInTheDocument()
      expect(screen.queryByText('Fix login bug')).not.toBeInTheDocument()
    })
  })

  it('filters by status select (behavior)', async () => {
    const user = userEvent.setup()
    renderList()
    await screen.findByText('Fix login bug')

    await user.selectOptions(screen.getByLabelText(/^status$/i), 'TODO')

    await waitFor(() => {
      expect(screen.queryByLabelText(/loading tasks/i)).not.toBeInTheDocument()
      expect(screen.getByText('Setup CI')).toBeInTheDocument()
      expect(screen.queryByText('Fix login bug')).not.toBeInTheDocument()
    })
  })

  it('filters by type select (behavior)', async () => {
    const user = userEvent.setup()
    renderList()
    await screen.findByText('Setup CI')

    await user.selectOptions(screen.getByLabelText(/^type$/i), 'BUG')

    await waitFor(() => {
      expect(screen.queryByLabelText(/loading tasks/i)).not.toBeInTheDocument()
      expect(screen.getByText('Fix login bug')).toBeInTheDocument()
      expect(screen.queryByText('Setup CI')).not.toBeInTheDocument()
    })
  })

  it('filters by priority select (behavior)', async () => {
    const user = userEvent.setup()
    renderList()
    await screen.findByText('Fix login bug')

    await user.selectOptions(screen.getByLabelText(/^priority$/i), 'HIGH')

    await waitFor(() => {
      expect(screen.queryByLabelText(/loading tasks/i)).not.toBeInTheDocument()
      expect(screen.getByText('Setup CI')).toBeInTheDocument()
      expect(screen.queryByText('Fix login bug')).not.toBeInTheDocument()
    })
  })

  it('reset clears filters and restores the list (behavior)', async () => {
    const user = userEvent.setup()
    renderList()
    await screen.findByText('Fix login bug')

    await user.selectOptions(screen.getByLabelText(/^status$/i), 'TODO')
    await waitFor(() => {
      expect(screen.queryByLabelText(/loading tasks/i)).not.toBeInTheDocument()
      expect(screen.queryByText('Fix login bug')).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /clear filters/i }))

    await waitFor(() => {
      expect(screen.queryByLabelText(/loading tasks/i)).not.toBeInTheDocument()
      expect(screen.getByText('Fix login bug')).toBeInTheDocument()
    })
  })

  it('shows a distinct empty state for no filter matches (behavior)', async () => {
    const user = userEvent.setup()
    renderList()
    await screen.findByText('Fix login bug')

    await user.type(screen.getByLabelText(/^search$/i), 'zzz-no-such-task')

    expect(await screen.findByText(/no tasks match the current filters/i)).toBeInTheDocument()
  })

  it('changing filters resets to page 1 (behavior)', async () => {
    const user = userEvent.setup()
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
    renderList()
    await screen.findByText('Task 1')

    await user.click(screen.getByRole('button', { name: /^next$/i }))
    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/^status$/i), 'TODO')
    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument()
  })
})
