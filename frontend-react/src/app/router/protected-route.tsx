import { Navigate, Outlet } from 'react-router'

// Placeholder until Sprint 004 implements authentication.
// Frontend route protection is UX-only; the backend remains authoritative.
const isAuthenticated = false

export function ProtectedRoute() {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
