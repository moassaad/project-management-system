import { httpClient } from '../../../lib/http/client.ts'

/**
 * Feature API layer for `projects` — thin wrapper over shared Axios client.
 *
 * Pattern: Component → Feature Hook/Logic → Feature API → Shared HTTP Infrastructure → Backend API
 * (docs/architecture/system-architecture.md:313-449)
 *
 * This file demonstrates the wiring; it does NOT implement business feature logic.
 * Real domain operations (createProject, updateTask, etc.) will live here in later sprints,
 * but this ticket provides only a stub to show the layer separation.
 *
 * No direct fetch/axios in components — components must go through hooks → this API → httpClient.
 */

export type ProjectStub = {
  id: string
  name: string
}

/**
 * Stub: list projects via shared httpClient.
 * Shows feature API → shared client wiring; not yet used by UI (no domain logic).
 */
export async function listProjects(): Promise<ProjectStub[]> {
  const response = await httpClient.get<{ data: ProjectStub[] }>('/projects')
  return response.data.data
}
