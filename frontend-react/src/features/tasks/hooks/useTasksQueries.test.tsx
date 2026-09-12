import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useTaskQuery,
  useTasksQuery,
  useUpdateTaskMutation,
} from './useTasksQueries.ts'

const ALPHA_ID = '00000000-0000-4000-a000-000000000010'
const CREATED_ID = '00000000-0000-4000-a000-000000000a30'
const NON_MEMBER_ID = '00000000-0000-4000-a000-000000000099'

type AxiosishError = { response?: { status?: number } } | null

function statusOf(error: unknown): number | undefined {
  return (error as AxiosishError)?.response?.status
}

function TasksProbe({ projectId, taskId }: { projectId: string; taskId?: string }) {
  const list = useTasksQuery(projectId)
  const single = useTaskQuery(projectId, taskId ?? '')
  const create = useCreateTaskMutation(projectId)
  const update = useUpdateTaskMutation(projectId, CREATED_ID)
  const remove = useDeleteTaskMutation(projectId)
  return (
    <div>
      {list.isLoading && <p>Loading tasks…</p>}
      {list.isError && <p role="alert">Failed to load tasks ({statusOf(list.error)}).</p>}
      <ul>
        {list.data?.data.map((t) => (
          <li key={t.id}>
            {t.title} ({t.status}/{t.priority})
          </li>
        ))}
      </ul>
      {single.data ? <p>Single: {single.data.title}</p> : null}
      {single.isError ? (
        <p role="alert">Failed to load task ({statusOf(single.error)}).</p>
      ) : null}
      <button type="button" onClick={() => create.mutate({ title: 'Review PR' })}>
        Create task
      </button>
      <button type="button" onClick={() => create.mutate({ title: '' })}>
        Create without title
      </button>
      <button
        type="button"
        onClick={() => create.mutate({ title: 'Bad assign', assigneeId: NON_MEMBER_ID })}
      >
        Create with non-member assignee
      </button>
      <button type="button" onClick={() => update.mutate({ title: 'Review PR (updated)' })}>
        Update created task
      </button>
      <button type="button" onClick={() => remove.mutate(CREATED_ID)}>
        Delete created task
      </button>
      {create.isError && <p role="alert">Create failed ({statusOf(create.error)}).</p>}
      {update.isError && <p role="alert">Update failed ({statusOf(update.error)}).</p>}
      {remove.isError && <p role="alert">Delete failed ({statusOf(remove.error)}).</p>}
    </div>
  )
}

function renderProbe(projectId: string, taskId?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TasksProbe projectId={projectId} taskId={taskId} />
    </QueryClientProvider>,
  )
}

describe('Project tasks query + mutations (behavior)', () => {
  it('lists tasks with status and priority (behavior)', async () => {
    renderProbe(ALPHA_ID)

    expect(await screen.findByText('Setup CI (TODO/HIGH)')).toBeInTheDocument()
    expect(screen.getByText('Fix login bug (IN_PROGRESS/MEDIUM)')).toBeInTheDocument()
  })

  it('loads a single task (behavior)', async () => {
    renderProbe(ALPHA_ID, '00000000-0000-4000-a000-000000000a10')

    expect(await screen.findByText('Single: Setup CI')).toBeInTheDocument()
  })

  it('creates a task with defaults and refreshes the list (behavior)', async () => {
    const user = userEvent.setup()
    renderProbe(ALPHA_ID)
    await screen.findByText('Setup CI (TODO/HIGH)')

    await user.click(screen.getByRole('button', { name: /create task$/i }))

    expect(await screen.findByText('Review PR (TODO/MEDIUM)')).toBeInTheDocument()
  })

  it('surfaces 422 when creating without a title (behavior)', async () => {
    const user = userEvent.setup()
    renderProbe(ALPHA_ID)
    await screen.findByText('Setup CI (TODO/HIGH)')

    await user.click(screen.getByRole('button', { name: /create without title/i }))

    expect(await screen.findByText('Create failed (422).')).toBeInTheDocument()
  })

  it('surfaces 422 when assignee is not a member (behavior)', async () => {
    const user = userEvent.setup()
    renderProbe(ALPHA_ID)
    await screen.findByText('Setup CI (TODO/HIGH)')

    await user.click(screen.getByRole('button', { name: /non-member assignee/i }))

    expect(await screen.findByText('Create failed (422).')).toBeInTheDocument()
  })

  it('updates a task and refreshes (behavior)', async () => {
    const user = userEvent.setup()
    renderProbe(ALPHA_ID)
    await screen.findByText('Review PR (TODO/MEDIUM)')

    await user.click(screen.getByRole('button', { name: /update created task/i }))

    expect(await screen.findByText('Review PR (updated) (TODO/MEDIUM)')).toBeInTheDocument()
  })

  it('deletes a task and refreshes the list (behavior)', async () => {
    const user = userEvent.setup()
    renderProbe(ALPHA_ID)
    await screen.findByText('Review PR (updated) (TODO/MEDIUM)')

    await user.click(screen.getByRole('button', { name: /delete created task/i }))

    await waitFor(() =>
      expect(screen.queryByText(/Review PR(\(updated\))? \(TODO\/MEDIUM\)/)).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Setup CI (TODO/HIGH)')).toBeInTheDocument()
  })

  it('surfaces 404 for an unknown task (behavior)', async () => {
    renderProbe(ALPHA_ID, '00000000-0000-4000-a000-00000000ffff')

    expect(await screen.findByText('Failed to load task (404).')).toBeInTheDocument()
  })
})
