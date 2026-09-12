import { httpClient } from '../../../lib/http/client.ts'

import type {
  CreateProjectRequest,
  PaginatedProjects,
  Project,
  UpdateProjectRequest,
} from '../types/project.types.ts'

/**
 * Projects API layer — thin wrapper over shared Axios client.
 * No direct fetch/axios in components; pattern: Component → Hook → API → httpClient.
 */

type Wrapped<T> = { data: T }
type PaginatedWrapped<T> = { data: T[]; meta: PaginatedProjects['meta'] }

export async function listProjects(
  params: { page?: number; perPage?: number } = {},
): Promise<PaginatedProjects> {
  const res = await httpClient.get<PaginatedWrapped<Project>>('/projects', {
    params: {
      page: params.page ?? 1,
      perPage: params.perPage ?? 20,
    },
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function getProject(projectId: string): Promise<Project> {
  const res = await httpClient.get<Wrapped<Project>>(`/projects/${projectId}`)
  return res.data.data
}

export async function createProject(payload: CreateProjectRequest): Promise<Project> {
  const res = await httpClient.post<Wrapped<Project>>('/projects', payload)
  return res.data.data
}

export async function patchProject(
  projectId: string,
  payload: UpdateProjectRequest,
): Promise<Project> {
  const res = await httpClient.patch<Wrapped<Project>>(`/projects/${projectId}`, payload)
  return res.data.data
}

export async function deleteProject(projectId: string): Promise<void> {
  await httpClient.delete(`/projects/${projectId}`)
}
