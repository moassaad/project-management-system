type ValidationErrorItem = {
  detail?: string
  pointer?: string
}

type ProblemValidationBody = {
  status?: number
  errors?: ValidationErrorItem[]
  title?: string
  detail?: string
}

const TASK_FIELDS = new Set([
  'title',
  'description',
  'type',
  'status',
  'priority',
  'assigneeId',
  'dueDate',
])

/**
 * Map RFC 9457 422 task body to form field errors using `status` + `errors[]`
 * (never parses human-readable `detail` for control flow; pointer selects
 * the field, e.g. #/assigneeId → assigneeId).
 */
export function mapTaskValidationErrors(error: unknown): {
  fieldErrors: Record<string, string>
  message: string | null
} {
  const body = (
    error as { response?: { status?: number; data?: ProblemValidationBody } }
  ).response
  const status = body?.status
  const data = body?.data
  if (status !== 422 || !data) {
    return { fieldErrors: {}, message: null }
  }
  const fieldErrors: Record<string, string> = {}
  for (const item of data.errors ?? []) {
    const pointer = item.pointer ?? ''
    const field = pointer.replace(/^#\//, '')
    if (TASK_FIELDS.has(field) && item.detail) {
      fieldErrors[field] = item.detail
    }
  }
  const message =
    Object.keys(fieldErrors).length > 0
      ? null
      : (data.title ?? 'Validation failed. Please check your input.');
  return { fieldErrors, message }
}
