import { z } from 'zod'

/**
 * Add-member validation — UI/use-case specific, backend remains authoritative.
 * Add by existing user: either userId (UUID) or email is required (Sprint 006
 * scope: no email invitations, lookup of existing users only).
 */

export const addMemberSchema = z
  .object({
    userId: z.string().uuid('Must be a valid user ID').optional().or(z.literal('')),
    email: z.string().email('Must be a valid email address').optional().or(z.literal('')),
  })
  .refine((v) => (v.userId && v.userId.length > 0) || (v.email && v.email.length > 0), {
    message: 'Provide a user ID or an email address',
    path: ['email'],
  })

export type AddMemberFormValues = z.infer<typeof addMemberSchema>
