import { Link } from 'react-router'

import { Button } from '../../../components/ui/Button.tsx'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.tsx'
import { TaskBadges } from '../../tasks/components/TaskBadges.tsx'
import { useDashboardQuery } from '../hooks/useDashboardQuery.ts'

function getStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response
    return response?.status
  }
  return undefined
}

function errorMessage(status: number | undefined): string {
  if (status === 401) return 'You are not authenticated. Please sign in again.'
  if (status === 403) return 'You do not have access to dashboard data.'
  return 'Unable to load dashboard. Please try again.'
}

/**
 * Dashboard page at /dashboard (protected).
 * My Projects + My Tasks (assigned to current user) + basic counts, composed
 * client-side via useDashboardQuery. Loading skeletons, empty states,
 * status-based error. No analytics charts (out of scope per mvp.md:61).
 */
export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboardQuery()

  if (isLoading) {
    return (
      <section aria-label="Dashboard">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div aria-label="Loading dashboard" className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" aria-hidden="true" />
          ))}
          <p className="text-sm text-gray-500">Loading dashboard…</p>
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section aria-label="Dashboard">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{errorMessage(getStatus(error))}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </section>
    )
  }

  const projects = data?.projects ?? []
  const myTasks = data?.myTasks ?? []
  const counts = data?.counts ?? { projectCount: 0, taskCount: 0, todoCount: 0, doneCount: 0 }
  const stats = [
    { label: 'Projects', value: counts.projectCount },
    { label: 'Tasks', value: counts.taskCount },
    { label: 'To do', value: counts.todoCount },
    { label: 'Done', value: counts.doneCount },
  ]

  return (
    <section aria-label="Dashboard">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Dashboard counts">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mt-6 text-lg font-semibold text-gray-900">My Projects</h2>
      {projects.length === 0 ? (
        <Card className="mt-3">
          <CardContent>
            <p className="text-sm text-gray-600">No projects yet.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="mt-3 space-y-3" aria-label="My projects">
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
              </Card>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-6 text-lg font-semibold text-gray-900">My Tasks</h2>
      {myTasks.length === 0 ? (
        <Card className="mt-3">
          <CardContent>
            <p className="text-sm text-gray-600">No tasks assigned to you.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="mt-3 space-y-3" aria-label="My tasks">
          {myTasks.map((task) => (
            <li key={task.id}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Link
                      to={`/projects/${task.projectId}/tasks/${task.id}`}
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
      )}
    </section>
  )
}
