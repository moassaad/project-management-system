import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { queryClient } from '../../lib/queryClient.ts'

/**
 * Centralized global providers per docs/architecture/system-architecture.md:702-777.
 *
 * Ordering is intentional: QueryClientProvider is outermost so any future
 * provider or hook can use TanStack Query. Add new global providers inside
 * QueryClientProvider in dependency order.
 *
 * No feature code belongs here; no duplicate providers.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
