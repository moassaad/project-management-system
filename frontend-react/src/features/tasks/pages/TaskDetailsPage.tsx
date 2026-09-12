import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { Button } from '../../../components/ui/Button.tsx'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.tsx'
import { useAuthStore } from '../../auth/store/authStore.ts'
import { CommentsSection } from '../../comments/components/CommentsSection.tsx'
import { useProjectQuery } from '../../projects/hooks/useProjectsQueries.ts'
import { useDeleteTaskMutation, useTaskQuery } from '../hooks/useTasksQueries.ts'
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
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useTaskQuery(projectId, taskId)
  const { data: project } = useProjectQuery(projectId)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const deleteMutation = useDeleteTaskMutation(projectId)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  // Owner/assignee gating is UX-only; backend authorization remains authoritative
  // (business-rules 2.4: owner may edit/delete any task, assignee their own).
  const isOwner = !!currentUserId && !!project && currentUserId === project.ownerId
  const isAssignee = !!currentUserId && !!data.assigneeId && currentUserId === data.assigneeId
  const canModify = isOwner || isAssignee

  const handleDelete = async () => {
    setDeleteError(null)
    try {
      await deleteMutation.mutateAsync(taskId)
      await navigate(`/projects/${projectId}/tasks`)
    } catch (err) {
      const status = getStatus(err)
      if (status === 401) {
        setDeleteError('You are not authenticated. Please sign in again.')
      } else if (status === 403) {
        setDeleteError('Only the project owner or the assignee can delete this task.')
      } else if (status === 404) {
        setDeleteError('Task not found.')
      } else {
        setDeleteError('Unable to delete task. Please try again.')
      }
    }
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
          {canModify ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                to={`/projects/${projectId}/tasks/${taskId}/edit`}
                className="inline-flex h-8 items-center rounded-md border border-gray-300 bg-gray-100 px-3 text-sm font-medium text-gray-900 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Edit
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDeleteError(null)
                  setConfirmingDelete(true)
                }}
              >
                Delete
              </Button>
            </div>
          ) : null}
          {deleteError ? (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {deleteError}
            </p>
          ) : null}
        </CardContent>
      </Card>
      <CommentsSection projectId={projectId} taskId={taskId} />
      {canModify && confirmingDelete ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label={`Delete ${data.title}`}
          aria-describedby="delete-task-description"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <p id="delete-task-description" className="text-sm text-gray-900">
            Delete task “{data.title}”? This action cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void handleDelete()}
              disabled={deleteMutation.isPending}
              aria-label={`Confirm delete ${data.title}`}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Confirm delete'}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
