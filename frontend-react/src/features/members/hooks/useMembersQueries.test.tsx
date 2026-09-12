import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server.ts'
import { useAddMemberMutation, useMembersQuery, useRemoveMemberMutation } from './useMembersQueries.ts'

const ALPHA_ID = '00000000-0000-4000-a000-000000000010'
const OWNER_ID = '00000000-0000-4000-a000-000000000001'
const NEW_ID = '00000000-0000-4000-a000-000000000003'

type AxiosishError = { response?: { status?: number } } | null

function statusOf(error: unknown): number | undefined {
  return (error as AxiosishError)?.response?.status
}

function MembersProbe({ projectId }: { projectId: string }) {
  const members = useMembersQuery(projectId)
  const add = useAddMemberMutation(projectId)
  const remove = useRemoveMemberMutation(projectId)
  return (
    <div>
      {members.isLoading && <p>Loading members…</p>}
      {members.isError && (
        <p role="alert">Failed to load members ({statusOf(members.error)}).</p>
      )}
      <ul>
        {members.data?.data.map((m) => (
          <li key={m.id}>
            {m.email} ({m.role})
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => add.mutate({ email: 'new@example.com' })}>
        Add new member
      </button>
      <button type="button" onClick={() => add.mutate({ email: 'member@example.com' })}>
        Add existing member
      </button>
      <button type="button" onClick={() => add.mutate({ email: 'ghost@example.com' })}>
        Add unknown user
      </button>
      <button type="button" onClick={() => remove.mutate(NEW_ID)}>
        Remove new member
      </button>
      <button type="button" onClick={() => remove.mutate(OWNER_ID)}>
        Remove owner
      </button>
      {add.isError && <p role="alert">Add failed ({statusOf(add.error)}).</p>}
      {remove.isError && <p role="alert">Remove failed ({statusOf(remove.error)}).</p>}
    </div>
  )
}

function renderProbe(projectId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MembersProbe projectId={projectId} />
    </QueryClientProvider>,
  )
}

describe('Project members query + mutations (behavior)', () => {
  it('lists members with roles (behavior)', async () => {
    renderProbe(ALPHA_ID)

    expect(await screen.findByText('test@example.com (OWNER)')).toBeInTheDocument()
    expect(screen.getByText('member@example.com (MEMBER)')).toBeInTheDocument()
  })

  it('adds a new member by email and refreshes the list (behavior)', async () => {
    const user = userEvent.setup()
    renderProbe(ALPHA_ID)
    await screen.findByText('member@example.com (MEMBER)')

    await user.click(screen.getByRole('button', { name: /add new member/i }))

    expect(await screen.findByText('new@example.com (MEMBER)')).toBeInTheDocument()
  })

  it('surfaces 409 when adding an existing member (behavior)', async () => {
    const user = userEvent.setup()
    renderProbe(ALPHA_ID)
    await screen.findByText('member@example.com (MEMBER)')

    await user.click(screen.getByRole('button', { name: /add existing member/i }))

    expect(await screen.findByText('Add failed (409).')).toBeInTheDocument()
  })

  it('surfaces 404 when adding an unknown user (behavior)', async () => {
    const user = userEvent.setup()
    renderProbe(ALPHA_ID)
    await screen.findByText('member@example.com (MEMBER)')

    await user.click(screen.getByRole('button', { name: /add unknown user/i }))

    expect(await screen.findByText('Add failed (404).')).toBeInTheDocument()
  })

  it('removes a member and refreshes the list (behavior)', async () => {
    const user = userEvent.setup()
    renderProbe(ALPHA_ID)
    await screen.findByText('new@example.com (MEMBER)')

    await user.click(screen.getByRole('button', { name: /remove new member/i }))

    await waitFor(() =>
      expect(screen.queryByText('new@example.com (MEMBER)')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('member@example.com (MEMBER)')).toBeInTheDocument()
  })

  it('surfaces 400 when removing the owner and keeps the owner listed (behavior)', async () => {
    const user = userEvent.setup()
    renderProbe(ALPHA_ID)
    await screen.findByText('test@example.com (OWNER)')

    await user.click(screen.getByRole('button', { name: /remove owner/i }))

    expect(await screen.findByText('Remove failed (400).')).toBeInTheDocument()
    expect(screen.getByText('test@example.com (OWNER)')).toBeInTheDocument()
  })

  it('surfaces 404 for an unknown project (behavior)', async () => {
    server.use(
      http.get('*/api/v1/projects/:projectId/members', () =>
        HttpResponse.json(
          {
            type: 'https://api.example.com/problems/not-found',
            title: 'Not found',
            status: 404,
            detail: 'Project not found',
            instance: '/api/v1/projects/unknown/members',
          },
          { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderProbe('unknown')

    expect(await screen.findByText('Failed to load members (404).')).toBeInTheDocument()
  })
})
