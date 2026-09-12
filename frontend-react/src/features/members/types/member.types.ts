/**
 * Members contract types — contract-first for Sprint 006 (backend BE-S006-01..03
 * not yet built; MSW mocks this shape). camelCase + UUID strings per
 * docs/api/api-design.md conventions; backend remains source of truth.
 *
 * Contract defined here (see Sprint 006 "paginated or plain data per contract"):
 * - GET /projects/{projectId}/members → 200 `{ data: Member[] }` (plain list)
 * - POST /projects/{projectId}/members → 201 `{ data: Member }`
 *   (401 unauthenticated, 403 non-owner, 404 unknown user, 409 already member, 422)
 * - DELETE /projects/{projectId}/members/{userId} → 204
 *   (401, 403 non-owner, 404 unknown, 400 removing owner)
 */

export type MemberRole = 'OWNER' | 'MEMBER'

export type Member = {
  id: string // UUID string (user id)
  email: string
  role: MemberRole
}

export type AddMemberRequest = {
  userId?: string // UUID string
  email?: string
}

export type MembersList = {
  data: Member[]
}
