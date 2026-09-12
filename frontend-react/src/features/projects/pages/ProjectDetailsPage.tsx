import { Link, useParams } from 'react-router'

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.tsx'
import { useProjectQuery } from '../hooks/useProjectsQueries.ts'

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
  const { data, isLoading, isError, error } = useProjectQuery(projectId)

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
        </CardContent>
      </Card>
    </section>
  )
}
