import { httpClient } from '../../../lib/http/client.ts'

import type { Comment, CommentsList, CreateCommentRequest } from '../types/comment.types.ts'

/**
 * Comments API layer — thin wrapper over shared Axios client.
 * No direct fetch/axios in components; pattern: Component → Hook → API → httpClient.
 * List + add only (no edit/delete in MVP per business-rules 2.5).
 */

type Wrapped<T> = { data: T }

export async function listComments(
  projectId: string,
  taskId: string,
): Promise<CommentsList> {
  const res = await httpClient.get<Wrapped<Comment[]>>(
    `/projects/${projectId}/tasks/${taskId}/comments`,
  )
  return { data: res.data.data }
}

export async function addComment(
  projectId: string,
  taskId: string,
  payload: CreateCommentRequest,
): Promise<Comment> {
  const res = await httpClient.post<Wrapped<Comment>>(
    `/projects/${projectId}/tasks/${taskId}/comments`,
    payload,
  )
  return res.data.data
}
