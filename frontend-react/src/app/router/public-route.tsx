import { Navigate, Outlet } from 'react-router'

// Placeholder until Sprint 004 implements authentication.
const isAuthenticated = false

export function PublicRoute() {
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
