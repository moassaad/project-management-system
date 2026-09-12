import { z } from 'zod'

/**
 * Project validation — UI/use-case specific, backend remains authoritative (422).
 * Create and Update share same rules per FE-S005-01: name min(1), description optional.
 */

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name must be at most 100 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional().or(z.literal('')),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name must be at most 100 characters').optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional().or(z.literal('')).nullable(),
})

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>
export type UpdateProjectFormValues = z.infer<typeof updateProjectSchema>
