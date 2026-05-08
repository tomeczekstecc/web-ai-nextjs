# Implementation Plan: Client Server-State Integration

**Branch**: `002-integrate-tanstack-query` | **Date**: 2026-05-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-integrate-tanstack-query/spec.md`

## Summary

Integrate TanStack Query v5 as the app-wide client server-state provider while preserving the existing server-first `src/lib/api` domain pattern. The first value slice is a protected `/applications` CRUD surface that uses the applications domain as the pilot for browser-safe fetchers, stable query keys, reusable query options, first-screen list hydration, server-shaped table state, targeted invalidation, one optimistic reversible mutation, conservative background refresh, and development-only query inspection.

The implementation keeps static public pages, auth screens, and simple server-rendered views server-first by default. TanStack Query is introduced for dynamic CRUD domains only, with README and coding standards updated so future domains follow the same split.

## Technical Context

**Language/Version**: TypeScript 5.8.x, React 19, Next.js 16 App Router  
**Primary Dependencies**: TanStack Query v5, TanStack Query Devtools, existing TanStack Table, TanStack Form, Zod, shadcn/ui, Better Auth/Keycloak-facing auth assumptions, existing `src/lib/api` domain layer  
**Storage**: Browser TanStack Query cache for server state; URL search params for page/search/filter/sort table state; local React state for ephemeral row selection, column visibility, dialogs, and pending UI; remote Laravel or contract-compatible mock API for application records  
**Testing**: N/A - constitution forbids automated tests  
**Target Platform**: Modern desktop and mobile browsers  
**Project Type**: web frontend  
**Performance Goals**: Hydrated first applications list avoids duplicate immediate client request; CRUD interactions update without full page reload; text search is debounced; active list can refresh conservatively in the background; reconnect refreshes active reads  
**Constraints**: Polish UI, light/dark theme parity, responsive internal app shell, no automated tests, no browser imports of server-only helpers, protected `/applications` route, direct browser-safe backend calls by default, Keycloak-backed browser trust mechanism deferred to planning/integration detail  
**Scale/Scope**: App-wide provider setup plus one protected `/applications` pilot CRUD surface; applications domain browser contract; README and coding standards updates; no bulk actions, no offline mutation queue, no replacement of dashboard mock table

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Problem understood before coding begins?** Yes. The spec fixes the pilot domain, route, provider scope, table behavior, mutation behavior, error behavior, auth assumptions, and verification approach.
- **Simplest viable solution?** Yes. The plan introduces TanStack Query once, then proves it through one applications CRUD surface rather than refactoring every domain.
- **Planned edits surgical and limited in scope?** Yes. Edits stay in provider setup, the applications route/components/domain files, documentation, and contract artifacts.
- **Success criteria explicit and verifiable?** Yes. The spec defines manual verification for list loading, create/update/delete, optimistic rollback or revalidation, reconnect refetch, recoverable errors, and lint/build.
- **Preserves TypeScript, App Router, shadcn/ui, Polish UI, responsiveness, and theme parity?** Yes. The UI uses existing internal shell and shadcn/TanStack Form patterns, with Polish copy and theme parity required.
- **Avoids automated tests and unnecessary comments?** Yes. Verification is lint/build plus manual checks; implementation should not add automated tests.
- **Preserves decoupling from Laravel implementation details?** Yes. Browser-safe contracts and mappers remain in the domain layer, real backend endpoints are preferred, and mock endpoints must preserve the same contract without mock-only shortcuts.

**Gate Status**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/002-integrate-tanstack-query/
|- plan.md
|- research.md
|- data-model.md
|- quickstart.md
|- contracts/
|  |- applications-browser-api.openapi.yaml
|  `- applications-query-contract.md
`- checklists/
   `- requirements.md
```

### Source Code (`src/`)

```text
src/app/
|- layout.tsx
`- applications/
   |- page.tsx
   |- loading.tsx
   `- error.tsx

src/components/
|- providers/
|  `- query-provider.tsx
`- applications/
   |- applications-table.tsx
   |- application-create-dialog.tsx
   |- application-edit-dialog.tsx
   `- application-row-actions.tsx

src/lib/
|- api/
|  `- domains/
|     `- applications/
|        |- contract.ts
|        |- mapper.ts
|        |- queries.ts
|        |- commands.ts
|        |- client.ts
|        |- query-keys.ts
|        `- query-options.ts
`- query/
   `- client.ts

context/
`- coding-standards.md

README.md
```

**Structure Decision**: Add an app-wide query provider, but keep first usage limited to the protected `/applications` pilot. Evolve `src/lib/api/domains/applications/` progressively with browser-safe client fetchers, key factories, and query options while preserving existing server-only `queries.ts` and `commands.ts`. Feature UI belongs under `src/components/applications/`, route entry under `src/app/applications/`, and shared QueryClient setup under `src/lib/query/` plus a provider component.

