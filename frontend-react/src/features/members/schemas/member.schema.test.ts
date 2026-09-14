import { describe, expect, it } from 'vitest'

import { addMemberSchema } from './member.schema.ts'

describe('addMemberSchema (Zod, email or userId required)', () => {
  it('accepts valid email', () => {
    expect(addMemberSchema.safeParse({ email: 'member@example.com' }).success).toBe(true)
    expect(addMemberSchema.safeParse({ email: 'member@example.com', userId: '' }).success).toBe(true)
  })

  it('accepts valid userId UUID', () => {
    expect(addMemberSchema.safeParse({ userId: '00000000-0000-4000-a000-000000000001' }).success).toBe(true)
    expect(addMemberSchema.safeParse({ userId: '00000000-0000-4000-a000-000000000001', email: '' }).success).toBe(true)
  })

  it('accepts both', () => {
    expect(addMemberSchema.safeParse({ userId: '00000000-0000-4000-a000-000000000001', email: 'member@example.com' }).success).toBe(true)
  })

  it('rejects neither', () => {
    expect(addMemberSchema.safeParse({}).success).toBe(false)
    expect(addMemberSchema.safeParse({ email: '', userId: '' }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(addMemberSchema.safeParse({ email: 'not-email' }).success).toBe(false)
  })

  it('rejects invalid UUID', () => {
    expect(addMemberSchema.safeParse({ userId: 'not-uuid' }).success).toBe(false)
  })
})
