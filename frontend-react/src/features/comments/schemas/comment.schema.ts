import { z } from 'zod'

/**
 * Comment validation — UI/use-case specific, backend remains authoritative (422).
 * Content is required (business-rules 2.5: comment content required).
 */

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(2000, 'Comment must be at most 2000 characters'),
})

export type CreateCommentFormValues = z.infer<typeof createCommentSchema>
