import { describe, expect, it } from 'vitest'

import { createCommentSchema } from './comment.schema.ts'

describe('createCommentSchema (Zod, content required)', () => {
  it('accepts valid content', () => {
    expect(createCommentSchema.safeParse({ content: 'Hello' }).success).toBe(true)
    expect(createCommentSchema.safeParse({ content: 'a'.repeat(2000) }).success).toBe(true)
  })

  it('rejects empty content', () => {
    expect(createCommentSchema.safeParse({ content: '' }).success).toBe(false)
    expect(createCommentSchema.safeParse({}).success).toBe(false)
  })

  it('rejects content >2000', () => {
    expect(createCommentSchema.safeParse({ content: 'a'.repeat(2001) }).success).toBe(false)
  })
})
