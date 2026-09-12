import { z } from 'zod'

/**
 * Task validation — UI/use-case specific, backend remains authoritative (422).
 * Create requires title; update is partial (PATCH). Enums mirror api-design 4.6.
 * Empty-string literals allow select/input clearing to mean "not provided".
 */

const taskTypeSchema = z.enum(['FEATURE', 'BUG', 'IMPROVEMENT'])
const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE'])
const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH'])

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title must be at most 200 characters'),
  description: z.string().max(2000, 'Description must be at most 2000 characters').optional().or(z.literal('')),
  type: taskTypeSchema.optional().or(z.literal('')),
  status: taskStatusSchema.optional().or(z.literal('')),
  priority: taskPrioritySchema.optional().or(z.literal('')),
  assigneeId: z.string().uuid('Must be a valid user ID').optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title must be at most 200 characters').optional(),
  description: z.string().max(2000, 'Description must be at most 2000 characters').optional().or(z.literal('')).nullable(),
  type: taskTypeSchema.optional().or(z.literal('')).nullable(),
  status: taskStatusSchema.optional().or(z.literal('')),
  priority: taskPrioritySchema.optional().or(z.literal('')),
  assigneeId: z.string().uuid('Must be a valid user ID').optional().or(z.literal('')).nullable(),
  dueDate: z.string().optional().or(z.literal('')).nullable(),
})

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>
export type UpdateTaskFormValues = z.infer<typeof updateTaskSchema>
