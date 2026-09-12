import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '../../auth/store/authStore.ts'
import { ProjectDetailsPage } from '../../projects/pages/ProjectDetailsPage.tsx'

const OWNER_ID = '00000000-0000-4000-a000-000000000001'
const ALPHA_ID = '00000000-0000-4000-a000-000000000010'

function renderDetails(projectId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(
    [{ path: '/projects/:projectId', element: <ProjectDetailsPage /> }],
    { initialEntries: [`/projects/${projectId}`] },
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

describe('Members section on project details (behavior)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('owner sees members list with roles and the add form (behavior)', async () => {
    signInAsOwner()
    renderDetails(ALPHA_ID)

    expect(await screen.findByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('member@example.com')).toBeInTheDocument()
    expect(screen.getByRole('form', { name: /add member form/i })).toBeInTheDocument()
  })

  it('add shows client validation when neither email nor user ID given (behavior)', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    renderDetails(ALPHA_ID)
    await screen.findByText('member@example.com')

    await user.click(screen.getByRole('button', { name: /^add member$/i }))

    expect(
      await screen.findByText(/provide a user id or an email address/i),
    ).toBeInTheDocument()
  })

  it('owner adds a member by email and the list refreshes (behavior)', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    renderDetails(ALPHA_ID)
    await screen.findByText('member@example.com')

    await user.type(screen.getByLabelText(/^email$/i), 'new@example.com')
    await user.click(screen.getByRole('button', { name: /^add member$/i }))

    expect(await screen.findByText('new@example.com')).toBeInTheDocument()
  })

  it('add maps 409 already-member to a UI message (behavior)', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    renderDetails(ALPHA_ID)
    await screen.findByText('member@example.com')

    await user.type(screen.getByLabelText(/^email$/i), 'member@example.com')
    await user.click(screen.getByRole('button', { name: /^add member$/i }))

    expect(await screen.findByText(/already a project member/i)).toBeInTheDocument()
  })

  it('add maps 404 unknown user to a UI message (behavior)', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    renderDetails(ALPHA_ID)
    await screen.findByText('member@example.com')

    await user.type(screen.getByLabelText(/^email$/i), 'ghost@example.com')
    await user.click(screen.getByRole('button', { name: /^add member$/i }))

    expect(await screen.findByText(/user not found/i)).toBeInTheDocument()
  })

  it('remove requires explicit confirmation showing the member email (behavior)', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    renderDetails(ALPHA_ID)
    await screen.findByText('new@example.com')

    await user.click(screen.getByRole('button', { name: 'Remove new@example.com' }))

    expect(
      await screen.findByRole('alertdialog', { name: /remove new@example.com/i }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /confirm remove/i }))

    await waitFor(() =>
      expect(screen.queryByText('new@example.com')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('member@example.com')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('non-owner sees the list but no add/remove controls (behavior)', async () => {
    signInAsNonOwner()
    renderDetails(ALPHA_ID)

    expect(await screen.findByText('member@example.com')).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: /add member form/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /remove .*@.*\..*/i }),
    ).not.toBeInTheDocument()
  })
})
