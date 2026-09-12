import { httpClient } from '../../../lib/http/client.ts'

import type {
  CreateTaskRequest,
  PaginatedTasks,
  Task,
  TaskFilters,
  UpdateTaskRequest,
} from '../types/task.types.ts'

/**
 * Tasks API layer — thin wrapper over shared Axios client.
 * No direct fetch/axios in components; pattern: Component → Hook → API → httpClient.
 */

type Wrapped<T> = { data: T }
type PaginatedWrapped<T> = { data: T[]; meta: PaginatedTasks['meta'] }

export async function listTasks(
  projectId: string,
  params: { page?: number; perPage?: number } & TaskFilters = {},
): Promise<PaginatedTasks> {
  const res = await httpClient.get<PaginatedWrapped<Task>>(`/projects/${projectId}/tasks`, {
    params: {
      page: params.page ?? 1,
      perPage: params.perPage ?? 20,
      // Axios omits undefined — only active filters travel as query params.
      search: params.search,
      status: params.status,
      type: params.type,
      priority: params.priority,
    },
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function getTask(projectId: string, taskId: string): Promise<Task> {
  const res = await httpClient.get<Wrapped<Task>>(`/projects/${projectId}/tasks/${taskId}`)
  return res.data.data
}

export async function createTask(
  projectId: string,
  payload: CreateTaskRequest,
): Promise<Task> {
  const res = await httpClient.post<Wrapped<Task>>(`/projects/${projectId}/tasks`, payload)
  return res.data.data
}

export async function patchTask(
  projectId: string,
  taskId: string,
  payload: UpdateTaskRequest,
): Promise<Task> {
  const res = await httpClient.patch<Wrapped<Task>>(
    `/projects/${projectId}/tasks/${taskId}`,
    payload,
  )
  return res.data.data
}

export async function deleteTask(projectId: string, taskId: string): Promise<void> {
  await httpClient.delete(`/projects/${projectId}/tasks/${taskId}`)
}
