import { useState } from 'react'

import { Button } from '../../../components/ui/Button.tsx'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card.tsx'
import { mapAddMemberErrors } from '../api/memberErrors.ts'
import { useAddMemberMutation, useMembersQuery, useRemoveMemberMutation } from '../hooks/useMembersQueries.ts'
import type { AddMemberFormValues } from '../schemas/member.schema.ts'
import type { Member } from '../types/member.types.ts'
import { AddMemberForm } from './AddMemberForm.tsx'

function getStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response
    return response?.status
  }
  return undefined
}

type MembersSectionProps = {
  projectId: string
  isOwner: boolean
}

/**
 * Members section for project details — list/add/remove with confirmation.
 * Members list visible to anyone who can view the project; add/remove
 * controls are owner-gated for UX only (backend authorization authoritative,
 * business-rules 2.6). Errors branch on ProblemDetails `status`, never on
 * human-readable `detail`.
 */
export function MembersSection({ projectId, isOwner }: MembersSectionProps) {
  const { data, isLoading, isError, error } = useMembersQuery(projectId)
  const addMutation = useAddMemberMutation(projectId)
  const removeMutation = useRemoveMemberMutation(projectId)
  const [addError, setAddError] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [confirmingRemove, setConfirmingRemove] = useState<Member | null>(null)

  const handleAdd = async (values: AddMemberFormValues) => {
    setAddError(null)
    try {
      await addMutation.mutateAsync({
        userId: values.userId || undefined,
        email: values.email || undefined,
      })
      return undefined
    } catch (err) {
      const mapped = mapAddMemberErrors(err)
      if (Object.keys(mapped.fieldErrors).length > 0) {
        return mapped.fieldErrors
      }
      const status = getStatus(err)
      if (status === 401) {
        setAddError('You are not authenticated. Please sign in again.')
      } else if (status === 403) {
        setAddError('Only the project owner can add members.')
      } else if (status === 404) {
        setAddError('User not found. Only existing users can be added.')
      } else if (status === 409) {
        setAddError('This user is already a project member.')
      } else {
        setAddError(mapped.message ?? 'Unable to add member. Please try again.')
      }
      // Non-undefined return keeps the form values so the owner can adjust.
      return {}
    }
  }

  const handleRemove = async () => {
    if (!confirmingRemove) return
    setRemoveError(null)
    try {
      await removeMutation.mutateAsync(confirmingRemove.id)
      setConfirmingRemove(null)
    } catch (err) {
      const status = getStatus(err)
      if (status === 401) {
        setRemoveError('You are not authenticated. Please sign in again.')
      } else if (status === 403) {
        setRemoveError('Only the project owner can remove members.')
      } else if (status === 404) {
        setRemoveError('Member not found.')
      } else if (status === 400) {
        setRemoveError('The project owner cannot be removed.')
      } else {
        setRemoveError('Unable to remove member. Please try again.')
      }
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div aria-label="Loading members" className="space-y-2">
            <div className="h-6 animate-pulse rounded bg-gray-100" aria-hidden="true" />
            <p className="text-sm text-gray-500">Loading members…</p>
          </div>
        ) : isError ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4">
            {getStatus(error) === 401 ? (
              <p className="text-sm text-red-700">You are not authenticated. Please sign in again.</p>
            ) : getStatus(error) === 403 ? (
              <p className="text-sm text-red-700">You do not have access to these members.</p>
            ) : (
              <p className="text-sm text-red-700">Unable to load members. Please try again.</p>
            )}
          </div>
        ) : !data || data.data.length === 0 ? (
          <p className="text-sm italic text-gray-500">No members yet.</p>
        ) : (
          <ul aria-label="Project members" className="divide-y divide-gray-100">
            {data.data.map((member) => (
              <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{member.email}</span>{' '}
                  <span className="text-xs text-gray-500">({member.role})</span>
                </div>
                {isOwner && member.role !== 'OWNER' ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Remove ${member.email}`}
                    onClick={() => {
                      setRemoveError(null)
                      setConfirmingRemove(member)
                    }}
                  >
                    Remove
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {removeError ? (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {removeError}
          </p>
        ) : null}

        {isOwner ? (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-900">Add member</h3>
            <div className="mt-2">
              <AddMemberForm
                serverError={addError}
                isSubmitting={addMutation.isPending}
                onSubmit={handleAdd}
              />
            </div>
          </div>
        ) : null}

        {isOwner && confirmingRemove ? (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={`Remove ${confirmingRemove.email}`}
            aria-describedby="remove-member-description"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4"
          >
            <p id="remove-member-description" className="text-sm text-gray-900">
              Remove member “{confirmingRemove.email}”? They will immediately lose access to
              this project. This action cannot be undone.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmingRemove(null)}
                disabled={removeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void handleRemove()}
                disabled={removeMutation.isPending}
                aria-label={`Confirm remove ${confirmingRemove.email}`}
              >
                {removeMutation.isPending ? 'Removing…' : 'Confirm remove'}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
