import { useEffect } from 'react'

import { useAuthStore } from '../store/authStore.ts'
import { me, refresh } from '../api/auth.api.ts'

/**
 * Module-level in-flight guard: the app runs in StrictMode (dev double-mount)
 * and remounts must not fire duplicate refresh/me calls. Concurrent invocations
 * share one execution ("no repeated /me calls").
 */
let bootstrapInflight: Promise<void> | null = null

/**
 * Bootstrap auth on app load — refresh-first when no accessToken in memory.
 * GET /me is only called when a token is present (fresh from refresh, or
 * pre-existing). Refresh token is HttpOnly Secure Cookie, sent via
 * withCredentials, never read via JS. On 401 clears auth (route guards then
 * redirect to /login); 401 from /me with token gets a single refresh retry
 * via the shared HTTP interceptor. Sets isBootstrapping false when done.
 */
export function useAuthBootstrap() {
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping)
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping)
  const setAuth = useAuthStore((s) => s.setAuth)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)

  useEffect(() => {
    let cancelled = false

    async function execute() {
      const { accessToken, user } = useAuthStore.getState()

      // If already authenticated with user, nothing to do
      if (accessToken && user) {
        if (!cancelled) setBootstrapping(false)
        return
      }

      // If token exists but no user (e.g., after refresh via interceptor), fetch user
      if (accessToken && !user) {
        try {
          const fetchedUser = await me()
          if (!cancelled) setAuth(fetchedUser, accessToken)
        } catch {
          if (!cancelled) {
            // Token invalid — clear
            clearAuth()
          }
        } finally {
          if (!cancelled) setBootstrapping(false)
        }
        return
      }

      // No token — refresh-first via HttpOnly cookie (withCredentials);
      // GET /me only runs after a token is obtained.
      try {
        const { accessToken: newToken } = await refresh()
        if (!cancelled) setAccessToken(newToken)
        const fetchedUser = await me()
        if (!cancelled) setAuth(fetchedUser, newToken)
      } catch {
        // 401 ProblemDetails — clear, stay unauthenticated (status/type, not detail string)
        if (!cancelled) clearAuth()
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    }

    async function bootstrap() {
      const { accessToken, user } = useAuthStore.getState()
      if (accessToken && user) {
        if (!cancelled) setBootstrapping(false)
        return
      }
      if (!bootstrapInflight) {
        bootstrapInflight = execute().finally(() => {
          bootstrapInflight = null
        })
      }
      try {
        await bootstrapInflight
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [clearAuth, setAccessToken, setAuth, setBootstrapping])

  return { isBootstrapping }
}
