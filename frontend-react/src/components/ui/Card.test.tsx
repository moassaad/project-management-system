import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Card, CardContent, CardHeader, CardTitle } from './Card.tsx'

describe('Card (ui primitive)', () => {
  it('renders children and composes header/title/content', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>,
    )

    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('is a div with no interactive semantics by default', () => {
    render(<Card>hello</Card>)
    expect(screen.getByText('hello').tagName).toBe('DIV')
  })
})
