import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  patchProject,
} from '../api/projects.api.ts'
import type { CreateProjectRequest, UpdateProjectRequest } from '../types/project.types.ts'

/**
 * TanStack Query hooks for projects — server-state ownership (not Zustand).
 * Keys are centralized for invalidation after mutations.
 */

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (page: number, perPage: number) => [...projectKeys.lists(), { page, perPage }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
}

export function useProjectsQuery(page = 1, perPage = 20) {
  return useQuery({
    queryKey: projectKeys.list(page, perPage),
    queryFn: () => listProjects({ page, perPage }),
  })
}

export function useProjectQuery(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => getProject(projectId),
    enabled: !!projectId,
  })
}

export function useCreateProjectMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProjectRequest) => createProject(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

export function useUpdateProjectMutation(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProjectRequest) => patchProject(projectId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      void qc.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

export function useDeleteProjectMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}
