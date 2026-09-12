import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.tsx'
import { useCreateProjectMutation } from '../hooks/useProjectsQueries.ts'
import {
  createProjectSchema,
  type CreateProjectFormValues,
} from '../schemas/project.schema.ts'
import { ProjectForm } from '../components/ProjectForm.tsx'
import { mapValidationErrors } from '../api/projectErrors.ts'

/**
 * Project create page at /projects/new (protected).
 * RHF + zodResolver, submit via mutation, 422 mapped to fields,
 * success invalidates queries (hook) + navigates to details.
 */
export function ProjectCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreateProjectMutation()
  const [serverError, setServerError] = useState<string | null>(null)

  const handleSubmit = async (values: CreateProjectFormValues) => {
    setServerError(null)
    try {
      const project = await mutation.mutateAsync({
        name: values.name,
        description: values.description || undefined,
      })
      await navigate(`/projects/${project.id}`)
      return undefined
    } catch (error) {
      const mapped = mapValidationErrors(error)
      if (Object.keys(mapped.fieldErrors).length > 0) {
        return mapped.fieldErrors
      }
      const status = (error as { response?: { status?: number } }).response?.status
      if (status === 401) {
        setServerError('You are not authenticated. Please sign in again.')
      } else if (status === 403) {
        setServerError('You do not have permission to create projects.')
      } else {
        setServerError(mapped.message ?? 'Unable to create project. Please try again.')
      }
      return undefined
    }
  }

  return (
    <section aria-label="Create project">
      <Link
        to="/projects"
        className="rounded text-sm text-blue-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Back to projects
      </Link>
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>New project</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm<CreateProjectFormValues>
            schema={createProjectSchema}
            defaultValues={{ name: '', description: '' }}
            submitLabel="Create project"
            serverError={serverError}
            isSubmitting={mutation.isPending}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </section>
  )
}
