import { zodResolver } from '@hookform/resolvers/zod'
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type SubmitHandler,
} from 'react-hook-form'
import type { ZodType } from 'zod'

import { Button } from '../../../components/ui/Button.tsx'
import { Input } from '../../../components/ui/Input.tsx'

type ProjectFormProps<T extends FieldValues> = {
  schema: ZodType<T>
  defaultValues: T
  submitLabel: string
  serverError: string | null
  isSubmitting: boolean
  onSubmit: (values: T) => Promise<Record<string, string> | void>
}

/**
 * Shared project create/edit form — RHF + zodResolver.
 * Field errors from client validation; server 422 mapped via onSubmit return
 * (see mapValidationErrors in ../api/projectErrors.ts).
 * No direct HTTP here; parent wires mutations.
 */
export function ProjectForm<T extends FieldValues>({
  schema,
  defaultValues,
  submitLabel,
  serverError,
  isSubmitting,
  onSubmit,
}: ProjectFormProps<T>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<T>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as DefaultValues<T>,
  })

  const handle: SubmitHandler<T> = async (values) => {
    const fieldErrors = await onSubmit(values)
    if (fieldErrors) {
      for (const [name, message] of Object.entries(fieldErrors)) {
        setError(name as Path<T>, { type: 'server', message })
      }
    }
  }

  const fieldErrors = errors as Record<string, { message?: unknown } | undefined>
  const nameError = fieldErrors.name?.message
  const descriptionError = fieldErrors.description?.message

  return (
    <form onSubmit={handleSubmit(handle)} noValidate aria-label="Project form" className="space-y-4">
      <Input
        id="project-name"
        label="Name"
        type="text"
        placeholder="Project name"
        aria-invalid={!!nameError}
        aria-describedby={nameError ? 'project-name-error' : undefined}
        {...register('name' as Path<T>)}
      />
      {nameError ? (
        <p id="project-name-error" role="alert" className="text-sm text-red-600">
          {String(nameError)}
        </p>
      ) : null}

      <Input
        id="project-description"
        label="Description"
        type="text"
        placeholder="Optional description"
        aria-invalid={!!descriptionError}
        aria-describedby={descriptionError ? 'project-description-error' : undefined}
        {...register('description' as Path<T>)}
      />
      {descriptionError ? (
        <p id="project-description-error" role="alert" className="text-sm text-red-600">
          {String(descriptionError)}
        </p>
      ) : null}

      {serverError ? (
        <p role="alert" aria-live="polite" className="text-sm text-red-600">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
