import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.tsx'
import { useMembersQuery } from '../../members/hooks/useMembersQueries.ts'
import { useTaskQuery, useUpdateTaskMutation } from '../hooks/useTasksQueries.ts'
import {
  updateTaskSchema,
  type UpdateTaskFormValues,
} from '../schemas/task.schema.ts'
import type { TaskPriority, TaskStatus, TaskType } from '../types/task.types.ts'
import { TaskForm } from '../components/TaskForm.tsx'
import { mapTaskValidationErrors } from '../api/taskErrors.ts'

function getStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response
    return response?.status
  }
  return undefined
}

/**
 * Task edit page at /projects/:projectId/tasks/:taskId/edit (protected).
 * Loads via useTaskQuery (loading/404 states), assignee options from members
 * query, submit via update mutation (hook invalidates), 422 mapped to fields.
 */
export function TaskEditPage() {
  const { projectId = '', taskId = '' } = useParams()
  const navigate = useNavigate()
  const taskQuery = useTaskQuery(projectId, taskId)
  const membersQuery = useMembersQuery(projectId)
  const mutation = useUpdateTaskMutation(projectId, taskId)
  const [serverError, setServerError] = useState<string | null>(null)

  const handleSubmit = async (values: UpdateTaskFormValues) => {
    setServerError(null)
    try {
      await mutation.mutateAsync({
        title: values.title,
        description: values.description === '' ? null : values.description,
        type: (values.type || null) as TaskType | null,
        status: (values.status || undefined) as TaskStatus | undefined,
        priority: (values.priority || undefined) as TaskPriority | undefined,
        assigneeId: values.assigneeId === '' ? null : values.assigneeId,
        dueDate: values.dueDate === '' ? null : values.dueDate,
      })
      await navigate(`/projects/${projectId}/tasks/${taskId}`)
      return undefined
    } catch (error) {
      const mapped = mapTaskValidationErrors(error)
      if (Object.keys(mapped.fieldErrors).length > 0) {
        return mapped.fieldErrors
      }
      const status = getStatus(error)
      if (status === 401) {
        setServerError('You are not authenticated. Please sign in again.')
      } else if (status === 403) {
        setServerError('Only the project owner or the assignee can edit this task.')
      } else if (status === 404) {
        setServerError('Task not found.')
      } else {
        setServerError(mapped.message ?? 'Unable to update task. Please try again.')
      }
      return undefined
    }
  }

  if (taskQuery.isLoading) {
    return (
      <section aria-label="Edit task">
        <div aria-label="Loading task" className="space-y-3">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-100" aria-hidden="true" />
          <p className="text-sm text-gray-500">Loading task…</p>
        </div>
      </section>
    )
  }

  if (taskQuery.isError || !taskQuery.data) {
    const status = getStatus(taskQuery.error)
    return (
      <section aria-label="Edit task">
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {status === 404 || !taskQuery.data
              ? 'Task not found.'
              : status === 401
                ? 'You are not authenticated. Please sign in again.'
                : status === 403
                  ? 'You do not have access to this task.'
                  : 'Unable to load task. Please try again.'}
          </p>
          <Link
            to={`/projects/${projectId}/tasks`}
            className="mt-3 inline-block rounded text-sm text-blue-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Back to tasks
          </Link>
        </div>
      </section>
    )
  }

  const task = taskQuery.data

  return (
    <section aria-label="Edit task">
      <Link
        to={`/projects/${projectId}/tasks/${taskId}`}
        className="rounded text-sm text-blue-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Back to task
      </Link>
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>Edit task</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm<UpdateTaskFormValues>
            schema={updateTaskSchema}
            defaultValues={{
              title: task.title,
              description: task.description ?? '',
              type: task.type ?? '',
              status: task.status,
              priority: task.priority,
              assigneeId: task.assigneeId ?? '',
              dueDate: task.dueDate ?? '',
            }}
            submitLabel="Save changes"
            serverError={serverError}
            isSubmitting={mutation.isPending}
            members={membersQuery.data?.data ?? []}
            membersLoading={membersQuery.isLoading}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </section>
  )
}
