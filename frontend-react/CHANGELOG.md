# Changelog

All notable changes to the React frontend (`frontend-react/`) are documented here.

## Unreleased

### Added
- [FE-S003-01] Established feature-based application structure (`src/app`, `src/features` placeholders, `src/components`, `src/lib`, `src/config`) with `main.tsx` delegating to `AppProviders` and `src/app/App`.
- [FE-S003-02] Added typed environment configuration (`config.apiUrl` from `VITE_API_URL` with dev fallback and validation) and `.env.example`; `.env` files are git-ignored.
- [FE-S003-03] Added centralized routing with React Router v8 (`react-router` package): public `/login`, protected `/dashboard`, `/projects`, `/projects/:projectId`, `/projects/:projectId/tasks/:taskId` placeholders, UX-only guards, `/` redirect and 404 handling; demo `App` replaced by `RouterProvider`.
