import { httpClient } from '../../../lib/http/client.ts'

import type { AddMemberRequest, Member, MembersList } from '../types/member.types.ts'

/**
 * Members API layer — thin wrapper over shared Axios client
 * (Bearer + withCredentials from centralized interceptors).
 * No direct fetch/axios in components; pattern: Component → Hook → API → httpClient.
 */

type Wrapped<T> = { data: T }

export async function listMembers(projectId: string): Promise<MembersList> {
  const res = await httpClient.get<Wrapped<Member[]>>(`/projects/${projectId}/members`)
  return { data: res.data.data }
}

export async function addMember(
  projectId: string,
  payload: AddMemberRequest,
): Promise<Member> {
  const res = await httpClient.post<Wrapped<Member>>(
    `/projects/${projectId}/members`,
    payload,
  )
  return res.data.data
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  await httpClient.delete(`/projects/${projectId}/members/${userId}`)
}
