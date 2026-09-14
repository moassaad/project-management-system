import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TaskBadges } from './TaskBadges.tsx'

describe('TaskBadges (pure display, semantic)', () => {
  it('renders status and priority badges', () => {
    render(<TaskBadges status="TODO" priority="MEDIUM" />)

    expect(screen.getByText('TODO')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
    expect(screen.getByLabelText('Task attributes')).toBeInTheDocument()
  })

  it('replaces underscore in status and shows type when provided', () => {
    render(<TaskBadges status="IN_PROGRESS" priority="HIGH" type="BUG" />)

    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('BUG')).toBeInTheDocument()
  })

  it('hides type badge when null', () => {
    render(<TaskBadges status="DONE" priority="LOW" type={null} />)

    expect(screen.getByText('DONE')).toBeInTheDocument()
    expect(screen.queryByText('FEATURE')).not.toBeInTheDocument()
  })
})
