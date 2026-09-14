import { describe, expect, it } from 'vitest'

import { createProjectSchema, updateProjectSchema } from './project.schema.ts'

describe('createProjectSchema (Zod, 255 limits)', () => {
  it('accepts valid name and description', () => {
    expect(createProjectSchema.safeParse({ name: 'My Project', description: 'Desc' }).success).toBe(true)
    expect(createProjectSchema.safeParse({ name: 'My Project' }).success).toBe(true)
    expect(createProjectSchema.safeParse({ name: 'My Project', description: '' }).success).toBe(true)
  })

  it('rejects missing/empty name', () => {
    expect(createProjectSchema.safeParse({ name: '' }).success).toBe(false)
    expect(createProjectSchema.safeParse({}).success).toBe(false)
  })

  it('rejects name >255', () => {
    const long = 'a'.repeat(256)
    const result = createProjectSchema.safeParse({ name: long })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toMatch(/255/)
  })

  it('rejects description >255', () => {
    const long = 'a'.repeat(256)
    const result = createProjectSchema.safeParse({ name: 'Name', description: long })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].path).toContain('description')
  })

  it('accepts description exactly 255', () => {
    expect(createProjectSchema.safeParse({ name: 'Name', description: 'a'.repeat(255) }).success).toBe(true)
  })
})

describe('updateProjectSchema (partial)', () => {
  it('accepts partial name', () => {
    expect(updateProjectSchema.safeParse({ name: 'Updated' }).success).toBe(true)
    expect(updateProjectSchema.safeParse({}).success).toBe(true)
  })

  it('accepts null/empty description', () => {
    expect(updateProjectSchema.safeParse({ description: null }).success).toBe(true)
    expect(updateProjectSchema.safeParse({ description: '' }).success).toBe(true)
  })

  it('rejects name >255 on update', () => {
    expect(updateProjectSchema.safeParse({ name: 'a'.repeat(256) }).success).toBe(false)
  })
})
