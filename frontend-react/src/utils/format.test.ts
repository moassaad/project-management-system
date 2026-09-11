import { describe, expect, it } from 'vitest'

import { formatStatus, truncate } from './format.ts'

// Unit test — isolated logic, no UI, no network.
describe('formatStatus', () => {
  it('formats status to uppercase for user display', () => {
    expect(formatStatus('up')).toBe('UP')
    expect(formatStatus('UP')).toBe('UP')
  })

  it('returns Unknown for empty status', () => {
    expect(formatStatus('')).toBe('Unknown')
  })
})

describe('truncate', () => {
  it('returns original when within limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates with ellipsis when over limit', () => {
    expect(truncate('hello world', 5)).toBe('hello…')
  })
})
