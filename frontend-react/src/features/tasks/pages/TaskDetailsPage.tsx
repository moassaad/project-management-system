import { Link, useParams } from 'react-router'

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.tsx'
import { useTaskQuery } from '../hooks/useTasksQueries.ts'
import { TaskBadges } from '../components/TaskBadges.tsx'

function getStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response
    return response?.status
  }
  return undefined
}

/**
 * Task details page at /projects/:projectId/tasks/:taskId (protected).
 * Uses useTaskQuery; 404 handling via status (not detail parsing).
 */
export function TaskDetailsPage() {
  const { projectId = '', taskId = '' } = useParams()
  const { data, isLoading, isError, error } = useTaskQuery(projectId, taskId)

  if (isLoading) {
    return (
      <section aria-label="Task details">
        <div aria-label="Loading task" className="space-y-3">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-100" aria-hidden="true" />
          <div className="h-24 animate-pulse rounded-lg bg-gray-100" aria-hidden="true" />
          <p className="text-sm text-gray-500">Loading task…</p>
        </div>
      </section>
    )
  }

  if (isError) {
    const status = getStatus(error)
    return (
      <section aria-label="Task details">
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4">
          {status === 404 ? (
            <p className="text-sm text-red-700">Task not found.</p>
          ) : status === 401 ? (
            <p className="text-sm text-red-700">You are not authenticated. Please sign in again.</p>
          ) : status === 403 ? (
            <p className="text-sm text-red-700">You do not have access to this task.</p>
          ) : (
            <p className="text-sm text-red-700">Unable to load task. Please try again.</p>
          )}
          <Link
            to={`/projects/${projectId}/tasks`}
            className="mt-3 inline-block rounded text-sm text-blue-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Back to tasks
          </Link>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section aria-label="Task details">
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">Task not found.</p>
        </div>
      </section>
    )
  }

  return (
    <section aria-label="Task details">
      <Link
        to={`/projects/${projectId}/tasks`}
        className="rounded text-sm text-blue-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Back to tasks
      </Link>
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>{data.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskBadges status={data.status} priority={data.priority} type={data.type} />
          {data.description ? (
            <p className="mt-3">{data.description}</p>
          ) : (
            <p className="mt-3 italic text-gray-500">No description.</p>
          )}
          <dl className="mt-3 space-y-1 text-xs text-gray-500">
            <div>
              <dt className="inline font-medium">Assignee: </dt>
              <dd className="inline">{data.assigneeId ?? 'Unassigned'}</dd>
            </div>
            {data.dueDate ? (
              <div>
                <dt className="inline font-medium">Due: </dt>
                <dd className="inline">{data.dueDate}</dd>
              </div>
            ) : null}
            <div>
              <dt className="inline font-medium">Created: </dt>
              <dd className="inline">{data.createdAt}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </section>
  )
}
