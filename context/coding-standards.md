# CI-PRS Web Coding Standards

## TypeScript

- Keep strict typing intact.
- Avoid `any`; use specific types or `unknown`.
- Define domain contracts for backend payloads and frontend-facing models.
- Prefer simple, readable types over deeply abstract generic helpers.

## React

- Use functional components only.
- Default to server components.
- Add `'use client'` only when hooks, browser APIs, or interactive state are required.
- Keep components focused and extract reusable logic only after a real repetition appears.

## Next.js

- Follow App Router patterns already present in `app/`.
- Keep route files small and move shared UI into `components/`.
- Prefer server-side data loading for route content.
- Use route-level loading and error files when that improves UX and matches the existing pattern.

## API Layer

- Use the server-first API structure under `lib/api/`.
- Shared fetch behavior belongs in `lib/api/core/`.
- Raw backend payloads belong in domain contracts.
- Naming conversion belongs in domain mappers.
- Pages and components should consume mapped models, not raw DTOs.
- Avoid wiring transport logic directly into route components when a domain module is the better fit.

## Styling

- Use Tailwind CSS v4 through `app/globals.css`.
- Do not add a `tailwind.config.*` file.
- Reuse existing shadcn/ui primitives before inventing parallel base components.
- Match the current visual language: clean spacing, strong hierarchy, and restrained surfaces.
- Keep both light and dark mode working unless a task explicitly narrows scope.

## File Organization

- Routes live in `app/`
- Shared UI lives in `components/`
- UI primitives live in `components/ui/`
- Hooks live in `hooks/`
- Utilities and API code live in `lib/`
- Integration notes live in `docs/`

This repository uses root-level folders, not `src/`.

## Code Quality

- Make the smallest change that fully solves the task.
- Do not refactor unrelated code without a clear payoff.
- Remove unused imports, dead branches, and abandoned scaffolding when you touch a file.
- Add brief comments only when the code would otherwise be hard to parse.

## Verification

- Use `pnpm lint` after normal code changes.
- Use `pnpm build` when changing route behavior, app structure, types, or integration-heavy code.
- If a change is documentation-only, a manual verification pass is enough.
