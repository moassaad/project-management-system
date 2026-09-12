/**
 * Project contract types — aligned with OpenAPI (camelCase, UUID string)
 * per docs/api/api-design.md project endpoints and docs/business-rules.
 * Backend is source of truth; these mirror expected JSON shapes.
 */

export type Project = {
  id: string // UUID string
  name: string
  description?: string | null
  ownerId: string // UUID string
  createdAt: string // ISO string
  updatedAt?: string
}

export type CreateProjectRequest = {
  name: string
  description?: string
}

export type UpdateProjectRequest = {
  name?: string
  description?: string | null
}

export type PaginatedMeta = {
  currentPage: number
  perPage: number
  total: number
  lastPage: number
}

export type PaginatedProjects = {
  data: Project[]
  meta: PaginatedMeta
}
