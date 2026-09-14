import { describe, expect, it } from 'vitest'

import { createTaskSchema, updateTaskSchema } from './task.schema.ts'

describe('createTaskSchema (Zod, 255 + enums + ISO)', () => {
  it('accepts minimal valid title', () => {
    expect(createTaskSchema.safeParse({ title: 'Task 1' }).success).toBe(true)
  })

  it('rejects empty/missing title', () => {
    expect(createTaskSchema.safeParse({ title: '' }).success).toBe(false)
    expect(createTaskSchema.safeParse({}).success).toBe(false)
  })

  it('rejects title >255', () => {
    expect(createTaskSchema.safeParse({ title: 'a'.repeat(256) }).success).toBe(false)
  })

  it('rejects description >255', () => {
    expect(createTaskSchema.safeParse({ title: 'T', description: 'a'.repeat(256) }).success).toBe(false)
  })

  it('accepts valid enums', () => {
    expect(createTaskSchema.safeParse({ title: 'T', type: 'FEATURE', status: 'TODO', priority: 'HIGH' }).success).toBe(true)
    expect(createTaskSchema.safeParse({ title: 'T', type: 'BUG' }).success).toBe(true)
  })

  it('rejects invalid enums', () => {
    expect(createTaskSchema.safeParse({ title: 'T', type: 'WRONG' }).success).toBe(false)
    expect(createTaskSchema.safeParse({ title: 'T', status: 'WRONG' }).success).toBe(false)
    expect(createTaskSchema.safeParse({ title: 'T', priority: 'WRONG' }).success).toBe(false)
  })

  it('accepts empty string for optional enums (cleared select)', () => {
    expect(createTaskSchema.safeParse({ title: 'T', type: '', status: '', priority: '' }).success).toBe(true)
  })

  it('accepts valid assigneeId UUID', () => {
    expect(createTaskSchema.safeParse({ title: 'T', assigneeId: '00000000-0000-4000-a000-000000000001' }).success).toBe(true)
    expect(createTaskSchema.safeParse({ title: 'T', assigneeId: '' }).success).toBe(true)
  })

  it('rejects invalid assigneeId', () => {
    expect(createTaskSchema.safeParse({ title: 'T', assigneeId: 'not-uuid' }).success).toBe(false)
  })

  it('accepts valid ISO dueDate', () => {
    expect(createTaskSchema.safeParse({ title: 'T', dueDate: '2026-12-31' }).success).toBe(true)
    expect(createTaskSchema.safeParse({ title: 'T', dueDate: '' }).success).toBe(true)
  })

  it('rejects invalid dueDate', () => {
    expect(createTaskSchema.safeParse({ title: 'T', dueDate: 'not-a-date' }).success).toBe(false)
  })
})

describe('updateTaskSchema (partial)', () => {
  it('accepts empty object (no changes)', () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(true)
  })

  it('accepts null for nullable fields', () => {
    expect(updateTaskSchema.safeParse({ description: null, type: null, assigneeId: null, dueDate: null }).success).toBe(true)
  })

  it('rejects invalid title on update', () => {
    expect(updateTaskSchema.safeParse({ title: '' }).success).toBe(false)
    expect(updateTaskSchema.safeParse({ title: 'a'.repeat(256) }).success).toBe(false)
  })
})
