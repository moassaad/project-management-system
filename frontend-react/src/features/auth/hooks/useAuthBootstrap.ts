import { useEffect } from 'react'

import { hasSessionHint } from '../../../lib/http/sessionHint.ts'
import { useAuthStore } from '../store/authStore.ts'
import { me, refresh } from '../api/auth.api.ts'

/**
 * Module-level in-flight guard: the app runs in StrictMode (dev double-mount)
 * and remounts must not fire duplicate refresh/me calls. Concurrent invocations
 * share one execution ("no repeated /me calls").
 */
let bootstrapInflight: Promise<{ user: import('../types/auth.types.ts').User; token: string } | null> | null = null

/**
 * Bootstrap auth on app load — refresh-first when no accessToken in memory.
 * GET /me is only called when a token is present (fresh from refresh, or
 * pre-existing). Refresh token is HttpOnly Secure Cookie, sent via
 * withCredentials, never read via JS. On 401 clears auth (route guards then
 * redirect to /login); 401 from /me with token gets a single refresh retry
 * via the shared HTTP interceptor. Sets isBootstrapping false when done.
 *
 * StrictMode double-mount shares one in-flight execution but each mount
 * applies the result with its own cancelled guard.
 */
export function useAuthBootstrap() {
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping)
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping)
  const setAuth = useAuthStore((s) => s.setAuth)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  useEffect(() => {
    let cancelled = false

    async function execute(): Promise<{ user: import('../types/auth.types.ts').User; token: string } | null> {
      const { accessToken, user } = useAuthStore.getState()

      if (accessToken && user) {
        return { user, token: accessToken }
      }

      if (accessToken && !user) {
        try {
          const fetchedUser = await me()
          return { user: fetchedUser, token: accessToken }
        } catch {
          return null
        }
      }

      if (!hasSessionHint()) {
        return null
      }
      try {
        const { accessToken: newToken } = await refresh()
        // Make token available for the subsequent me() request (httpClient reads from store)
        useAuthStore.getState().setAccessToken(newToken)
        const fetchedUser = await me()
        return { user: fetchedUser, token: newToken }
      } catch {
        return null
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
      let result: { user: import('../types/auth.types.ts').User; token: string } | null
      try {
        result = await bootstrapInflight
      } catch {
        result = null
      }
      if (cancelled) return
      if (result) {
        setAuth(result.user, result.token)
      } else {
        // No session or refresh failed — ensure cleared (if was authenticated before, clear)
        const { accessToken: curToken, user: curUser } = useAuthStore.getState()
        if (curToken || curUser) {
          clearAuth()
        }
      }
      setBootstrapping(false)
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [clearAuth, setAuth, setBootstrapping])

  return { isBootstrapping }
}
