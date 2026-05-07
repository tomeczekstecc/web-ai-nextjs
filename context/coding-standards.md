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
- Extract reusable logic only after a real repetition appears.
- Extract client-side logic, tend to use `use client` for only the necessary parts.
- Keep components focused and extract reusable logic only after a real repetition appears.

## Next.js

- Follow App Router patterns already present in `src/app/`.
- Keep route files small and move shared UI into `src/components/`.
- Prefer server-side data loading for route content.
- Use route-level loading and error files when that improves UX and matches the existing pattern.

## Domain-Driven Organization

- Organize feature routes by bounded context under `src/app/<domain>/`.
- Keep auth-facing pages under `src/app/auth/` (for example `src/app/auth/sign-in/page.tsx`) instead of scattering auth flows at the app root.
- Keep feature-specific UI under `src/components/<domain>/`; keep only reusable primitives in `src/components/ui/`.
- Keep domain API integrations under `src/lib/api/domains/<domain>/`.
- Keep domain helpers under `src/lib/<domain>/` when they are shared by routes, components, or API handlers.
- Add root-level routes only for truly top-level product surfaces such as the landing page or dashboard entry points.
- Prefer explicit domain names over generic folders such as `shared`, `common`, or `misc`; introduce shared code only after a second real caller appears.

## API Layer

- Use the server-first API structure under `src/lib/api/`.
- Shared fetch behavior belongs in `src/lib/api/core/`.
- Raw backend payloads belong in domain contracts.
- Naming conversion belongs in domain mappers.
- Pages and components should consume mapped models, not raw DTOs.
- Avoid wiring transport logic directly into route components when a domain module is the better fit.

## Styling

- Treat Shadcn/ui components as the primary base components, always refer to Context7  docs for Shadcn/ui - mcp.
- Use Tailwind CSS v4 through `src/app/globals.css`.
- Do not add a `tailwind.config.*` file (deprecated in v4).
- Reuse existing shadcn/ui primitives before inventing parallel base components.
- Match the current visual language: clean spacing, strong hierarchy, and restrained surfaces.
- Keep both light and dark mode working unless a task explicitly narrows scope.

## File Organization

- Routes live in `src/app/`
- Shared UI lives in `src/components/`
- UI primitives live in `src/components/ui/`
- Hooks live in `src/hooks/`
- Utilities and API code live in `src/lib/`
- Integration notes live in `docs/`

This repository uses a `src/` application layout. Keep new application code under `src/` unless it is root-level configuration, documentation, or tooling.

## Code Quality

- Make the smallest change that fully solves the task.
- Do not refactor unrelated code without a clear payoff.
- Remove unused imports, dead branches, and abandoned scaffolding when you touch a file.
- Add brief comments only when the code would otherwise be hard to parse.

## Verification

- Use `pnpm lint` after normal code changes.
- Use `pnpm build` when changing route behavior, app structure, types, or integration-heavy code.
- If a change is documentation-only, a manual verification pass is enough.
