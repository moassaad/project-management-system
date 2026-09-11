# Changelog

All notable changes to the React frontend (`frontend-react/`) are documented here.

## Unreleased

### Added
- [FE-S003-01] Established feature-based application structure (`src/app`, `src/features` placeholders, `src/components`, `src/lib`, `src/config`) with `main.tsx` delegating to `AppProviders` and `src/app/App`.
- [FE-S003-02] Added typed environment configuration (`config.apiUrl` from `VITE_API_URL` with dev fallback and validation) and `.env.example`; `.env` files are git-ignored.
- [FE-S003-03] Added centralized routing with React Router v8 (`react-router` package): public `/login`, protected `/dashboard`, `/projects`, `/projects/:projectId`, `/projects/:projectId/tasks/:taskId` placeholders, UX-only guards, `/` redirect and 404 handling; demo `App` replaced by `RouterProvider`.
- [FE-S003-04] Added application providers layer: `QueryClient` (`retry:1`, `staleTime:30000`, `refetchOnWindowFocus:false`) at `src/lib/queryClient.ts` composed via `QueryClientProvider` in `src/app/providers/index.tsx`; `src/main.tsx` delegates to `AppProviders` → `RouterProvider` with intentional ordering.
- [FE-S003-06] Added Zustand shared client state foundation (`zustand@^5`): memory-only `accessToken` with derived `isAuthenticated`, actions `setAccessToken`/`clearAuth` at `src/lib/store/auth-store.ts` (re-exported at `src/features/auth/store/auth-store.ts`); ownership rule documented (Server→Query, Local→useState, Shared→Zustand), anti-duplication noted, no persistence.
- [FE-S003-05] Added shared HTTP infrastructure (`axios` + `@tanstack/react-query` already present): `src/lib/http/client.ts` with `baseURL` from `config.apiUrl`, `Content-Type: application/json`, `Authorization: Bearer <token>` placeholder (memory via Zustand), `withCredentials:true`, RFC 9457 passthrough; feature API example `src/features/projects/api/projects.api.ts` (`listProjects()` stub) and `useHealthQuery` for `GET /api/v1/health` (server-state via Query); ESLint rule enforces no direct `fetch`/`axios` in components.
