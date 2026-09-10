# Sprint 001 — Frontend Bootstrap

## Goal

Verify and prepare the already-existing Vite React + TypeScript frontend. Preserve it unchanged. No Frontend Foundation work.

## Non-Goals

Owned by Sprint 003, explicitly excluded from this Sprint:

- React Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Vitest
- React Testing Library
- MSW
- HTTP infrastructure
- Environment configuration
- `app/providers`
- `app/router`
- Feature-based source structure
- UI foundation
- Authentication
- Business features

## Completion Criteria

- Existing `npm run dev`, `tsc -b`, `npm run lint`, `npm run build` results recorded
- No dependencies added or changed
- No Vite / TypeScript / ESLint config recreated or overwritten
- At most one new file: `frontend-react/CHANGELOG.md` skeleton, only if approved
- Project runnable before and after every Ticket

## Tickets

### Ticket ID: FE-S001-01

### Title: Verify existing Vite baseline

### Goal

Prove the current project runs, typechecks, lints, and builds with zero changes.

### Acceptance Criteria

- `npm run dev` startup result recorded
- `tsc -b` result recorded with existing config
- `npm run lint` result recorded with existing config
- `npm run build` result recorded with existing `tsc -b && vite build`
- Zero source, config, or dependency changes made

### Dependencies

- None

### Ticket ID: FE-S001-02

### Title: Verify frontend housekeeping and preservation

### Goal

Confirm `frontend-react` uses npm, preserves Vite setup, and has minimal hygiene with no new architecture.

### Acceptance Criteria

- `package.json` / `package-lock.json` use npm and preserve existing React + Vite setup
- `.gitignore` coverage for `node_modules/`, `dist/`, local `.env*` verified, gaps listed only
- `vite.config.ts`, `tsconfig.*`, `eslint.config.js`, `index.html`, `src/main.tsx` verified as preserved, no recreation
- No dependencies added; no Sprint 003 structure or tooling introduced

### Dependencies

- FE-S001-01

### Ticket ID: FE-S001-03

### Title: Initialize frontend CHANGELOG

### Goal

Provide the per-implementation `CHANGELOG.md` required by project rules with no behavior change.

### Acceptance Criteria

- `frontend-react/CHANGELOG.md` exists with `Unreleased` section and no invented history
- No source, config, or dependency changes included
- Project remains runnable; no Sprint 003 work included

### Dependencies

- FE-S001-01

## Dependencies

- FE-S001-01: none, runs first
- FE-S001-02: FE-S001-01
- FE-S001-03: FE-S001-01

## Parallel Work

- After FE-S001-01 completes, FE-S001-02 and FE-S001-03 can run in parallel
- No other parallel work
