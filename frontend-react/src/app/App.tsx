import { NavLink, Outlet } from 'react-router'

import {
  Layout,
  LayoutHeader,
  LayoutMain,
  LayoutSidebar,
} from '../components/ui/Layout.tsx'

/**
 * Application layout — wraps routes with header/sidebar placeholder.
 * No business data, only navigation to /dashboard, /projects, /login.
 * Semantic html, aria-labels, keyboard navigable (focus rings via Tailwind).
 * Used as parent route element in src/app/router/index.tsx so layout renders on all routes.
 */
export function App() {
  return (
    <Layout>
      <LayoutHeader>
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900">
            Project Management
          </span>
          <nav aria-label="Primary navigation">
            <ul className="flex items-center gap-1">
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/projects"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  Projects
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  Login
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </LayoutHeader>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <LayoutSidebar className="hidden md:block p-4">
          <nav aria-label="Sidebar navigation">
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/projects"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  Projects
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  Login
                </NavLink>
              </li>
            </ul>
          </nav>
        </LayoutSidebar>

        <LayoutMain>
          <Outlet />
        </LayoutMain>
      </div>
    </Layout>
  )
}
