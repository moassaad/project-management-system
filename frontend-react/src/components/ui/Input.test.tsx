import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Input } from './Input.tsx'

describe('Input (a11y, label association)', () => {
  it('associates label with input via htmlFor/id', () => {
    render(<Input id="email" label="Email" placeholder="you@example.com" />)

    const input = screen.getByLabelText('Email')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('id', 'email')
  })

  it('is keyboard navigable and accepts typing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Input id="name" label="Name" onChange={onChange} />)

    const input = screen.getByLabelText('Name')
    await user.click(input)
    expect(input).toHaveFocus()
    await user.type(input, 'hello')
    expect(input).toHaveValue('hello')
  })

  it('respects aria-invalid for validation', () => {
    render(<Input id="test" label="Test" aria-invalid={true} />)
    expect(screen.getByLabelText('Test')).toHaveAttribute('aria-invalid', 'true')
  })
})
