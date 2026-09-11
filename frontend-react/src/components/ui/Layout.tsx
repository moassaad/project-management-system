import type { HTMLAttributes, ReactNode } from 'react'

type LayoutProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
}

/**
 * UI Layout primitive — Tailwind, semantic.
 * Provides centered container, keyboard navigable via semantic html.
 */
export function Layout({ children, className = '', ...props }: LayoutProps) {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function LayoutHeader({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <header className={`bg-white border-b border-gray-200 ${className}`} {...props}>
      {children}
    </header>
  )
}

export function LayoutMain({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <main className={`mx-auto max-w-6xl px-4 py-8 ${className}`} {...props}>
      {children}
    </main>
  )
}

export function LayoutSidebar({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <aside
      aria-label="Sidebar"
      className={`bg-white border-r border-gray-200 w-64 shrink-0 ${className}`}
      {...props}
    >
      {children}
    </aside>
  )
}
