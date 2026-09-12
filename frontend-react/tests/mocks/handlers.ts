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

  // Tasks mocks — behavior-focused, contract-first for Sprint 007
  // (backend BE-S007-01..03 not yet built). Task enums per api-design 4.6;
  // list paginated {data, meta} like projects; assignee must be a member (422).
  ...(() => {
    const ALPHA = '00000000-0000-4000-a000-000000000010'
    const BETA = '00000000-0000-4000-a000-000000000020'
    const OWNER = '00000000-0000-4000-a000-000000000001'
    const MEMBER = '00000000-0000-4000-a000-000000000002'
    const membersOf: Record<string, string[]> = {
      [ALPHA]: [OWNER, MEMBER],
      [BETA]: [OWNER],
    }
    type MockTask = {
      id: string
      projectId: string
      title: string
      description: string | null
      type: string | null
      status: string
      priority: string
      assigneeId: string | null
      dueDate: string | null
      createdAt: string
    }
    const now = new Date().toISOString()
    const tasksByProject: Record<string, MockTask[]> = {
      [ALPHA]: [
        { id: '00000000-0000-4000-a000-000000000a10', projectId: ALPHA, title: 'Setup CI', description: 'Add pipeline', type: 'FEATURE', status: 'TODO', priority: 'HIGH', assigneeId: MEMBER, dueDate: '2026-09-20', createdAt: now },
        { id: '00000000-0000-4000-a000-000000000a20', projectId: ALPHA, title: 'Fix login bug', description: null, type: 'BUG', status: 'IN_PROGRESS', priority: 'MEDIUM', assigneeId: null, dueDate: null, createdAt: now },
      ],
      [BETA]: [
        { id: '00000000-0000-4000-a000-000000000b10', projectId: BETA, title: 'Write docs', description: null, type: 'IMPROVEMENT', status: 'DONE', priority: 'LOW', assigneeId: null, dueDate: null, createdAt: now },
      ],
    }
    const problem = (type: string, title: string, status: number, detail: string, instance: string, extra?: Record<string, unknown>) =>
      HttpResponse.json(
        { type: `https://api.example.com/problems/${type}`, title, status, detail, instance, ...extra },
        { status, headers: { 'Content-Type': 'application/problem+json' } },
      )
    const findTask = (projectId: string, taskId: string) =>
      tasksByProject[projectId]?.find((t) => t.id === taskId)
    return [
      http.get('*/api/v1/projects/:projectId/tasks', ({ params, request }) => {
        const projectId = params.projectId as string
        const list = tasksByProject[projectId]
        if (!list) {
          return problem('not-found', 'Not found', 404, 'Project not found', `/api/v1/projects/${projectId}/tasks`)
        }
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page') ?? '1')
        const perPage = Number(url.searchParams.get('perPage') ?? '20')
        // Server-side filtering per api-design 4.7: case-insensitive search
        // on title/description, exact enum matches, combined AND.
        const search = (url.searchParams.get('search') ?? '').toLowerCase()
        const status = url.searchParams.get('status')
        const type = url.searchParams.get('type')
        const priority = url.searchParams.get('priority')
        const filtered = list.filter((t) => {
          if (search && !`${t.title} ${t.description ?? ''}`.toLowerCase().includes(search)) {
            return false
          }
          if (status && t.status !== status) return false
          if (type && t.type !== type) return false
          if (priority && t.priority !== priority) return false
          return true
        })
        const start = (page - 1) * perPage
        return HttpResponse.json({
          data: filtered.slice(start, start + perPage),
          meta: { currentPage: page, perPage, total: filtered.length, lastPage: Math.ceil(filtered.length / perPage) || 1 },
        })
      }),
      http.get('*/api/v1/projects/:projectId/tasks/:taskId', ({ params }) => {
        const projectId = params.projectId as string
        const taskId = params.taskId as string
        const found = findTask(projectId, taskId)
        if (!found) {
          return problem('not-found', 'Not found', 404, 'Task not found', `/api/v1/projects/${projectId}/tasks/${taskId}`)
        }
        return HttpResponse.json({ data: found })
      }),
      http.post('*/api/v1/projects/:projectId/tasks', async ({ params, request }) => {
        const projectId = params.projectId as string
        const list = tasksByProject[projectId]
        if (!list) {
          return problem('not-found', 'Not found', 404, 'Project not found', `/api/v1/projects/${projectId}/tasks`)
        }
        const body = (await request.json()) as { title?: string; description?: string; type?: string; status?: string; priority?: string; assigneeId?: string; dueDate?: string }
        if (!body.title) {
          return problem('validation-error', 'Validation failed', 422, 'Invalid task', `/api/v1/projects/${projectId}/tasks`, {
            errors: [{ detail: 'Task title required', pointer: '#/title' }],
          })
        }
        if (body.assigneeId && !membersOf[projectId]?.includes(body.assigneeId)) {
          return problem('validation-error', 'Validation failed', 422, 'Invalid task', `/api/v1/projects/${projectId}/tasks`, {
            errors: [{ detail: 'Assignee must be a project member', pointer: '#/assigneeId' }],
          })
        }
        const created: MockTask = {
          id: '00000000-0000-4000-a000-000000000a30',
          projectId,
          title: body.title,
          description: body.description ?? null,
          type: body.type ?? null,
          status: body.status ?? 'TODO',
          priority: body.priority ?? 'MEDIUM',
          assigneeId: body.assigneeId ?? null,
          dueDate: body.dueDate ?? null,
          createdAt: new Date().toISOString(),
        }
        list.push(created)
        return HttpResponse.json({ data: created }, { status: 201 })
      }),
      http.patch('*/api/v1/projects/:projectId/tasks/:taskId', async ({ params, request }) => {
        const projectId = params.projectId as string
        const taskId = params.taskId as string
        const found = findTask(projectId, taskId)
        if (!found) {
          return problem('not-found', 'Not found', 404, 'Task not found', `/api/v1/projects/${projectId}/tasks/${taskId}`)
        }
        const body = (await request.json()) as { title?: string; description?: string | null; type?: string | null; status?: string; priority?: string; assigneeId?: string | null; dueDate?: string | null }
        if (body.assigneeId !== undefined && body.assigneeId !== null && !membersOf[projectId]?.includes(body.assigneeId)) {
          return problem('validation-error', 'Validation failed', 422, 'Invalid task', `/api/v1/projects/${projectId}/tasks/${taskId}`, {
            errors: [{ detail: 'Assignee must be a project member', pointer: '#/assigneeId' }],
          })
        }
        if (body.title !== undefined) found.title = body.title
        if (body.description !== undefined) found.description = body.description
        if (body.type !== undefined) found.type = body.type
        if (body.status !== undefined) found.status = body.status
        if (body.priority !== undefined) found.priority = body.priority
        if (body.assigneeId !== undefined) found.assigneeId = body.assigneeId
        if (body.dueDate !== undefined) found.dueDate = body.dueDate
        return HttpResponse.json({ data: found })
      }),
      http.delete('*/api/v1/projects/:projectId/tasks/:taskId', ({ params }) => {
        const projectId = params.projectId as string
        const taskId = params.taskId as string
        const list = tasksByProject[projectId]
        const idx = list?.findIndex((t) => t.id === taskId) ?? -1
        if (!list || idx === -1) {
          return problem('not-found', 'Not found', 404, 'Task not found', `/api/v1/projects/${projectId}/tasks/${taskId}`)
        }
        list.splice(idx, 1)
        return new HttpResponse(null, { status: 204 })
      }),
    ]
  })(),

  // Comments mocks — behavior-focused, contract-first for Sprint 008
  // (backend BE-S008-02 not yet built). Comment {id,content,authorId,createdAt},
  // list is plain {data} like members; content required (422 with #/content).
  ...(() => {
    const ALPHA = '00000000-0000-4000-a000-000000000010'
    const TASK_A10 = '00000000-0000-4000-a000-000000000a10'
    const OWNER = '00000000-0000-4000-a000-000000000001'
    const MEMBER = '00000000-0000-4000-a000-000000000002'
    type MockComment = { id: string; content: string; authorId: string; createdAt: string }
    const now = new Date().toISOString()
    const commentsByTask: Record<string, MockComment[]> = {
      [`${ALPHA}:${TASK_A10}`]: [
        { id: '00000000-0000-4000-a000-000000000c10', content: 'API integration is complete.', authorId: OWNER, createdAt: now },
        { id: '00000000-0000-4000-a000-000000000c20', content: 'Reviewed, looks good.', authorId: MEMBER, createdAt: now },
      ],
    }
    const problem = (type: string, title: string, status: number, detail: string, instance: string, extra?: Record<string, unknown>) =>
      HttpResponse.json(
        { type: `https://api.example.com/problems/${type}`, title, status, detail, instance, ...extra },
        { status, headers: { 'Content-Type': 'application/problem+json' } },
      )
    return [
      http.get('*/api/v1/projects/:projectId/tasks/:taskId/comments', ({ params }) => {
        const key = `${params.projectId as string}:${params.taskId as string}`
        const list = commentsByTask[key]
        if (!list) {
          return problem('not-found', 'Not found', 404, 'Task not found', `/api/v1/projects/${params.projectId}/tasks/${params.taskId}/comments`)
        }
        return HttpResponse.json({ data: list })
      }),
      http.post('*/api/v1/projects/:projectId/tasks/:taskId/comments', async ({ params, request }) => {
        const projectId = params.projectId as string
        const taskId = params.taskId as string
        const key = `${projectId}:${taskId}`
        const list = commentsByTask[key]
        if (!list) {
          return problem('not-found', 'Not found', 404, 'Task not found', `/api/v1/projects/${projectId}/tasks/${taskId}/comments`)
        }
        const body = (await request.json()) as { content?: string }
        if (!body.content) {
          return problem('validation-error', 'Validation failed', 422, 'Invalid comment', `/api/v1/projects/${projectId}/tasks/${taskId}/comments`, {
            errors: [{ detail: 'Comment content required', pointer: '#/content' }],
          })
        }
        const created: MockComment = {
          id: '00000000-0000-4000-a000-000000000c30',
          content: body.content,
          authorId: OWNER,
          createdAt: new Date().toISOString(),
        }
        list.push(created)
        return HttpResponse.json({ data: created }, { status: 201 })
      }),
    ]
  })(),
]
