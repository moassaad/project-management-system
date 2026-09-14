# Frontend — React

Project Management System — React frontend (`frontend-react/`).

## Technology

- React 19 + TypeScript 6 + Vite 8
- React Router 8 (`react-router` — centralized `src/app/router/`)
- TanStack Query 5 (Server State)
- Zustand 5 (Shared Client State — auth only, memory)
- React Hook Form 7 + Zod 4 (`@hookform/resolvers`)
- Tailwind CSS 3 + PostCSS + Autoprefixer (semantic, `focus-visible`, `aria-*`)
- Vitest 5 + React Testing Library 16 + MSW 2 + jsdom (behavior-focused)
- Axios 1 (shared `lib/http/client.ts` `baseURL` from `config.apiUrl`, `withCredentials:true`)

## Prerequisites

- Node 20+ and npm 10+
  ```bash
  node -v  # v20+
  npm -v   # 10+
  ```
- Backend running for integration (`http://localhost:8080` by default) — see `backend-spring-boot/README.md` or root `README.md` → **Getting Started / Environment Variables**

## Environment Variables

Public — Vite inlines `VITE_*` at build, never put secrets here (see `docs/architecture/system-architecture.md` Frontend Environment Strategy + `.gitignore` ` .env` / `!.env.example`).

| Variable | Default / Example | Notes |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api/v1` | `src/config/env.ts` `resolveApiUrl()` — `DEV` fallback with `console.warn`, `^https?://` validation, trailing slash stripped, `config.apiUrl` as const; prod set at build |

`frontend-react/.env.example`:

```bash
VITE_API_URL=http://localhost:8080/api/v1
```

## How to Run

```bash
cd frontend-react
npm install
# dev (defaults to http://localhost:8080/api/v1)
npm run dev              # http://localhost:5173

# production build with explicit API URL (Vite inlines at build)
VITE_API_URL=https://api.example.com/api/v1 npm run build
npx vite preview         # http://localhost:4173 serves dist/ (base /)

# with local H2 backend (no Docker)
# terminal 1: backend
JAVA_HOME=/tmp/jdk21 ./mvnw spring-boot:run -Dspring-boot.run.profiles=h2 -f ../backend-spring-boot/pom.xml
# terminal 2: frontend
npm run dev
# health
curl http://localhost:8080/api/v1/health  # {"data":{"status":"UP"}}
curl http://localhost:5173/                # frontend
```

`vite.config.ts` — `@vitejs/plugin-react`, `test: {environment: jsdom, setupFiles: tests/setup.ts, globals: true}`, no hard-coded `base` (defaults to `/`).

## Configuration

- `src/config/env.ts` — `FALLBACK_API_URL`, `resolveApiUrl()` `import.meta.env.VITE_API_URL` trimmed, `DEV` fallback, `^https?://` check throws `[config] VITE_API_URL must start with http:// or https://`.
- `src/lib/http/client.ts` — `httpClient`/`rawRefreshClient` `baseURL: config.apiUrl` `Content-Type: application/json` `withCredentials:true` `Authorization: Bearer` memory-only, proactive `isTokenExpired` (30s skew `atob`) + reactive 401 single-flight `refreshAccessTokenShared` (`_retry` guard) + `window.location /login` on failure; `lib/http → features` never reverse.
- `src/lib/store/auth-store.ts` — Zustand `accessToken/user/isAuthenticated/isBootstrapping` memory-only + `sessionHint` `pms.hasSession` `sessionStorage` tab-scoped (never `localStorage` for token).
- `src/lib/queryClient.ts` — `retry:1 staleTime:30000 refetchOnWindowFocus:false`.

## Project Structure

```
frontend-react/
├── src/
│   ├── app/
│   │   ├── App.tsx                # layout + useAuthBootstrap + navigation
│   │   ├── providers/index.tsx    # QueryClientProvider
│   │   └── router/                # index.tsx (centralized), protected-route, public-route
│   ├── features/
│   │   ├── auth/       api/ hooks/ pages/ schemas/ store/ types/
│   │   ├── projects/   api/ hooks/ pages/ schemas/ types/ components/
│   │   ├── members/    api/ components/ hooks/ schemas/ types/
│   │   ├── tasks/      api/ components/ hooks/ pages/ schemas/ types/
│   │   ├── comments/   api/ components/ hooks/ schemas/ types/
│   │   └── dashboard/  hooks/ pages/ types/
│   ├── components/ui/  Button, Card, Input, Layout
│   ├── lib/            http/ (client, sessionHint, tokenExpiry) + queryClient + store/auth-store
│   ├── config/         env.ts
│   ├── utils/          format.ts
│   └── main.tsx
├── tests/
│   ├── setup.ts        # jest-dom + MSW setupServer
│   └── mocks/          # server.ts, handlers.ts (wildcard */api/v1/*, pagination + ProblemDetails 401/403/404/422)
├── .env.example
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js
├── tailwind.config.js / postcss.config.js / index.css
└── package.json
```

Feature-Based Architecture per `docs/architecture/system-architecture.md`: `Component → Hook → Feature API → lib/http/client → Backend`, no `fetch/axios` in `components/pages`, no server data duplication in Zustand.

## How to Test

```bash
cd frontend-react
npm run test              # vitest --run 35 files 175+ passed
npm run test -- src/features/tasks/api/tasks.api.test.ts  # single suite
npm run test:watch        # vitest watch

# type + lint + build (quality gates)
npx tsc -b
npm run lint
npm run build             # tsc -b && vite build 545.96 kB 332 modules
```

**Test strategy:** `Vitest + RTL + MSW` behavior-focused (`tests/mocks/handlers.ts` covers `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id`, `GET/POST /projects/:id/members`, `GET/POST /projects/:id/tasks` with `search/status/type/priority/page/perPage` filtering, `GET/POST /projects/:id/tasks/:taskId/comments`, `POST /auth/login|refresh|logout GET /auth/me` — wildcard `*/api/v1/*`, paginated `{data,meta}` + RFC9457 `ProblemDetails` via `http.get` overrides). Unit (`utils/format`, `sessionHint`, schemas 255/UUID/ISO), component (`Button/Card/Input/Layout`, `TaskBadges`, `TaskForm` a11y), integration (auth bootstrap `refresh→me`, projects/members/tasks/comments/dashboard `list/create/edit/delete + 422 mapping`, filters `search/status/type/priority`, guards).

See also root `README.md` → **How to Test** and `CHANGELOG.md` for Ticket coverage.

## Known limitations (MVP)

- No registration — seed via `SEED_USER_EMAIL/PASSWORD` + `POST /auth/login`.
- Dashboard client caps `5*20` projects / `3*20` tasks per project then `truncated`/`failedProjectIds` notices; counts approximate when truncated.
- Tasks: `VITE_API_URL` public, refresh via `HttpOnly Secure SameSite Strict` `withCredentials:true`; no offline, no APM/analytics; validation `maxLength:255` `dueDate` ISO `YYYY-MM-DD`.
- Comments: list/create only, no edit/delete.
- No rate limiting, no file attachments, no real-time/websocket.
