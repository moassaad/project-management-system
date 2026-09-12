import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { addComment, listComments } from '../api/comments.api.ts'
import type { CreateCommentRequest } from '../types/comment.types.ts'

/**
 * TanStack Query hooks for task comments — server-state ownership (not Zustand).
 * Keys are centralized for invalidation after mutations. No UI here;
 * FE-S008-02 wires these into the comments section on task details.
 */

export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (projectId: string, taskId: string) =>
    [...commentKeys.lists(), projectId, taskId] as const,
}

export function useCommentsQuery(projectId: string, taskId: string) {
  return useQuery({
    queryKey: commentKeys.list(projectId, taskId),
    queryFn: () => listComments(projectId, taskId),
    enabled: !!projectId && !!taskId,
  })
}

export function useAddCommentMutation(projectId: string, taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCommentRequest) => addComment(projectId, taskId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: commentKeys.list(projectId, taskId) })
    },
  })
}
