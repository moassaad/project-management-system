import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server.ts'
import { TaskDetailsPage } from '../../tasks/pages/TaskDetailsPage.tsx'

const ALPHA_ID = '00000000-0000-4000-a000-000000000010'
const TASK_A10 = '00000000-0000-4000-a000-000000000a10'

function renderDetails(projectId: string, taskId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(
    [{ path: '/projects/:projectId/tasks/:taskId', element: <TaskDetailsPage /> }],
    { initialEntries: [`/projects/${projectId}/tasks/${taskId}`] },
  )
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('Comments section on task details (behavior)', () => {
  it('renders comments list and the add form (behavior)', async () => {
    renderDetails(ALPHA_ID, TASK_A10)

    expect(await screen.findByText('API integration is complete.')).toBeInTheDocument()
    expect(screen.getByText('Reviewed, looks good.')).toBeInTheDocument()
    expect(screen.getByRole('form', { name: /add comment form/i })).toBeInTheDocument()
  })

  it('add shows client validation for empty content (behavior)', async () => {
    const user = userEvent.setup()
    renderDetails(ALPHA_ID, TASK_A10)
    await screen.findByText('Reviewed, looks good.')

    await user.click(screen.getByRole('button', { name: /^add comment$/i }))

    expect(await screen.findByText(/comment content is required/i)).toBeInTheDocument()
  })

  it('adds a comment, refreshes the list, and clears the form (behavior)', async () => {
    const user = userEvent.setup()
    renderDetails(ALPHA_ID, TASK_A10)
    await screen.findByText('Reviewed, looks good.')

    await user.type(screen.getByLabelText(/^comment$/i), 'Nice work!')
    await user.click(screen.getByRole('button', { name: /^add comment$/i }))

    expect(await screen.findByText('Nice work!')).toBeInTheDocument()
    expect(screen.getByLabelText(/^comment$/i)).toHaveValue('')
  })

  it('add maps server 422 to the content field (behavior)', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('*/api/v1/projects/:projectId/tasks/:taskId/comments', () =>
        HttpResponse.json(
          {
            type: 'https://api.example.com/problems/validation-error',
            title: 'Validation failed',
            status: 422,
            detail: 'Invalid',
            errors: [{ detail: 'Too short', pointer: '#/content' }],
          },
          { status: 422, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderDetails(ALPHA_ID, TASK_A10)
    await screen.findByText('Reviewed, looks good.')

    await user.type(screen.getByLabelText(/^comment$/i), 'ok')
    await user.click(screen.getByRole('button', { name: /^add comment$/i }))

    expect(await screen.findByText('Too short')).toBeInTheDocument()
  })

  it('shows empty state when no comments (behavior)', async () => {
    server.use(
      http.get('*/api/v1/projects/:projectId/tasks/:taskId/comments', () =>
        HttpResponse.json({ data: [] }),
      ),
    )
    renderDetails(ALPHA_ID, TASK_A10)

    expect(await screen.findByText(/no comments yet/i)).toBeInTheDocument()
  })

  it('shows error state on server failure using status (behavior)', async () => {
    server.use(
      http.get('*/api/v1/projects/:projectId/tasks/:taskId/comments', () =>
        HttpResponse.json(
          {
            type: 'https://api.example.com/problems/server-error',
            title: 'Server error',
            status: 500,
            detail: 'boom',
            instance: `/api/v1/projects/${ALPHA_ID}/tasks/${TASK_A10}/comments`,
          },
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderDetails(ALPHA_ID, TASK_A10)

    expect(await screen.findByText(/unable to load comments/i)).toBeInTheDocument()
  })
})
