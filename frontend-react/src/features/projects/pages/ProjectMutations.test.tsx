import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, beforeEach } from 'vitest'

import { server } from '../../../../tests/mocks/server.ts'
import { useAuthStore } from '../../auth/store/authStore.ts'
import { ProjectCreatePage } from './ProjectCreatePage.tsx'
import { ProjectDetailsPage } from './ProjectDetailsPage.tsx'
import { ProjectEditPage } from './ProjectEditPage.tsx'
import { ProjectsPage } from './ProjectsPage.tsx'

const OWNER_ID = '00000000-0000-4000-a000-000000000001'
const ALPHA_ID = '00000000-0000-4000-a000-000000000010'

function renderWithRouter(initialEntries: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(
    [
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/projects/new', element: <ProjectCreatePage /> },
      { path: '/projects/:projectId', element: <ProjectDetailsPage /> },
      { path: '/projects/:projectId/edit', element: <ProjectEditPage /> },
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

describe('Project create/edit validation + delete confirmation (behavior)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('create shows client validation error for empty name (behavior)', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    renderWithRouter(['/projects/new'])

    await user.click(screen.getByRole('button', { name: /create project/i }))

    expect(await screen.findByText(/project name is required/i)).toBeInTheDocument()
  })

  it('create maps server 422 to the name field (behavior)', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    server.use(
      http.post('*/api/v1/projects', () =>
        HttpResponse.json(
          {
            type: 'https://api.example.com/problems/validation-error',
            title: 'Validation failed',
            status: 422,
            detail: 'Invalid',
            errors: [{ detail: 'Name already taken', pointer: '#/name' }],
          },
          { status: 422, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderWithRouter(['/projects/new'])

    await user.type(screen.getByLabelText(/name/i), 'Alpha Project')
    await user.click(screen.getByRole('button', { name: /create project/i }))

    expect(await screen.findByText(/name already taken/i)).toBeInTheDocument()
  })

  it('edit shows client validation handled by schema (behavior)', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    renderWithRouter([`/projects/${ALPHA_ID}/edit`])

    expect(await screen.findByDisplayValue('Alpha Project')).toBeInTheDocument()
    const nameInput = screen.getByLabelText(/name/i)
    await user.clear(nameInput)
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText(/project name is required/i)).toBeInTheDocument()
  })

  it('delete requires explicit confirmation showing the project name, then redirects (behavior)', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    renderWithRouter([`/projects/${ALPHA_ID}`])

    expect(await screen.findByText('Alpha Project')).toBeInTheDocument()

    // No dialog before clicking Delete
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    // Confirmation dialog shows the project name explicitly
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Alpha Project')

    await user.click(screen.getByRole('button', { name: /confirm delete/i }))

    // Redirects to /projects list after deletion
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
    expect(await screen.findByText('Beta Project')).toBeInTheDocument()
  })

  it('hides edit/delete for non-owners (UX-only gating, behavior)', async () => {
    // NOTE: uses Beta (not Alpha) because the delete test above removes Alpha
    // from the shared MSW in-memory store within this file's worker.
    signInAsNonOwner()
    renderWithRouter(['/projects/00000000-0000-4000-a000-000000000020'])

    expect(await screen.findByText('Beta Project')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument()
  })
})
