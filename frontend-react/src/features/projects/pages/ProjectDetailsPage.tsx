import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { Button } from '../../../components/ui/Button.tsx'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.tsx'
import { useAuthStore } from '../../auth/store/authStore.ts'
import { MembersSection } from '../../members/components/MembersSection.tsx'
import { useDeleteProjectMutation, useProjectQuery } from '../hooks/useProjectsQueries.ts'

function getStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response
    return response?.status
  }
  return undefined
}

/**
 * Project details page at /projects/:projectId (protected).
 * Uses useProjectQuery; 404 handling via status (not detail parsing).
 */
export function ProjectDetailsPage() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useProjectQuery(projectId)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const deleteMutation = useDeleteProjectMutation()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <section aria-label="Project details">
        <div aria-label="Loading project" className="space-y-3">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-100" aria-hidden="true" />
          <div className="h-24 animate-pulse rounded-lg bg-gray-100" aria-hidden="true" />
          <p className="text-sm text-gray-500">Loading project…</p>
        </div>
      </section>
    )
  }

  if (isError) {
    const status = getStatus(error)
    return (
      <section aria-label="Project details">
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4">
          {status === 404 ? (
            <p className="text-sm text-red-700">Project not found.</p>
          ) : status === 401 ? (
            <p className="text-sm text-red-700">You are not authenticated. Please sign in again.</p>
          ) : status === 403 ? (
            <p className="text-sm text-red-700">You do not have access to this project.</p>
          ) : (
            <p className="text-sm text-red-700">Unable to load project. Please try again.</p>
          )}
          <Link
            to="/projects"
            className="mt-3 inline-block rounded text-sm text-blue-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Back to projects
          </Link>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section aria-label="Project details">
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">Project not found.</p>
        </div>
      </section>
    )
  }

  // Owner gating is UX-only; backend authorization remains authoritative.
  const isOwner = !!currentUserId && !!data && currentUserId === data.ownerId

  const handleDelete = async () => {
    setDeleteError(null)
    try {
      await deleteMutation.mutateAsync(projectId)
      await navigate('/projects')
    } catch (err) {
      const status = getStatus(err)
      if (status === 401) {
        setDeleteError('You are not authenticated. Please sign in again.')
      } else if (status === 403) {
        setDeleteError('Only the project owner can delete this project.')
      } else if (status === 404) {
        setDeleteError('Project not found.')
      } else {
        setDeleteError('Unable to delete project. Please try again.')
      }
    }
  }

  return (
    <section aria-label="Project details">
      <Link
        to="/projects"
        className="rounded text-sm text-blue-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Back to projects
      </Link>
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>{data.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.description ? <p>{data.description}</p> : <p className="italic">No description.</p>}
          <dl className="mt-3 space-y-1 text-xs text-gray-500">
            <div>
              <dt className="inline font-medium">Owner: </dt>
              <dd className="inline">{data.ownerId}</dd>
            </div>
            <div>
              <dt className="inline font-medium">Created: </dt>
              <dd className="inline">{data.createdAt}</dd>
            </div>
          </dl>
          {isOwner ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                to={`/projects/${projectId}/edit`}
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
      <div className="mt-4">
        <Link
          to={`/projects/${projectId}/tasks`}
          className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-gray-100 px-4 text-sm font-medium text-gray-900 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          View tasks
        </Link>
      </div>
      <MembersSection projectId={projectId} isOwner={isOwner} />
      {isOwner && confirmingDelete ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label={`Delete ${data.name}`}
          aria-describedby="delete-project-description"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <p id="delete-project-description" className="text-sm text-gray-900">
            Delete project “{data.name}”? This also deletes its tasks and comments. This action
            cannot be undone.
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
              aria-label={`Confirm delete ${data.name}`}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Confirm delete'}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
