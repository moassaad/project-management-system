import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.tsx'
import { useProjectQuery, useUpdateProjectMutation } from '../hooks/useProjectsQueries.ts'
import {
  updateProjectSchema,
  type UpdateProjectFormValues,
} from '../schemas/project.schema.ts'
import { ProjectForm } from '../components/ProjectForm.tsx'
import { mapValidationErrors } from '../api/projectErrors.ts'

/**
 * Project edit page at /projects/:projectId/edit (protected).
 * Owner gating is UX-only (backend authoritative); non-owners see a notice.
 * RHF + zodResolver, 422 mapped to fields, success invalidates + navigates to details.
 */
export function ProjectEditPage() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useProjectQuery(projectId)
  const mutation = useUpdateProjectMutation(projectId)
  const [serverError, setServerError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <section aria-label="Edit project">
        <div aria-label="Loading project" className="space-y-3">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-100" aria-hidden="true" />
          <div className="h-24 animate-pulse rounded-lg bg-gray-100" aria-hidden="true" />
          <p className="text-sm text-gray-500">Loading project…</p>
        </div>
      </section>
    )
  }

  if (isError || !data) {
    return (
      <section aria-label="Edit project">
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">Unable to load project for editing.</p>
          <Link
            to="/projects"
            className="mt-3 inline-block rounded text-sm text-blue-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Back to projects
          </Link>
        </div>
      </section>
    )
  }

  const handleSubmit = async (values: UpdateProjectFormValues) => {
    setServerError(null)
    try {
      await mutation.mutateAsync({
        ...(values.name !== undefined ? { name: values.name } : {}),
        ...(values.description !== undefined ? { description: values.description } : {}),
      })
      await navigate(`/projects/${projectId}`)
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
        setServerError('Only the project owner can edit this project.')
      } else if (status === 404) {
        setServerError('Project not found.')
      } else {
        setServerError(mapped.message ?? 'Unable to save project. Please try again.')
      }
      return undefined
    }
  }

  return (
    <section aria-label="Edit project">
      <Link
        to={`/projects/${projectId}`}
        className="rounded text-sm text-blue-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Back to project
      </Link>
      <Card className="mt-3">
        <CardHeader>
          <CardTitle>Edit project</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm<UpdateProjectFormValues>
            schema={updateProjectSchema}
            defaultValues={{ name: data.name, description: data.description ?? '' }}
            submitLabel="Save changes"
            serverError={serverError}
            isSubmitting={mutation.isPending}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </section>
  )
}
