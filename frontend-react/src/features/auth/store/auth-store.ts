/**
 * Re-export of shared auth store for feature-based co-location.
 * Primary implementation lives at src/lib/store/auth-store.ts (shared client state).
 * This re-export satisfies AC that allows either path:
 *  - src/lib/store/auth-store.ts
 *  - src/features/auth/store/auth-store.ts
 */
export { useAuthStore } from '../../../lib/store/auth-store'
