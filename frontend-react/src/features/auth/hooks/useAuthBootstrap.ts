import { useEffect } from 'react'

import { useAuthStore } from '../store/authStore.ts'
import { me, refresh } from '../api/auth.api.ts'

/**
 * Bootstrap auth on app load — attempts POST /auth/refresh if no accessToken.
 * Refresh token is HttpOnly Secure Cookie, sent via withCredentials, never read via JS.
 * On success, fetches user via me() and sets auth; on 401 clears auth.
 * Sets isBootstrapping false when done — used for splash/loading.
 */
export function useAuthBootstrap() {
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping)
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping)
  const setAuth = useAuthStore((s) => s.setAuth)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
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

      // No token — try refresh via HttpOnly cookie (withCredentials)
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

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [clearAuth, setAccessToken, setAuth, setBootstrapping])

  return { isBootstrapping }
}
