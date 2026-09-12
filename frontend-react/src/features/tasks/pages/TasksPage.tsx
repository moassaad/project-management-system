import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { Button } from '../../../components/ui/Button.tsx'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.tsx'
import { useTasksQuery } from '../hooks/useTasksQueries.ts'
import { TaskBadges } from '../components/TaskBadges.tsx'

function getStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response
    return response?.status
  }
  return undefined
}

function errorMessage(status: number | undefined): string {
  if (status === 401) return 'You are not authenticated. Please sign in again.'
  if (status === 403) return 'You do not have access to these tasks.'
  if (status === 404) return 'Project not found.'
  return 'Unable to load tasks. Please try again.'
}

/**
 * Project tasks list page at /projects/:projectId/tasks (protected).
 * Uses useTasksQuery with pagination; loading skeletons, empty, error
 * (status-based). No search/filter (deferred to Sprint 010).
 */
export function TasksPage() {
  const { projectId = '' } = useParams()
  const [page, setPage] = useState(1)
  const perPage = 20
  const { data, isLoading, isError, error, refetch } = useTasksQuery(projectId, page, perPage)

  if (isLoading) {
    return (
      <section aria-label="Tasks">
        <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
        <div aria-label="Loading tasks" className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" aria-hidden="true" />
          ))}
          <p className="text-sm text-gray-500">Loading tasks…</p>
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section aria-label="Tasks">
        <Link
          to={`/projects/${projectId}`}
          className="rounded text-sm text-blue-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Back to project
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-gray-900">Tasks</h1>
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{errorMessage(getStatus(error))}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </section>
    )
  }

  const tasks = data?.data ?? []
  const meta = data?.meta

  if (tasks.length === 0) {
    return (
      <section aria-label="Tasks">
        <Link
          to={`/projects/${projectId}`}
          className="rounded text-sm text-blue-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Back to project
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-gray-900">Tasks</h1>
        <Link
        to={`/projects/${projectId}/tasks/new`}
        className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        New Task
      </Link>
        <Card className="mt-4">
          <CardContent>
            <p className="text-sm text-gray-600">No tasks yet.</p>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section aria-label="Tasks">
      <Link
        to={`/projects/${projectId}`}
        className="rounded text-sm text-blue-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Back to project
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-gray-900">Tasks</h1>
      <Link
        to={`/projects/${projectId}/tasks/new`}
        className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        New Task
      </Link>
      <ul className="mt-4 space-y-3">
        {tasks.map((task) => (
          <li key={task.id}>
            <Card>
              <CardHeader>
                <CardTitle>
                  <Link
                    to={`/projects/${projectId}/tasks/${task.id}`}
                    className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {task.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TaskBadges status={task.status} priority={task.priority} type={task.type} />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      {meta ? (
        <nav aria-label="Tasks pagination" className="mt-4 flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <p className="text-sm text-gray-600" aria-live="polite">
            Page {meta.currentPage} of {meta.lastPage}
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={meta.currentPage >= meta.lastPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </nav>
      ) : null}
    </section>
  )
}
