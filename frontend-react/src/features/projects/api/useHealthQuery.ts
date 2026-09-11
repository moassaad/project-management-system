import { useQuery } from '@tanstack/react-query'

import { httpClient } from '../../../lib/http/client.ts'

/**
 * Example TanStack Query hook for GET /api/v1/health — demonstrates server-state ownership.
 *
 * Server State → TanStack Query (not Zustand) per docs/architecture/system-architecture.md:453-531.
 * This hook is the reference pattern for future feature queries (projects/tasks will follow same shape).
 *
 * Endpoint is public liveness from Sprint 002 backend; no auth required.
 */

type HealthResponse = {
  data: {
    status: string
  }
}

async function fetchHealth(): Promise<HealthResponse> {
  const res = await httpClient.get<HealthResponse>('/health')
  return res.data
}

export function useHealthQuery() {
  return useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  })
}
