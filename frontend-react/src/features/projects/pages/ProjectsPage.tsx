import { useState } from 'react'
import { Link } from 'react-router'

import { Button } from '../../../components/ui/Button.tsx'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.tsx'
import { useProjectsQuery } from '../hooks/useProjectsQueries.ts'

function getStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response
    return response?.status
  }
  return undefined
}

function errorMessage(status: number | undefined): string {
  if (status === 401) return 'You are not authenticated. Please sign in again.'
  if (status === 403) return 'You do not have access to these projects.'
  return 'Unable to load projects. Please try again.'
}

/**
 * Projects list page at /projects (protected).
 * Uses useProjectsQuery with pagination; loading skeletons, empty, error (status-based).
 */
export function ProjectsPage() {
  const [page, setPage] = useState(1)
  const perPage = 20
  const { data, isLoading, isError, error, refetch } = useProjectsQuery(page, perPage)

  if (isLoading) {
    return (
      <section aria-label="Projects">
        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
        <div aria-label="Loading projects" className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" aria-hidden="true" />
          ))}
          <p className="text-sm text-gray-500">Loading projects…</p>
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section aria-label="Projects">
        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{errorMessage(getStatus(error))}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </section>
    )
  }

  const projects = data?.data ?? []
  const meta = data?.meta

  if (projects.length === 0) {
    return (
      <section aria-label="Projects">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <Link
            to="/projects/new"
            className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            New Project
          </Link>
        </div>
        <Card className="mt-4">
          <CardContent>
            <p className="text-sm text-gray-600">No projects yet.</p>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section aria-label="Projects">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
        <Link
          to="/projects/new"
          className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          New Project
        </Link>
      </div>
      <ul className="mt-4 space-y-3">
        {projects.map((project) => (
          <li key={project.id}>
            <Card>
              <CardHeader>
                <CardTitle>
                  <Link
                    to={`/projects/${project.id}`}
                    className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {project.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.description ? <p>{project.description}</p> : null}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      {meta ? (
        <nav aria-label="Projects pagination" className="mt-4 flex items-center gap-3">
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
