/**
 * Auth store entry per FE-S004-02: src/features/auth/store/authStore.ts
 * Re-exports shared memory-only store (accessToken + user, isAuthenticated derived).
 * Also satisfies legacy path src/features/auth/store/auth-store.ts.
 */
export { useAuthStore } from '../../../lib/store/auth-store.ts'
