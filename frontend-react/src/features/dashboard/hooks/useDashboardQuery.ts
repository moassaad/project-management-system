import { useQuery } from '@tanstack/react-query'

import { useAuthStore } from '../../auth/store/authStore.ts'
import { listProjects } from '../../projects/api/projects.api.ts'
import type { Project } from '../../projects/types/project.types.ts'
import { listTasks } from '../../tasks/api/tasks.api.ts'
import type { Task } from '../../tasks/types/task.types.ts'
import type { DashboardData } from '../types/dashboard.types.ts'

/**
 * Dashboard composition query — reuses projects + tasks feature APIs
 * (no direct fetch, no new endpoints). Fetches caller projects, then tasks
 * per project; both paginated and bounded so one slow project cannot stall
 * the dashboard. Derives My Tasks (assigneeId === current user) and basic
 * counts. Server-state via TanStack Query (no Zustand duplication).
 */

const PROJECTS_PER_PAGE = 20
const MAX_PROJECT_PAGES = 5
const TASKS_PER_PAGE = 20
const MAX_TASK_PAGES = 3

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (userId: string) => [...dashboardKeys.all, 'summary', userId] as const,
}

async function listAllProjects(): Promise<Project[]> {
  const all: Project[] = []
  for (let page = 1; page <= MAX_PROJECT_PAGES; page += 1) {
    const res = await listProjects({ page, perPage: PROJECTS_PER_PAGE })
    all.push(...res.data)
    if (page >= res.meta.lastPage) break
  }
  return all
}

async function listProjectTasks(projectId: string): Promise<Task[]> {
  const all: Task[] = []
  for (let page = 1; page <= MAX_TASK_PAGES; page += 1) {
    const res = await listTasks(projectId, { page, perPage: TASKS_PER_PAGE })
    all.push(...res.data)
    if (page >= res.meta.lastPage) break
  }
  return all
}

async function buildDashboard(userId: string): Promise<DashboardData> {
  const projects = await listAllProjects()
  const taskLists = await Promise.all(projects.map((p) => listProjectTasks(p.id)))
  const tasks = taskLists.flat()
  return {
    projects,
    myTasks: tasks.filter((t) => t.assigneeId === userId),
    counts: {
      projectCount: projects.length,
      taskCount: tasks.length,
      todoCount: tasks.filter((t) => t.status === 'TODO').length,
      doneCount: tasks.filter((t) => t.status === 'DONE').length,
    },
  }
}

export function useDashboardQuery() {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: dashboardKeys.summary(userId ?? ''),
    queryFn: () => buildDashboard(userId as string),
    enabled: !!userId,
  })
}
