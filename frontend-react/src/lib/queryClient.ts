import { QueryClient } from '@tanstack/react-query'

/**
 * Global QueryClient with intentional defaults per FE-S003-04.
 * - retry: 1  → fail fast without excessive refetch storms
 * - staleTime: 30000ms (30s) → reduce redundant fetches for server state
 * - refetchOnWindowFocus: false → avoid noisy refetches by default (feature can opt-in)
 *
 * Ownership: Server State → TanStack Query (not Zustand). See docs/architecture/system-architecture.md.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})
