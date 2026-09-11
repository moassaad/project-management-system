/**
 * TanStack Query keys for auth — server-state ownership (not Zustand).
 * Per docs/architecture/system-architecture.md: Server State → TanStack Query.
 */
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  session: () => [...authKeys.all, 'session'] as const,
}
