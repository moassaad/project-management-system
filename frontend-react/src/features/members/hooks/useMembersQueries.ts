import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { addMember, listMembers, removeMember } from '../api/members.api.ts'
import type { AddMemberRequest } from '../types/member.types.ts'

/**
 * TanStack Query hooks for project members — server-state ownership (not Zustand).
 * Keys are centralized for invalidation after mutations. No UI here; FE-S006-02
 * wires these into the members section on project details.
 */

export const memberKeys = {
  all: ['members'] as const,
  lists: () => [...memberKeys.all, 'list'] as const,
  list: (projectId: string) => [...memberKeys.lists(), projectId] as const,
}

export function useMembersQuery(projectId: string) {
  return useQuery({
    queryKey: memberKeys.list(projectId),
    queryFn: () => listMembers(projectId),
    enabled: !!projectId,
  })
}

export function useAddMemberMutation(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddMemberRequest) => addMember(projectId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: memberKeys.list(projectId) })
    },
  })
}

export function useRemoveMemberMutation(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => removeMember(projectId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: memberKeys.list(projectId) })
    },
  })
}