## Phase 0: Research Outcomes

1. Use an app-wide `QueryClientProvider` with a stable browser QueryClient and per-server-request QueryClient creation for hydration-compatible App Router behavior.
2. Use `HydrationBoundary` and `dehydrate()` for the first-screen applications list so the client table can consume prefetched data without an immediate duplicate request.
3. Use domain-scoped query key factories and `queryOptions()` for reusable list/detail query configuration.
4. Default CRUD list data to backend-shaped pagination, filtering, sorting, and debounced text search represented in URL search params.
5. Use targeted invalidation for affected detail data and relevant list families after mutations; use broad domain invalidation only when affected surfaces cannot be known.
6. Implement one low-risk reversible optimistic mutation with `onMutate` snapshot, rollback on error, and revalidation on settle.
7. Add development-only React Query Devtools and keep them out of production behavior.
8. Use local or mock endpoints only if real backend endpoints are not available, and only behind the same browser-safe API contract.

See [research.md](./research.md) for rationale and alternatives.

## Phase 1: Design Artifacts

- [data-model.md](./data-model.md) defines Application Record, list params/result, query keys, mutations, optimistic snapshot, and provider settings.
- [contracts/applications-browser-api.openapi.yaml](./contracts/applications-browser-api.openapi.yaml) defines the browser-safe applications CRUD contract, including list query params, create/update/delete/status actions, and error envelopes.
- [contracts/applications-query-contract.md](./contracts/applications-query-contract.md) defines frontend query keys, URL state, invalidation rules, background refresh, retry policy, and optimistic update behavior.
- [quickstart.md](./quickstart.md) captures setup, dependency install, manual verification, and lint/build commands.

## Implementation Strategy

### Slice 1 - Provider and Documentation Foundation

- Add TanStack Query v5 and development-only Devtools dependencies.
- Add `src/lib/query/client.ts` to create default query clients with balanced freshness, transient read retries, reconnect refetch, and mutation retry disabled by default.
- Add an app-wide `QueryProvider` under `src/components/providers/` and wrap it inside `src/app/layout.tsx` without changing static page data behavior.
- Update README and `context/coding-standards.md` with the server-first/client server-state split.

### Slice 2 - Applications Domain Contract

- Extend `src/lib/api/domains/applications/contract.ts` with minimal pilot record, list params/result, create/update inputs, and browser-safe error/result shapes.
- Add browser-safe `client.ts` functions for list, create, update, delete, and low-risk reversible status action.
- Add `query-keys.ts` and `query-options.ts` for stable domain keys and list/detail options.
- Preserve server-only `queries.ts` and `commands.ts` boundaries; browser code must not import `src/lib/api/core/http.ts`.

### Slice 3 - Protected Applications Surface

- Add protected `/applications` route entry using existing auth/session guard and internal app shell/sidebar patterns.
- Prefetch the first-screen applications list and hydrate the client table.
- Build table-first UI with server-shaped page/search/filter/sort URL state, debounced text search, inline row actions, no bulk actions, and responsive light/dark UI.
- Add create/edit dialogs using the project form pattern and domain-owned validation.

### Slice 4 - Mutations, Sync, and Verification Behavior

- Implement create/update/delete mutation flows with action-local feedback and targeted invalidation.
- Implement one reversible optimistic mutation with rollback or revalidation on failure.
- Recover from delete-empty-page by moving to the nearest previous valid page.
- Add conservative active-list background refresh and reconnect refetch; do not queue offline mutations.
- Verify manually with local/mock endpoints if real backend endpoints are unavailable.

## Post-Design Constitution Check

- The plan remains focused on one pilot domain and one route while establishing a reusable pattern for future domains.
- The provider is global because the spec requires it, but usage is policy-limited to dynamic server-state surfaces.
- The plan keeps Laravel/Keycloak details behind browser-safe contracts and explicitly defers exact Keycloak trust mechanics to backend integration planning.
- No automated tests are introduced; verification uses lint/build plus manual flows.
- UI remains Polish, responsive, theme-aware, and based on existing shell/form/component patterns.

**Post-Design Gate Status**: PASS

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| App-wide client server-state provider | The spec requires app-wide provider setup for the pilot and future dynamic CRUD domains | Per-route provider setup would reduce global scope, but the accepted spec decision was global provider with usage discipline |
| Local/mock endpoint allowance | Real backend endpoints may not be available during frontend integration | Static JSON would not prove create/update/delete, pagination, mutation errors, or background refresh behavior |
