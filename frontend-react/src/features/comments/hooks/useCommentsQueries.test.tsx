import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { useAddCommentMutation, useCommentsQuery } from './useCommentsQueries.ts'

const ALPHA_ID = '00000000-0000-4000-a000-000000000010'
const TASK_A10 = '00000000-0000-4000-a000-000000000a10'

type AxiosishError = { response?: { status?: number } } | null

function statusOf(error: unknown): number | undefined {
  return (error as AxiosishError)?.response?.status
}

function CommentsProbe({ projectId, taskId }: { projectId: string; taskId: string }) {
  const comments = useCommentsQuery(projectId, taskId)
  const add = useAddCommentMutation(projectId, taskId)
  return (
    <div>
      {comments.isLoading && <p>Loading comments…</p>}
      {comments.isError && (
        <p role="alert">Failed to load comments ({statusOf(comments.error)}).</p>
      )}
      <ul>
        {comments.data?.data.map((c) => (
          <li key={c.id}>{c.content}</li>
        ))}
      </ul>
      <button type="button" onClick={() => add.mutate({ content: 'Nice work!' })}>
        Add comment
      </button>
      <button type="button" onClick={() => add.mutate({ content: '' })}>
        Add empty comment
      </button>
      {add.isError && <p role="alert">Add failed ({statusOf(add.error)}).</p>}
    </div>
  )
}

function renderProbe(projectId: string, taskId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <CommentsProbe projectId={projectId} taskId={taskId} />
    </QueryClientProvider>,
  )
}

describe('Task comments query + mutations (behavior)', () => {
  it('lists comments (behavior)', async () => {
    renderProbe(ALPHA_ID, TASK_A10)

    expect(await screen.findByText('API integration is complete.')).toBeInTheDocument()
    expect(screen.getByText('Reviewed, looks good.')).toBeInTheDocument()
  })

  it('adds a comment and refreshes the list (behavior)', async () => {
    const user = userEvent.setup()
    renderProbe(ALPHA_ID, TASK_A10)
    await screen.findByText('Reviewed, looks good.')

    await user.click(screen.getByRole('button', { name: /add comment$/i }))

    expect(await screen.findByText('Nice work!')).toBeInTheDocument()
  })

  it('surfaces 422 when adding an empty comment (behavior)', async () => {
    const user = userEvent.setup()
    renderProbe(ALPHA_ID, TASK_A10)
    await screen.findByText('Nice work!')

    await user.click(screen.getByRole('button', { name: /add empty comment/i }))

    expect(await screen.findByText('Add failed (422).')).toBeInTheDocument()
  })

  it('surfaces 404 for an unknown task (behavior)', async () => {
    renderProbe(ALPHA_ID, '00000000-0000-4000-a000-00000000ffff')

    expect(await screen.findByText('Failed to load comments (404).')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByText('API integration is complete.')).not.toBeInTheDocument(),
    )
  })
})
