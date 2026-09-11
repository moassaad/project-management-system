import { createBrowserRouter, Navigate } from 'react-router'

import { App } from '../App.tsx'
import { LoginPage } from '../../features/auth/pages/LoginPage.tsx'
import {
  DashboardPage,
  NotFoundPage,
  ProjectDetailsPage,
  ProjectsPage,
  TaskDetailsPage,
} from './placeholder.tsx'
import { ProtectedRoute } from './protected-route.tsx'
import { PublicRoute } from './public-route.tsx'

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      {
        element: <PublicRoute />,
        children: [{ path: '/login', element: <LoginPage /> }],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/projects/:projectId', element: <ProjectDetailsPage /> },
          {
            path: '/projects/:projectId/tasks/:taskId',
            element: <TaskDetailsPage />,
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
