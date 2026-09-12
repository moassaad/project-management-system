/**
 * Comments contract types — contract-first for Sprint 008 (backend BE-S008-02
 * not yet built; MSW mocks this shape). camelCase + UUID strings per
 * docs/api/api-design.md 4.8 and docs/business-rules 2.5; backend remains
 * source of truth. No edit/delete in MVP — list + add only.
 *
 * Contract defined here:
 * - GET /projects/{projectId}/tasks/{taskId}/comments → 200 `{ data: Comment[] }`
 *   (plain list, like members; task-detail UI shows all — BE-S008-02 must align)
 * - POST .../comments → 201 `{ data: Comment }`
 *   (401 unauthenticated, 403 non-member, 404 unknown task, 422 empty content)
 */

export type Comment = {
  id: string // UUID string
  content: string
  authorId: string // UUID string
  createdAt: string // ISO string
}

export type CreateCommentRequest = {
  content: string
}

export type CommentsList = {
  data: Comment[]
}
