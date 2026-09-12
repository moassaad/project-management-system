import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  patchTask,
} from '../api/tasks.api.ts'
import type {
  CreateTaskRequest,
  TaskFilters,
  UpdateTaskRequest,
} from '../types/task.types.ts'

/**
 * TanStack Query hooks for tasks — server-state ownership (not Zustand).
 * Keys are centralized for invalidation after mutations. No UI here;
 * FE-S007-02/03 wire these into task list/details/create/edit pages.
 */

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (projectId: string, page: number, perPage: number, filters: TaskFilters = {}) =>
    [...taskKeys.lists(), projectId, { page, perPage, ...filters }] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (projectId: string, taskId: string) =>
    [...taskKeys.details(), projectId, taskId] as const,
}

export function useTasksQuery(
  projectId: string,
  page = 1,
  perPage = 20,
  filters: TaskFilters = {},
) {
  return useQuery({
    queryKey: taskKeys.list(projectId, page, perPage, filters),
    queryFn: () => listTasks(projectId, { page, perPage, ...filters }),
    enabled: !!projectId,
  })
}

export function useTaskQuery(projectId: string, taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(projectId, taskId),
    queryFn: () => getTask(projectId, taskId),
    enabled: !!projectId && !!taskId,
  })
}

export function useCreateTaskMutation(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTaskRequest) => createTask(projectId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...taskKeys.lists(), projectId] })
    },
  })
}

export function useUpdateTaskMutation(projectId: string, taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateTaskRequest) => patchTask(projectId, taskId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: taskKeys.detail(projectId, taskId) })
      void qc.invalidateQueries({ queryKey: [...taskKeys.lists(), projectId] })
    },
  })
}

export function useDeleteTaskMutation(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => deleteTask(projectId, taskId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...taskKeys.lists(), projectId] })
    },
  })
}
