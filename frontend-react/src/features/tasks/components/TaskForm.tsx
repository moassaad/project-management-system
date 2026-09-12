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
import type { Member } from '../../members/types/member.types.ts'

type TaskFormProps<T extends FieldValues> = {
  schema: ZodType<T>
  defaultValues: T
  submitLabel: string
  serverError: string | null
  isSubmitting: boolean
  members: Member[]
  membersLoading: boolean
  onSubmit: (values: T) => Promise<Record<string, string> | void>
}

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50'

/**
 * Shared task create/edit form — RHF + zodResolver.
 * Title/description/dueDate inputs, type/status/priority selects, assignee
 * member-select (options from members query, passed in — no fetching here).
 * Server 422 mapped to fields via onSubmit return. No direct HTTP here.
 */
export function TaskForm<T extends FieldValues>({
  schema,
  defaultValues,
  submitLabel,
  serverError,
  isSubmitting,
  members,
  membersLoading,
  onSubmit,
}: TaskFormProps<T>) {
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
  const errorFor = (name: string) => {
    const message = fieldErrors[name]?.message
    return message ? String(message) : null
  }
  const renderError = (id: string, message: string | null) =>
    message ? (
      <p id={id} role="alert" className="text-sm text-red-600">
        {message}
      </p>
    ) : null

  const titleError = errorFor('title')
  const descriptionError = errorFor('description')
  const assigneeError = errorFor('assigneeId')

  return (
    <form onSubmit={handleSubmit(handle)} noValidate aria-label="Task form" className="space-y-4">
      <Input
        id="task-title"
        label="Title"
        type="text"
        placeholder="Task title"
        aria-invalid={!!titleError}
        aria-describedby={titleError ? 'task-title-error' : undefined}
        {...register('title' as Path<T>)}
      />
      {renderError('task-title-error', titleError)}

      <Input
        id="task-description"
        label="Description"
        type="text"
        placeholder="Optional description"
        aria-invalid={!!descriptionError}
        aria-describedby={descriptionError ? 'task-description-error' : undefined}
        {...register('description' as Path<T>)}
      />
      {renderError('task-description-error', descriptionError)}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-type" className="text-sm font-medium text-gray-700">
            Type
          </label>
          <select id="task-type" className={selectClassName} {...register('type' as Path<T>)}>
            <option value="">—</option>
            <option value="FEATURE">FEATURE</option>
            <option value="BUG">BUG</option>
            <option value="IMPROVEMENT">IMPROVEMENT</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-status" className="text-sm font-medium text-gray-700">
            Status
          </label>
          <select id="task-status" className={selectClassName} {...register('status' as Path<T>)}>
            <option value="">—</option>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-priority" className="text-sm font-medium text-gray-700">
            Priority
          </label>
          <select
            id="task-priority"
            className={selectClassName}
            {...register('priority' as Path<T>)}
          >
            <option value="">—</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="task-assignee" className="text-sm font-medium text-gray-700">
          Assignee
        </label>
        <select
          id="task-assignee"
          className={selectClassName}
          disabled={membersLoading}
          aria-invalid={!!assigneeError}
          aria-describedby={assigneeError ? 'task-assignee-error' : undefined}
          {...register('assigneeId' as Path<T>)}
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.email} ({m.role})
            </option>
          ))}
        </select>
        {membersLoading ? <p className="text-xs text-gray-500">Loading members…</p> : null}
      </div>
      {renderError('task-assignee-error', assigneeError)}

      <Input
        id="task-dueDate"
        label="Due date"
        type="date"
        aria-invalid={!!errorFor('dueDate')}
        {...register('dueDate' as Path<T>)}
      />

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
