import type { Project } from '../../projects/types/project.types.ts'
import type { Task } from '../../tasks/types/task.types.ts'

/**
 * Dashboard data — composed client-side from existing project/task endpoints
 * (Sprint 009 is frontend-only by design; no new backend API per api-design
 * principles). Counts are derived from fetched list responses.
 */

export type DashboardCounts = {
  projectCount: number
  taskCount: number
  todoCount: number
  doneCount: number
}

export type DashboardData = {
  projects: Project[]
  myTasks: Task[]
  counts: DashboardCounts
}
