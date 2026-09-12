import { http, HttpResponse } from 'msw'

/**
 * MSW handlers — Axios + TanStack Query compatible, behavior-focused.
 * Example handler for GET /api/v1/health (public liveness from Sprint 002 backend).
 * Uses wildcard so it matches regardless of baseURL (http://localhost:8080/api/v1 via config.apiUrl).
 * Added auth handlers for FE-S004-01 (mocked for tests, not business feature).
 */
export const handlers = [
  http.get('*/api/v1/health', () =>
    HttpResponse.json({ data: { status: 'UP' } }),
  ),
  // Exact fallback for jsdom base
  http.get('http://localhost:8080/api/v1/health', () =>
    HttpResponse.json({ data: { status: 'UP' } }),
  ),

  // Auth mocks — behavior-focused, align with auth.api.ts expectations
  http.post('*/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string }
    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        data: {
          accessToken: 'mock-access-token',
          user: { id: '00000000-0000-4000-a000-000000000001', email: body.email },
        },
      })
    }
    return HttpResponse.json(
      {
        type: 'https://api.example.com/problems/invalid-credentials',
        title: 'Invalid credentials',
        status: 401,
        detail: 'Email or password is incorrect.',
        instance: '/api/v1/auth/login',
      },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
    )
  }),
  http.post('*/api/v1/auth/refresh', () =>
    HttpResponse.json({ data: { accessToken: 'mock-refreshed-token' } }),
  ),
  http.post('*/api/v1/auth/logout', () => new HttpResponse(null, { status: 204 })),
  http.get('*/api/v1/auth/me', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (auth === 'Bearer mock-access-token' || auth === 'Bearer mock-refreshed-token') {
      return HttpResponse.json({
        data: { id: '00000000-0000-4000-a000-000000000001', email: 'test@example.com' },
      })
    }
    return HttpResponse.json(
      {
        type: 'https://api.example.com/problems/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'Not authenticated.',
        instance: '/api/v1/auth/me',
      },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
    )
  }),

  // Projects mocks — behavior-focused, paginated, aligned with project types
  ...(() => {
    const projects = [
      {
        id: '00000000-0000-4000-a000-000000000010',
        name: 'Alpha Project',
        description: 'First project',
        ownerId: '00000000-0000-4000-a000-000000000001',
        createdAt: new Date().toISOString(),
      },
      {
        id: '00000000-0000-4000-a000-000000000020',
        name: 'Beta Project',
        description: null,
        ownerId: '00000000-0000-4000-a000-000000000001',
        createdAt: new Date().toISOString(),
      },
    ]
    return [
      http.get('*/api/v1/projects', ({ request }) => {
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page') ?? '1')
        const perPage = Number(url.searchParams.get('perPage') ?? '20')
        const start = (page - 1) * perPage
        const slice = projects.slice(start, start + perPage)
        return HttpResponse.json({
          data: slice,
          meta: { currentPage: page, perPage, total: projects.length, lastPage: Math.ceil(projects.length / perPage) || 1 },
        })
      }),
      http.get('*/api/v1/projects/:projectId', ({ params }) => {
        const found = projects.find((p) => p.id === params.projectId)
        if (!found) {
          return HttpResponse.json(
            { type: 'https://api.example.com/problems/not-found', title: 'Not found', status: 404, detail: 'Project not found', instance: `/api/v1/projects/${params.projectId}` },
            { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
          )
        }
        return HttpResponse.json({ data: found })
      }),
      http.post('*/api/v1/projects', async ({ request }) => {
        const body = (await request.json()) as { name?: string; description?: string }
        if (!body.name) {
          return HttpResponse.json(
            { type: 'https://api.example.com/problems/validation-error', title: 'Validation failed', status: 422, detail: 'Invalid', errors: [{ detail: 'Name required', pointer: '#/name' }] },
            { status: 422, headers: { 'Content-Type': 'application/problem+json' } },
          )
        }
        const created = {
          id: '00000000-0000-4000-a000-000000000030',
          name: body.name,
          description: body.description ?? null,
          ownerId: '00000000-0000-4000-a000-000000000001',
          createdAt: new Date().toISOString(),
        }
        projects.push(created)
        return HttpResponse.json({ data: created }, { status: 201 })
      }),
      http.patch('*/api/v1/projects/:projectId', async ({ params, request }) => {
        const body = (await request.json()) as { name?: string; description?: string }
        const found = projects.find((p) => p.id === params.projectId)
        if (!found) {
          return HttpResponse.json(
            { type: 'https://api.example.com/problems/not-found', title: 'Not found', status: 404, detail: 'Project not found', instance: `/api/v1/projects/${params.projectId}` },
            { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
          )
        }
        if (body.name !== undefined) found.name = body.name
        if (body.description !== undefined) found.description = body.description
        return HttpResponse.json({ data: found })
      }),
      http.delete('*/api/v1/projects/:projectId', ({ params }) => {
        const idx = projects.findIndex((p) => p.id === params.projectId)
        if (idx === -1) {
          return HttpResponse.json(
            { type: 'https://api.example.com/problems/not-found', title: 'Not found', status: 404, detail: 'Project not found', instance: `/api/v1/projects/${params.projectId}` },
            { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
          )
        }
        projects.splice(idx, 1)
        return new HttpResponse(null, { status: 204 })
      }),
    ]
  })(),

  // Members mocks — behavior-focused, contract-first for Sprint 006
  // (backend BE-S006-01..03 not yet built). Member {id,email,role},
  // list is plain {data} per Sprint 006 contract; owner cannot be removed.
  ...(() => {
    const OWNER_ID = '00000000-0000-4000-a000-000000000001'
    const KNOWN_USERS = [
      { id: OWNER_ID, email: 'test@example.com' },
      { id: '00000000-0000-4000-a000-000000000002', email: 'member@example.com' },
      { id: '00000000-0000-4000-a000-000000000003', email: 'new@example.com' },
    ]
    const membersByProject: Record<string, { id: string; email: string; role: string }[]> = {
      '00000000-0000-4000-a000-000000000010': [
        { id: OWNER_ID, email: 'test@example.com', role: 'OWNER' },
        { id: '00000000-0000-4000-a000-000000000002', email: 'member@example.com', role: 'MEMBER' },
      ],
      '00000000-0000-4000-a000-000000000020': [
        { id: OWNER_ID, email: 'test@example.com', role: 'OWNER' },
      ],
    }
    const problem = (type: string, title: string, status: number, detail: string, instance: string, extra?: Record<string, unknown>) =>
      HttpResponse.json(
        { type: `https://api.example.com/problems/${type}`, title, status, detail, instance, ...extra },
        { status, headers: { 'Content-Type': 'application/problem+json' } },
      )
    return [
      http.get('*/api/v1/projects/:projectId/members', ({ params }) => {
        const list = membersByProject[params.projectId as string]
        if (!list) {
          return problem('not-found', 'Not found', 404, 'Project not found', `/api/v1/projects/${params.projectId}/members`)
        }
        return HttpResponse.json({ data: list })
      }),
      http.post('*/api/v1/projects/:projectId/members', async ({ params, request }) => {
        const projectId = params.projectId as string
        const list = membersByProject[projectId]
        if (!list) {
          return problem('not-found', 'Not found', 404, 'Project not found', `/api/v1/projects/${projectId}/members`)
        }
        const body = (await request.json()) as { userId?: string; email?: string }
        const userId = body.userId?.length ? body.userId : undefined
        const email = body.email?.length ? body.email : undefined
        if (!userId && !email) {
          return problem('validation-error', 'Validation failed', 422, 'Invalid member', `/api/v1/projects/${projectId}/members`, {
            errors: [{ detail: 'Provide a user ID or an email address', pointer: '#/email' }],
          })
        }
        const known = KNOWN_USERS.find((u) => (userId ? u.id === userId : u.email === email))
        if (!known) {
          return problem('unknown-user', 'Unknown user', 404, 'User does not exist', `/api/v1/projects/${projectId}/members`)
        }
        if (list.some((m) => m.id === known.id)) {
          return problem('already-member', 'Already a member', 409, 'User is already a project member', `/api/v1/projects/${projectId}/members`)
        }
        const created = { id: known.id, email: known.email, role: 'MEMBER' }
        list.push(created)
        return HttpResponse.json({ data: created }, { status: 201 })
      }),
      http.delete('*/api/v1/projects/:projectId/members/:userId', ({ params }) => {
        const projectId = params.projectId as string
        const userId = params.userId as string
        const list = membersByProject[projectId]
        if (!list) {
          return problem('not-found', 'Not found', 404, 'Project not found', `/api/v1/projects/${projectId}/members/${userId}`)
        }
        const idx = list.findIndex((m) => m.id === userId)
        if (idx === -1) {
          return problem('not-found', 'Not found', 404, 'Member not found', `/api/v1/projects/${projectId}/members/${userId}`)
        }
        if (list[idx].role === 'OWNER') {
          return problem('cannot-remove-owner', 'Cannot remove owner', 400, 'The project owner cannot be removed', `/api/v1/projects/${projectId}/members/${userId}`)
        }
        list.splice(idx, 1)
        return new HttpResponse(null, { status: 204 })
      }),
    ]
  })(),
]
