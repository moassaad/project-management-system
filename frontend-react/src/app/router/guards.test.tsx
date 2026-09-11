import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, beforeEach } from 'vitest'

import { useAuthStore } from '../../features/auth/store/authStore.ts'
import { ProtectedRoute } from './protected-route.tsx'
import { PublicRoute } from './public-route.tsx'

function renderWithRouter(routes: Parameters<typeof createMemoryRouter>[0], initialEntries: string[] = ['/']) {
  const router = createMemoryRouter(routes, { initialEntries })
  return render(<RouterProvider router={router} />)
}

describe('Route guards', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
    useAuthStore.getState().setBootstrapping(false)
  })

  it('ProtectedRoute shows loading while bootstrapping (behavior)', () => {
    useAuthStore.getState().setBootstrapping(true)
    renderWithRouter([
      { element: <ProtectedRoute />, children: [{ path: '/', element: <div>Secret</div> }] },
    ])
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument()
  })

  it('ProtectedRoute redirects to /login when not authenticated (behavior)', async () => {
    renderWithRouter([
      { element: <ProtectedRoute />, children: [{ path: '/protected', element: <div>Secret</div> }] },
      { path: '/login', element: <div>Login Page</div> },
    ], ['/protected'])

    expect(await screen.findByText(/login page/i)).toBeInTheDocument()
  })

  it('ProtectedRoute renders child when authenticated (behavior)', async () => {
    useAuthStore.getState().setAuth({ id: '00000000-0000-4000-a000-000000000001', email: 'test@example.com' }, 'token')
    renderWithRouter([
      { element: <ProtectedRoute />, children: [{ path: '/protected', element: <div>Secret</div> }] },
    ], ['/protected'])

    expect(await screen.findByText(/secret/i)).toBeInTheDocument()
  })

  it('PublicRoute redirects to /dashboard when authenticated (behavior)', async () => {
    useAuthStore.getState().setAuth({ id: '00000000-0000-4000-a000-000000000001', email: 'test@example.com' }, 'token')
    renderWithRouter([
      { element: <PublicRoute />, children: [{ path: '/login', element: <div>Login Page</div> }] },
      { path: '/dashboard', element: <div>Dashboard</div> },
    ], ['/login'])

    expect(await screen.findByText(/dashboard/i)).toBeInTheDocument()
  })

  it('PublicRoute renders login when not authenticated (behavior)', async () => {
    renderWithRouter([
      { element: <PublicRoute />, children: [{ path: '/login', element: <div>Login Page</div> }] },
    ], ['/login'])

    expect(await screen.findByText(/login page/i)).toBeInTheDocument()
  })
})
