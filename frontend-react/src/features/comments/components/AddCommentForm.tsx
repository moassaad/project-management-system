import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'
import { createCommentSchema, type CreateCommentFormValues } from '../schemas/comment.schema.ts'

type AddCommentFormProps = {
  serverError: string | null
  isSubmitting: boolean
  onSubmit: (values: CreateCommentFormValues) => Promise<Record<string, string> | void>
}

/**
 * Add-comment form — RHF + zodResolver, content required.
 * Client errors inline; server 422 mapped to the content field via onSubmit
 * return. Resets on success; stays put when field errors or a server message
 * apply. No direct HTTP here; parent wires mutations. No edit/delete in MVP.
 */
export function AddCommentForm({ serverError, isSubmitting, onSubmit }: AddCommentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<CreateCommentFormValues>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: { content: '' },
  })

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        const fieldErrors = await onSubmit(values)
        if (fieldErrors) {
          for (const [name, message] of Object.entries(fieldErrors)) {
            setError(name as 'content', { type: 'server', message })
          }
          return
        }
        reset()
      })}
      noValidate
      aria-label="Add comment form"
      className="space-y-3"
    >
      <Input
        id="comment-content"
        label="Comment"
        type="text"
        placeholder="Write a comment…"
        aria-invalid={!!errors.content}
        aria-describedby={errors.content ? 'comment-content-error' : undefined}
        {...register('content')}
      />
      {errors.content ? (
        <p id="comment-content-error" role="alert" className="text-sm text-red-600">
          {errors.content.message}
        </p>
      ) : null}

      {serverError ? (
        <p role="alert" aria-live="polite" className="text-sm text-red-600">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Adding…' : 'Add comment'}
      </Button>
    </form>
  )
}
