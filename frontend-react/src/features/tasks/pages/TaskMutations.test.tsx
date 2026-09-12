import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server.ts'
import { useAuthStore } from '../../auth/store/authStore.ts'
import { TaskCreatePage } from './TaskCreatePage.tsx'
import { TaskDetailsPage } from './TaskDetailsPage.tsx'
import { TaskEditPage } from './TaskEditPage.tsx'
import { TasksPage } from './TasksPage.tsx'

const OWNER_ID = '00000000-0000-4000-a000-000000000001'
const MEMBER_ID = '00000000-0000-4000-a000-000000000002'
const ALPHA_ID = '00000000-0000-4000-a000-000000000010'
const TASK_A10 = '00000000-0000-4000-a000-000000000a10'
const CREATED_ID = '00000000-0000-4000-a000-000000000a30'

function renderWithRouter(initialEntries: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(
    [
      { path: '/projects/:projectId/tasks', element: <TasksPage /> },
      { path: '/projects/:projectId/tasks/new', element: <TaskCreatePage /> },
      { path: '/projects/:projectId/tasks/:taskId', element: <TaskDetailsPage /> },
      { path: '/projects/:projectId/tasks/:taskId/edit', element: <TaskEditPage /> },
    ],
    { initialEntries },
  )
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

function signInAsOwner() {
  useAuthStore.getState().setAuth(
    { id: OWNER_ID, email: 'test@example.com' },
    'mock-access-token',
  )
}

function signInAsNonOwner() {
  useAuthStore.getState().setAuth(
    { id: '00000000-0000-4000-a000-000000000099', email: 'other@example.com' },
    'mock-access-token',
  )
}

describe('Task create/edit validation + assignment + delete confirmation (behavior)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('create shows client validation error for empty title (behavior)', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    renderWithRouter([`/projects/${ALPHA_ID}/tasks/new`])
    await screen.findByRole('form', { name: /task form/i })

    await user.click(screen.getByRole('button', { name: /^create task$/i }))

    expect(await screen.findByText(/task title is required/i)).toBeInTheDocument()
  })

  it('create assignee select lists project members (behavior)', async () => {
    signInAsOwner()
    renderWithRouter([`/projects/${ALPHA_ID}/tasks/new`])

    const select = await screen.findByLabelText(/^assignee$/i)
    expect(select).toBeInTheDocument()
    expect(
      await screen.findByRole('option', { name: 'test@example.com (OWNER)' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'member@example.com (MEMBER)' }),
    ).toBeInTheDocument()
  })

  it('create assigns a member and navigates to details (behavior)', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    renderWithRouter([`/projects/${ALPHA_ID}/tasks/new`])
    await screen.findByRole('form', { name: /task form/i })
    await screen.findByRole('option', { name: 'member@example.com (MEMBER)' })

    await user.type(screen.getByLabelText(/^title$/i), 'Review PR')
    await user.selectOptions(screen.getByLabelText(/^assignee$/i), MEMBER_ID)
    await user.click(screen.getByRole('button', { name: /^create task$/i }))

    expect(await screen.findByText('Review PR')).toBeInTheDocument()
    expect(screen.getByText(MEMBER_ID)).toBeInTheDocument()
  })

  it('create maps server 422 to the title field (behavior)', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    server.use(
      http.post('*/api/v1/projects/:projectId/tasks', () =>
        HttpResponse.json(
          {
            type: 'https://api.example.com/problems/validation-error',
            title: 'Validation failed',
            status: 422,
            detail: 'Invalid',
            errors: [{ detail: 'Title taken', pointer: '#/title' }],
          },
          { status: 422, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderWithRouter([`/projects/${ALPHA_ID}/tasks/new`])
    await screen.findByRole('form', { name: /task form/i })

    await user.type(screen.getByLabelText(/^title$/i), 'Duplicate')
    await user.click(screen.getByRole('button', { name: /^create task$/i }))

    expect(await screen.findByText('Title taken')).toBeInTheDocument()
  })

  it('edit shows client validation error for cleared title (behavior)', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    renderWithRouter([`/projects/${ALPHA_ID}/tasks/${TASK_A10}/edit`])
    await screen.findByRole('form', { name: /task form/i })

    await user.clear(screen.getByLabelText(/^title$/i))
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText(/task title is required/i)).toBeInTheDocument()
  })

  it('delete requires confirmation and redirects to the task list (behavior)', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    renderWithRouter([`/projects/${ALPHA_ID}/tasks/${CREATED_ID}`])
    await screen.findByText('Review PR')

    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    expect(
      await screen.findByRole('alertdialog', { name: /delete review pr/i }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /confirm delete/i }))

    expect(await screen.findByText('Setup CI')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByText('Review PR')).not.toBeInTheDocument(),
    )
  })

  it('hides edit/delete for non-owner non-assignee (behavior)', async () => {
    signInAsNonOwner()
    renderWithRouter([`/projects/${ALPHA_ID}/tasks/${TASK_A10}`])

    expect(await screen.findByText('Setup CI')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument()
  })
})
