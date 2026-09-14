import { describe, expect, it } from 'vitest'

import { loginSchema } from './login.schema.ts'

describe('loginSchema (Zod, UI-specific)', () => {
  it('accepts valid email and password', () => {
    expect(loginSchema.safeParse({ email: 'test@example.com', password: 'secret' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].path).toContain('email')
  })

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'secret' })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].path).toContain('password')
  })

  it('rejects missing fields', () => {
    expect(loginSchema.safeParse({}).success).toBe(false)
    expect(loginSchema.safeParse({ email: 'a@b.com' }).success).toBe(false)
  })
})
