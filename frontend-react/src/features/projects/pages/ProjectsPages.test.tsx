import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { server } from '../../../../tests/mocks/server.ts'
import { ProjectDetailsPage } from './ProjectDetailsPage.tsx'
import { ProjectsPage } from './ProjectsPage.tsx'

function renderWithRouter(initialEntries: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(
    [
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/projects/:projectId', element: <ProjectDetailsPage /> },
    ],
    { initialEntries },
  )
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('ProjectsPage', () => {
  it('lists projects from API (behavior)', async () => {
    renderWithRouter(['/projects'])
    expect(await screen.findByText('Alpha Project')).toBeInTheDocument()
    expect(screen.getByText('Beta Project')).toBeInTheDocument()
  })

  it('shows empty state when no projects (behavior)', async () => {
    server.use(
      http.get('*/api/v1/projects', () =>
        HttpResponse.json({
          data: [],
          meta: { currentPage: 1, perPage: 20, total: 0, lastPage: 1 },
        }),
      ),
    )
    renderWithRouter(['/projects'])
    expect(await screen.findByText(/no projects yet/i)).toBeInTheDocument()
  })

  it('shows error state on server failure using status (behavior)', async () => {
    server.use(
      http.get('*/api/v1/projects', () =>
        HttpResponse.json(
          {
            type: 'https://api.example.com/problems/server-error',
            title: 'Server error',
            status: 500,
            detail: 'boom',
            instance: '/api/v1/projects',
          },
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderWithRouter(['/projects'])
    expect(await screen.findByText(/unable to load projects/i)).toBeInTheDocument()
  })
})

describe('ProjectDetailsPage', () => {
  it('renders project details (behavior)', async () => {
    renderWithRouter(['/projects/00000000-0000-4000-a000-000000000010'])
    expect(await screen.findByText('Alpha Project')).toBeInTheDocument()
    expect(screen.getByText('First project')).toBeInTheDocument()
  })

  it('handles 404 for unknown project (behavior)', async () => {
    renderWithRouter(['/projects/00000000-0000-4000-a000-00000000ffff'])
    expect(await screen.findByText(/project not found/i)).toBeInTheDocument()
  })
})
