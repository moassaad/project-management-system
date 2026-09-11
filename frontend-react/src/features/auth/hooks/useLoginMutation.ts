import { useMutation } from '@tanstack/react-query'

import { login } from '../api/auth.api.ts'

/**
 * Hook wrapping auth.api.login — no server state duplication.
 * Component uses this, no direct Axios in component (via hook → api → httpClient).
 */
export function useLoginMutation() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login({ email, password }),
  })
}
