import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.tsx'
import { mapAddCommentErrors } from '../api/commentErrors.ts'
import { useAddCommentMutation, useCommentsQuery } from '../hooks/useCommentsQueries.ts'
import type { CreateCommentFormValues } from '../schemas/comment.schema.ts'
import { AddCommentForm } from './AddCommentForm.tsx'

function getStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response
    return response?.status
  }
  return undefined
}

type CommentsSectionProps = {
  projectId: string
  taskId: string
}

/**
 * Comments section for task details — list + add form.
 * Visible to anyone who can view the task (members-only enforced by the
 * backend). No edit/delete controls (out of MVP per business-rules 2.5).
 * Errors branch on ProblemDetails `status`, never on human-readable `detail`.
 */
export function CommentsSection({ projectId, taskId }: CommentsSectionProps) {
  const { data, isLoading, isError, error } = useCommentsQuery(projectId, taskId)
  const addMutation = useAddCommentMutation(projectId, taskId)
  const [addError, setAddError] = useState<string | null>(null)

  const handleAdd = async (values: CreateCommentFormValues) => {
    setAddError(null)
    try {
      await addMutation.mutateAsync({ content: values.content })
      return undefined
    } catch (err) {
      const mapped = mapAddCommentErrors(err)
      if (Object.keys(mapped.fieldErrors).length > 0) {
        return mapped.fieldErrors
      }
      const status = getStatus(err)
      if (status === 401) {
        setAddError('You are not authenticated. Please sign in again.')
      } else if (status === 403) {
        setAddError('Only project members can comment on tasks.')
      } else if (status === 404) {
        setAddError('Task not found.')
      } else {
        setAddError(mapped.message ?? 'Unable to add comment. Please try again.')
      }
      // Non-undefined return keeps the typed content so it is not lost.
      return {}
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div aria-label="Loading comments" className="space-y-2">
            <div className="h-6 animate-pulse rounded bg-gray-100" aria-hidden="true" />
            <p className="text-sm text-gray-500">Loading comments…</p>
          </div>
        ) : isError ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4">
            {getStatus(error) === 401 ? (
              <p className="text-sm text-red-700">You are not authenticated. Please sign in again.</p>
            ) : getStatus(error) === 403 ? (
              <p className="text-sm text-red-700">You do not have access to these comments.</p>
            ) : (
              <p className="text-sm text-red-700">Unable to load comments. Please try again.</p>
            )}
          </div>
        ) : !data || data.data.length === 0 ? (
          <p className="text-sm italic text-gray-500">No comments yet.</p>
        ) : (
          <ul aria-label="Task comments" className="divide-y divide-gray-100">
            {data.data.map((comment) => (
              <li key={comment.id} className="py-2">
                <p className="text-sm text-gray-900">{comment.content}</p>
                <p className="mt-0.5 text-xs text-gray-500">{comment.createdAt}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-900">Add comment</h3>
          <div className="mt-2">
            <AddCommentForm
              serverError={addError}
              isSubmitting={addMutation.isPending}
              onSubmit={handleAdd}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
