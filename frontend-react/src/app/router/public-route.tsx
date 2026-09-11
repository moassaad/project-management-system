import { Navigate, Outlet } from 'react-router'

import { useAuthStore } from '../../features/auth/store/authStore.ts'

// Public route — redirects authenticated users to dashboard (UX-only)
export function PublicRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping)

  if (isBootstrapping) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-label="Loading">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
