import type { PaginatedMeta } from '../../projects/types/project.types.ts'

/**
 * Tasks contract types — contract-first for Sprint 007 (backend BE-S007-01..03
 * not yet built; MSW mocks this shape). camelCase + UUID strings + ISO dates
 * per docs/api/api-design.md 4.6; backend remains source of truth.
 *
 * Endpoints follow api-design (project-scoped):
 * - GET/POST /projects/{projectId}/tasks (list paginated {data, meta}, create 201)
 * - GET/PATCH/DELETE /projects/{projectId}/tasks/{taskId}
 * NOTE: Sprint 007 issue text mentions /tasks/{taskId}; api-design governs.
 */

export type TaskType = 'FEATURE' | 'BUG' | 'IMPROVEMENT'

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export type Task = {
  id: string // UUID string
  projectId: string // UUID string
  title: string
  description?: string | null
  type?: TaskType | null
  status: TaskStatus
  priority: TaskPriority
  assigneeId?: string | null // UUID string, must be a project member
  dueDate?: string | null // ISO date string
  createdAt: string // ISO string
  updatedAt?: string
}

export type CreateTaskRequest = {
  title: string
  description?: string
  type?: TaskType
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  dueDate?: string
}

export type UpdateTaskRequest = {
  title?: string
  description?: string | null
  type?: TaskType | null
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string | null
  dueDate?: string | null
}

export type PaginatedTasks = {
  data: Task[]
  meta: PaginatedMeta
}
