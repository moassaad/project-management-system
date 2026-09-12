import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { Button } from '../../../components/ui/Button.tsx'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { useDebouncedValue } from '../hooks/useDebouncedValue.ts'
import { useTasksQuery } from '../hooks/useTasksQueries.ts'
import { TaskBadges } from '../components/TaskBadges.tsx'
import type { TaskPriority, TaskStatus, TaskType } from '../types/task.types.ts'

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

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

/**
 * Project tasks list page at /projects/:projectId/tasks (protected).
 * Search (debounced 300ms) + status/type/priority selects travel as query
 * params via useTasksQuery; any filter change resets to page 1. Empty states
 * distinguish "no tasks at all" from "no matches for current filters".
 *
 * State choice (FE-S010-01): local component state, not URL search params —
 * consistent with the existing local page state on this and the projects
 * list; no deep-link requirement in scope.
 */
export function TasksPage() {
  const { projectId = '' } = useParams()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [priority, setPriority] = useState('')
  const perPage = 20

  const debouncedSearch = useDebouncedValue(search)
  const filters = {
    search: debouncedSearch || undefined,
    status: (status || undefined) as TaskStatus | undefined,
    type: (type || undefined) as TaskType | undefined,
    priority: (priority || undefined) as TaskPriority | undefined,
  }
  const filtersActive = !!debouncedSearch || !!status || !!type || !!priority

  const { data, isLoading, isError, error, refetch } = useTasksQuery(
    projectId,
    page,
    perPage,
    filters,
  )

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setPage(1)
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatus('')
    setType('')
    setPriority('')
    setPage(1)
  }

  const filterControls = (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Input
        id="task-filter-search"
        label="Search"
        type="search"
        placeholder="Search title or description…"
        value={search}
        onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="task-filter-status" className="text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="task-filter-status"
          className={selectClassName}
          value={status}
          onChange={(e) => handleFilterChange(setStatus)(e.target.value)}
        >
          <option value="">All</option>
          <option value="TODO">TODO</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="DONE">DONE</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="task-filter-type" className="text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          id="task-filter-type"
          className={selectClassName}
          value={type}
          onChange={(e) => handleFilterChange(setType)(e.target.value)}
        >
          <option value="">All</option>
          <option value="FEATURE">FEATURE</option>
          <option value="BUG">BUG</option>
          <option value="IMPROVEMENT">IMPROVEMENT</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="task-filter-priority" className="text-sm font-medium text-gray-700">
          Priority
        </label>
        <select
          id="task-filter-priority"
          className={selectClassName}
          value={priority}
          onChange={(e) => handleFilterChange(setPriority)(e.target.value)}
        >
          <option value="">All</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
        </select>
      </div>
      <div className="flex items-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleClearFilters}
          disabled={!search && !status && !type && !priority}
        >
          Clear filters
        </Button>
      </div>
    </div>
  )

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
        {filterControls}
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
        {filterControls}
        <Card className="mt-4">
          <CardContent>
            {filtersActive ? (
              <p className="text-sm text-gray-600">No tasks match the current filters.</p>
            ) : (
              <p className="text-sm text-gray-600">No tasks yet.</p>
            )}
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
      {filterControls}
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
