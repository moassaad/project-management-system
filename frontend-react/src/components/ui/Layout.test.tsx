import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Layout, LayoutHeader, LayoutMain, LayoutSidebar } from './Layout.tsx'

describe('Layout (ui primitive, semantic)', () => {
  it('renders children inside semantic regions', () => {
    render(
      <Layout>
        <LayoutHeader>Header</LayoutHeader>
        <LayoutSidebar>Sidebar</LayoutSidebar>
        <LayoutMain>Main</LayoutMain>
      </Layout>,
    )

    expect(screen.getByText('Header').tagName).toBe('HEADER')
    expect(screen.getByText('Sidebar')).toBeInTheDocument()
    expect(screen.getByText('Main').tagName).toBe('MAIN')
  })

  it('applies className without breaking semantics', () => {
    render(<Layout className="custom">content</Layout>)
    expect(screen.getByText('content')).toHaveClass('custom')
  })
})
