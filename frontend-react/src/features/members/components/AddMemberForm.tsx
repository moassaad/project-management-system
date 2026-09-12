import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { addMemberSchema, type AddMemberFormValues } from '../schemas/member.schema.ts'

type AddMemberFormProps = {
  serverError: string | null
  isSubmitting: boolean
  onSubmit: (values: AddMemberFormValues) => Promise<Record<string, string> | void>
}

/**
 * Add-member form — RHF + zodResolver, email and/or user ID.
 * Client errors inline; server 422 mapped to fields via onSubmit return.
 * Resets on success (onSubmit returns void); stays put when field errors
 * or a server message apply. No direct HTTP here; parent wires mutations.
 */
export function AddMemberForm({ serverError, isSubmitting, onSubmit }: AddMemberFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { userId: '', email: '' },
  })

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        const fieldErrors = await onSubmit(values)
        if (fieldErrors) {
          for (const [name, message] of Object.entries(fieldErrors)) {
            setError(name as 'email' | 'userId', { type: 'server', message })
          }
          return
        }
        reset()
      })}
      noValidate
      aria-label="Add member form"
      className="space-y-3"
    >
      <Input
        id="member-email"
        label="Email"
        type="email"
        placeholder="member@example.com"
        aria-invalid={!!errors.email}
        aria-describedby={errors.email ? 'member-email-error' : undefined}
        {...register('email')}
      />
      {errors.email ? (
        <p id="member-email-error" role="alert" className="text-sm text-red-600">
          {errors.email.message}
        </p>
      ) : null}

      <Input
        id="member-userId"
        label="User ID (optional)"
        type="text"
        placeholder="User UUID"
        aria-invalid={!!errors.userId}
        aria-describedby={errors.userId ? 'member-userId-error' : undefined}
        {...register('userId')}
      />
      {errors.userId ? (
        <p id="member-userId-error" role="alert" className="text-sm text-red-600">
          {errors.userId.message}
        </p>
      ) : null}

      {serverError ? (
        <p role="alert" aria-live="polite" className="text-sm text-red-600">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Adding…' : 'Add member'}
      </Button>
    </form>
  )
}
