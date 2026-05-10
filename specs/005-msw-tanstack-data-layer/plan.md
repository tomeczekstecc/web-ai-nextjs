# Implementation Plan: MSW-Backed Data Layer

**Branch**: `005-msw-tanstack-data-layer` | **Date**: 2026-05-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-msw-tanstack-data-layer/spec.md`

## Summary

Replace all scattered mock data (a static JSON file, inline component arrays, and a server-side fallback payload) with a centralised MSW browser worker and a dedicated dashboard API domain backed by TanStack Query. The applications domain already follows the correct pattern and needs only a matching MSW handler. The landing-page server-only fallback payload is extracted to a shared mock data file without MSW involvement.

## Technical Context

**Language/Version**: TypeScript 5.8.x, React 19, Next.js 16 App Router
**Primary Dependencies**: `msw` v2 (new dev dependency), TanStack Query (existing), `next-themes`, shadcn/ui, lucide-react, existing domain client pattern
**Storage**: Browser-intercepted requests in development via MSW Service Worker; `NEXT_PUBLIC_API_URL` for production; `src/mocks/data/` for centralized mock payloads
**Testing**: N/A — constitution forbids automated tests
**Target Platform**: Modern desktop and mobile browsers
**Project Type**: web frontend
**Performance Goals**: No visible loading regression; chart and table data should appear as quickly as before; MSW worker startup must not delay the initial authenticated page render perceptibly
**Constraints**: Development-only worker activation; no server bundle contamination; Polish UI copy preserved; no automated tests; no backend/Laravel coupling introduced; `msw/node` and server-side interception are out of scope
**Scale/Scope**: Four mock handler files, one new API domain (dashboard), edits to three existing components, one server-side mock extraction

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Problem understood before coding begins?** Yes. All scattered data sources identified; replacement pattern defined using the existing applications domain as reference.
- **Simplest viable solution?** Yes. MSW browser worker + domain pattern reuse + one fallback extraction. No new abstraction layers, no instrumentation changes, no test infrastructure.
- **Planned edits surgical and limited in scope?** Yes. Only `layout.tsx`, `dashboard/page.tsx`, `DashboardDataTable`, `ChartAreaInteractive`, and `landing-page/queries.ts` change in the existing source tree. New files are additive.
- **Success criteria explicit and verifiable?** Yes. SC-001 through SC-006 in the spec are manually verifiable without tooling.
- **Preserves TypeScript, App Router, shadcn/ui, Polish UI, responsiveness, and theme parity?** Yes. No UI structure changes; only data sourcing changes.
- **Avoids automated tests and unnecessary comments?** Yes. Verification is manual plus `pnpm lint` / `pnpm build`.
- **Preserves decoupling from Laravel implementation details?** Yes. MSW handlers define the integration contracts without coupling to any Laravel-specific implementation.

**Gate Status**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/005-msw-tanstack-data-layer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── dashboard-api-contract.md
│   └── msw-worker-contract.md
└── tasks.md
```

### Source Code (`src/`)

```text
src/
├── mocks/                              ← new directory
│   ├── browser.ts                      ← new: setupWorker
│   ├── handlers/
│   │   ├── index.ts                    ← new: combined handler export
│   │   ├── dashboard.ts                ← new: /api/dashboard/* handlers
│   │   └── applications.ts             ← new: /api/applications handler
│   └── data/
│       ├── dashboard-review-items.ts   ← new: extracted from data.json
│       ├── dashboard-chart.ts          ← new: extracted from chart-area-interactive.tsx
│       ├── dashboard-queue.ts          ← new: extracted from dashboard-data-table.tsx
│       ├── applications.ts             ← new: mock applications data
│       └── landing-page.ts             ← new: extracted from landing-page/queries.ts
├── components/providers/
│   └── msw-provider.tsx                ← new: 'use client', starts worker in dev
├── lib/api/domains/dashboard/          ← new domain
│   ├── contract.ts
│   ├── client.ts
│   ├── query-keys.ts
│   └── query-options.ts
├── components/
│   ├── chart-area-interactive.tsx      ← modified: remove inline chartData, use useQuery
│   └── dashboard/
│       └── dashboard-data-table.tsx    ← modified: remove data prop, use useQuery
├── app/
│   ├── layout.tsx                      ← modified: add MSWProvider wrapper
│   └── dashboard/
│       ├── page.tsx                    ← modified: remove data.json import and prop
│       └── data.json                   ← deleted
└── lib/api/domains/landing-page/
    └── queries.ts                      ← modified: import fallback from mocks/data/
```

```text
public/
└── mockServiceWorker.js                ← new: generated by `npx msw init ./public`
```

**Structure Decision**: Mirror the `applications` domain pattern exactly for `dashboard`. Keep MSW files in `src/mocks/` to separate mock infrastructure from production API code. Do not create a new settings route, shared settings context, or new test infrastructure.

## Phase 0: Research Outcomes

1. Use `msw/browser` + `setupWorker` only (no `msw/node`); landing-page server fallback handled by mock data extraction, not MSW.
2. Register the worker in a dedicated `MSWProvider` client component wrapping `QueryProvider` in `layout.tsx`.
3. Dynamic import of `@/mocks/browser` inside `useEffect` ensures zero server bundle impact.
4. `onUnhandledRequest: "warn"` prevents broken dev experience while surfacing uncovered routes.
5. Applications domain needs only a new MSW handler file; its client and query code are unchanged.

See [research.md](./research.md) for full rationale.

## Phase 1: Design Artifacts

- [data-model.md](./data-model.md): entity shapes for all mock data payloads.
- [contracts/dashboard-api-contract.md](./contracts/dashboard-api-contract.md): response shapes for the three dashboard endpoints.
- [contracts/msw-worker-contract.md](./contracts/msw-worker-contract.md): worker activation, handler coverage, and production guard contract.
- [quickstart.md](./quickstart.md): implementation order and manual verification flow.

## Implementation Strategy

### Slice 1 — MSW Infrastructure

- Install `msw` as a dev dependency.
- Run `npx msw init ./public`.
- Create `src/mocks/data/` files with extracted payloads.
- Create `src/mocks/handlers/` files with HTTP handlers.
- Create `src/mocks/browser.ts`.
- Create `src/components/providers/msw-provider.tsx`.
- Add `MSWProvider` to `layout.tsx`.

### Slice 2 — Dashboard Domain

- Create `src/lib/api/domains/dashboard/` (contract, client, query-keys, query-options).
- Update `DashboardDataTable` to use `useQuery` (remove `data` prop, add loading state).
- Update `ChartAreaInteractive` to use `useQuery` (remove inline array, add loading state).
- Remove `data.json` import from `dashboard/page.tsx`.
- Delete `src/app/dashboard/data.json`.

### Slice 3 — Remaining Domains and Verification

- Extract landing-page fallback payload to `src/mocks/data/landing-page.ts`.
- Update `landing-page/queries.ts` to import from the extracted file.
- Verify all three user story acceptance criteria manually.
- Run `pnpm lint` and `pnpm build`.

## Post-Design Constitution Check

- Simplest solution: yes — reuses existing patterns, no new abstractions.
- No backend coupling: yes — MSW handlers define contracts without Laravel specifics.
- Polish UI preserved: yes — no visible UI changes, only data sourcing.
- No automated tests: yes.
- Surgical: yes — edits to 5 existing files, 14 new files added.

**Post-Design Gate Status**: PASS

## Complexity Tracking

No constitution violations require justification.
