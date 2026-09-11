import { z } from 'zod'

/**
 * Login form validation — UI/use-case specific, not reused as API schema.
 * Backend validation remains authoritative (RFC9457 422).
 */
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
