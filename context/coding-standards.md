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
- Follow basic CQRS in each API domain: read operations live in `queries.ts`, write operations live in `commands.ts`.
- Queries must not change backend state; commands are the only API-domain modules that create, update, submit, revoke, provision, or delete.
- Do not call commands from queries or queries from commands. Share pure mapping and contract code through `mapper.ts` and `contract.ts`.
- Pages and components should consume mapped models, not raw DTOs.
- Avoid wiring transport logic directly into route components when a domain module is the better fit.

## TanStack Query

- Use TanStack Query v5 for dynamic CRUD surfaces with tables, filters, pagination, optimistic updates, and background refresh.
- Keep server-first API calls (`queries.ts`, `commands.ts`) for route entry, auth gates, redirects, and server-only secure calls.
- Add browser-safe `client.ts` fetchers for domains that need client server-state; these must not import `server-only` modules or `src/lib/api/core/http.ts`.
- Define stable query keys per domain in `query-keys.ts` using the factory pattern: `all`, `lists()`, `list(params)`, `details()`, `detail(id)`.
- Define reusable query options in `query-options.ts` with balanced `staleTime`, retry policy, and optional `refetchInterval`.
- Prefetch important first-screen queries in the server component with `prefetchQuery` and wrap client components with `HydrationBoundary`.
- After mutations, invalidate the smallest related surfaces; prefer `queryClient.invalidateQueries({ queryKey })` over broad cache clears.
- Use optimistic updates with rollback for low-latency status changes; snapshot previous data in `onMutate`, restore in `onError`, and settle in `onSettled`.
- Keep the app-wide `QueryClientProvider` in `src/components/providers/query-provider.tsx`; include dev-only Devtools.
- Do not add TanStack Query to static public pages, auth screens, or simple one-shot server-rendered data.

## Validation

- Use Zod as the project standard for all runtime validation and schema definition.
- Define schemas with `z.object()` and infer TypeScript types with `z.infer<typeof schema>` — never duplicate types manually.
- Co-locate schemas with the single file that uses them (e.g. define `signInSchema` at the top of `sign-in-form.tsx`). Move a schema to `src/lib/<domain>/` only when a second real consumer appears. Never create a global `schemas/` dumping ground.
- Use `.parse()` at system boundaries (form submission, API responses, route params); use `.safeParse()` when you need to handle errors without throwing.
- Do not use Yup, Joi, or other validation libraries.

## Forms

- Use TanStack Form as the project standard for all forms (see: https://ui.shadcn.com/docs/forms/tanstack-form).
- Install `@tanstack/react-form` only when shadcn/ui requires it (i.e. when adding the `field` component or any form-related shadcn/ui block that pulls it in). Do not add it as a standalone dependency for ad-hoc form state.
- Define form shape with Zod and pass the schema to `useForm()` via `validators`.
- Wire each field through `form.Field`: bind `field.state.value` to value, `field.handleChange` to onChange, and `field.handleBlur` to onBlur.
- Show validation errors conditionally after the field is touched: `isTouched && !isValid`.
- Add `data-invalid` to the field wrapper and `aria-invalid` to the control for accessible error states.
- Use `mode="array"` on parent fields for dynamic lists; manage items with `pushValue` / `removeValue`.
- Prefer `onBlur` or `onSubmit` validation triggers; avoid `onChange` validation unless UX explicitly requires it.
- Do not use React Hook Form, Formik, or other form libraries.

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
- DRY: extract shared logic only when the same code appears in two or more real callers; do not pre-abstract.
- KISS: prefer the simplest solution that fully works; avoid clever patterns, extra layers, or premature generalization.

## Verification

- Use `pnpm lint` after normal code changes.
- Use `pnpm build` when changing route behavior, app structure, types, or integration-heavy code.
- If a change is documentation-only, a manual verification pass is enough.
