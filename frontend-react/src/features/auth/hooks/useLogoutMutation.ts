import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { useAuthStore } from '../store/authStore.ts'
import { logout } from '../api/auth.api.ts'

/**
 * Logout — calls POST /auth/logout (withCredentials, HttpOnly cookie), clears store, redirects to /login.
 * withCredentials already via httpClient; ProblemDetails handled via status/type.
 */
export function useLogoutMutation() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      clearAuth()
      void navigate('/login')
    },
    onError: () => {
      // Even on error (e.g., 401), clear local auth and redirect — backend authoritative.
      clearAuth()
      void navigate('/login')
    },
  })
}
