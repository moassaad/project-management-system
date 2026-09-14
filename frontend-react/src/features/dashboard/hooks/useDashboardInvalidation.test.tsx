import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '../../auth/store/authStore.ts'
import { useCreateProjectMutation } from '../../projects/hooks/useProjectsQueries.ts'
import { useCreateTaskMutation } from '../../tasks/hooks/useTasksQueries.ts'
import { useDashboardQuery } from './useDashboardQuery.ts'

const MEMBER_ID = '00000000-0000-4000-a000-000000000002'
const ALPHA_ID = '00000000-0000-4000-a000-000000000010'

function DashboardWithMutations({ projectId }: { projectId: string }) {
  const dashboard = useDashboardQuery()
  const createProject = useCreateProjectMutation()
  const createTask = useCreateTaskMutation(projectId)

  if (dashboard.isLoading) return <p>Loading dashboard…</p>
  if (dashboard.isError) return <p role="alert">Failed to load dashboard.</p>

  return (
    <div>
      <p>
        projects:{dashboard.data?.counts.projectCount} tasks:{dashboard.data?.counts.taskCount}
      </p>
      <ul aria-label="dashboard projects">
        {dashboard.data?.projects.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
      <button type="button" onClick={() => createProject.mutate({ name: 'Gamma Project' })}>
        Create project
      </button>
      <button type="button" onClick={() => createTask.mutate({ title: 'New dashboard task' })}>
        Create task
      </button>
    </div>
  )
}

function renderWithClient(projectId = ALPHA_ID) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 30_000 },
      mutations: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardWithMutations projectId={projectId} />
    </QueryClientProvider>,
  )
}

function signInAsMember() {
  useAuthStore.getState().setAuth(
    { id: MEMBER_ID, email: 'member@example.com' },
    'mock-access-token',
  )
}

describe('Dashboard invalidation on project/task mutations (behavior)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('refetches dashboard after project creation and shows updated count (behavior)', async () => {
    const user = userEvent.setup()
    signInAsMember()
    renderWithClient()

    expect(await screen.findByText(/projects:2 tasks:3/)).toBeInTheDocument()
    expect(screen.getByText('Alpha Project')).toBeInTheDocument()
    expect(screen.queryByText('Gamma Project')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /create project/i }))

    expect(await screen.findByText('Gamma Project')).toBeInTheDocument()
    expect(screen.getByText(/projects:3 tasks:3/)).toBeInTheDocument()
  })

  it('refetches dashboard after task creation and shows updated count (behavior)', async () => {
    const user = userEvent.setup()
    signInAsMember()
    renderWithClient()

    // After the previous project-create test, Gamma Project persists in the
    // shared MSW store, so initial count is 3 projects, not 2.
    expect(await screen.findByText(/projects:3 tasks:3/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /create task/i }))

    expect(await screen.findByText(/projects:3 tasks:4/)).toBeInTheDocument()
  })
})
