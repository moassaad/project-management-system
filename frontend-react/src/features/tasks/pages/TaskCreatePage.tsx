import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.tsx'
import { useMembersQuery } from '../../members/hooks/useMembersQueries.ts'
import { useCreateTaskMutation } from '../hooks/useTasksQueries.ts'
import {
  createTaskSchema,
  type CreateTaskFormValues,
} from '../schemas/task.schema.ts'
import type { TaskPriority, TaskStatus, TaskType } from '../types/task.types.ts'
import { TaskForm } from '../components/TaskForm.tsx'
import { mapTaskValidationErrors } from '../api/taskErrors.ts'

/**
 * Task create page at /projects/:projectId/tasks/new (protected).
 * RHF + zodResolver, assignee options from members query, submit via
 * mutation, 422 mapped to fields, success invalidates queries (hook) +
 * navigates to task details.
 */
export function TaskCreatePage() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const mutation = useCreateTaskMutation(projectId)
  const membersQuery = useMembersQuery(projectId)
  const [serverError, setServerError] = useState<string | null>(null)

  const handleSubmit = async (values: CreateTaskFormValues) => {
    setServerError(null)
    try {
      const task = await mutation.mutateAsync({
        title: values.title,
        description: values.description || undefined,
        type: (values.type || undefined) as TaskType | undefined,
        status: (values.status || undefined) as TaskStatus | undefined,
        priority: (values.priority || undefined) as TaskPriority | undefined,
        assigneeId: values.assigneeId || undefined,
        dueDate: values.dueDate || undefined,
      })
      await navigate(`/projects/${projectId}/tasks/${task.id}`)
      return undefined
    } catch (error) {
      const mapped = mapTaskValidationErrors(error)
      if (Object.keys(mapped.fieldErrors).length > 0) {
        return mapped.fieldErrors
      }
      const status = (error as { response?: { status?: number } }).response?.status
      if (status === 401) {
        setServerError('You are not authenticated. Please sign in again.')
      } else if (status === 403) {
        setServerError('You do not have permission to create tasks in this project.')
      } else if (status === 404) {
        setServerError('Project not found.')
      } else {
        setServerError(mapped.message ?? 'Unable to create task. Please try again.')
      }
      return undefined
    }
  }

  return (
    <section aria-label="Create task">
      <Link
        to={`/projects/${projectId}/tasks`}
        className="rounded text-sm text-blue-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Back to tasks
      </Link>
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>New task</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm<CreateTaskFormValues>
            schema={createTaskSchema}
            defaultValues={{
              title: '',
              description: '',
              type: '',
              status: '',
              priority: '',
              assigneeId: '',
              dueDate: '',
            }}
            submitLabel="Create task"
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
