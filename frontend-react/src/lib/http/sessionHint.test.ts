import { beforeEach, describe, expect, it } from 'vitest'

import { clearSessionHint, hasSessionHint, setSessionHint } from './sessionHint.ts'

describe('sessionHint (tab-scoped, no token persistence)', () => {
  beforeEach(() => {
    clearSessionHint()
    // jsdom sessionStorage is available; ensure clean slate
    try {
      sessionStorage.clear()
    } catch {
      // ignore - memory fallback path
    }
  })

  it('is false initially (no session)', () => {
    expect(hasSessionHint()).toBe(false)
  })

  it('becomes true after set', () => {
    setSessionHint()
    expect(hasSessionHint()).toBe(true)
  })

  it('is false after clear', () => {
    setSessionHint()
    expect(hasSessionHint()).toBe(true)
    clearSessionHint()
    expect(hasSessionHint()).toBe(false)
  })

  it('survives multiple sets (idempotent)', () => {
    setSessionHint()
    setSessionHint()
    expect(hasSessionHint()).toBe(true)
  })

  it('is isolated per tab via sessionStorage (not localStorage)', () => {
    setSessionHint()
    expect(sessionStorage.getItem('pms.hasSession')).toBe('1')
    expect(localStorage.getItem('pms.hasSession')).toBeNull()
  })
})
