---
description: "Task list for MSW-Backed Data Layer implementation"
---

# Tasks: MSW-Backed Data Layer

**Input**: Design documents from `/specs/005-msw-tanstack-data-layer/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: No automated tests (constitution forbids them for this project).

**Organization**: Tasks grouped by user story to enable independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup

**Purpose**: Install MSW and generate the browser service worker file.

- [x] T001 Run `pnpm add msw --save-dev` in the project root to install MSW v2
- [x] T002 Run `npx msw init ./public --save` to generate `public/mockServiceWorker.js` and commit it

**Checkpoint**: `public/mockServiceWorker.js` exists and `msw` appears in `package.json` devDependencies

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the entire MSW infrastructure and wire the worker into the app before any user story work touches components or domain code.

- [x] T003 [P] Create `src/mocks/data/dashboard-review-items.ts` — export a typed `dashboardReviewItems` array by copying all 68 objects from `src/app/dashboard/data.json` with type `DashboardTableRow` imported from `src/components/dashboard/dashboard-data-table.tsx`
- [x] T004 [P] Create `src/mocks/data/dashboard-chart.ts` — export a typed `dashboardChartData` array by copying the `chartData` constant from `src/components/chart-area-interactive.tsx` (15 date/desktop/mobile points) as `{ date: string; desktop: number; mobile: number }[]`
- [x] T005 [P] Create `src/mocks/data/dashboard-queue.ts` — export a typed `dashboardQueueItems` array by copying the `reviewRows` constant from `src/components/dashboard/dashboard-data-table.tsx` (3 items) as `{ id: string; name: string; owner: string; priority: string }[]`
- [x] T006 [P] Create `src/mocks/data/applications.ts` — export a typed `mockApplicationsResponse` object matching the `ApplicationListResult` shape from `src/lib/api/domains/applications/contract.ts`; include at least 5 realistic draft/submitted/archived items with `id`, `label`, `status`, `createdAt`, `updatedAt` plus `page: 1`, `pageSize: 10`, `totalItems: 5`, `totalPages: 1`
- [x] T007 [P] Create `src/mocks/data/landing-page.ts` — export a typed `landingPageFallback` constant by copying the entire `fallbackPayload` object (hero, features, benefits, stats) from `src/lib/api/domains/landing-page/queries.ts`; type it as `LandingPagePayload` imported from the landing-page contract
- [x] T008 Create `src/mocks/handlers/dashboard.ts` — define `dashboardHandlers` array with three `http.get` handlers: `/api/dashboard/review-items` returning `HttpResponse.json({ items: dashboardReviewItems })`, `/api/dashboard/chart` returning `{ points: dashboardChartData }`, `/api/dashboard/queue` returning `{ items: dashboardQueueItems }`
- [x] T009 Create `src/mocks/handlers/applications.ts` — define `applicationsHandlers` array with one `http.get` handler for `/api/applications` returning `HttpResponse.json(mockApplicationsResponse)`; read `NEXT_PUBLIC_API_URL` env var prefix if present to match the base URL used by `src/lib/api/domains/applications/client.ts`
- [x] T010 Create `src/mocks/handlers/index.ts` — export `const handlers = [...dashboardHandlers, ...applicationsHandlers]` combining all handler arrays
- [x] T011 Create `src/mocks/browser.ts` — export `const worker = setupWorker(...handlers)` using `msw/browser`
- [x] T012 Create `src/components/providers/msw-provider.tsx` — `'use client'` component that accepts `children: React.ReactNode`; in `useEffect`, if `process.env.NODE_ENV === "development"`, dynamically imports `@/mocks/browser` and calls `await worker.start({ onUnhandledRequest: "warn" })`; renders children unconditionally without suspense
- [x] T013 Update `src/app/layout.tsx` — wrap the existing `<QueryProvider>` with the new `<MSWProvider>` so the tree is `ThemeProvider > MSWProvider > QueryProvider > children`

**Checkpoint**: Start `pnpm dev`, open DevTools → Application → Service Workers — `mockServiceWorker.js` should be registered

---

## Phase 3: User Story 1 — Dashboard Data Loaded Through Shared Data Layer (Priority: P1)

**Goal**: Remove the `data.json` import from the dashboard page and all inline data arrays from dashboard components; have both `DashboardDataTable` and `ChartAreaInteractive` fetch their data through TanStack Query hitting MSW-intercepted endpoints.

**Independent Validation**: Open the authenticated dashboard page. Check the Network tab for intercepted requests to `/api/dashboard/review-items`, `/api/dashboard/chart`, and `/api/dashboard/queue`. Confirm the review table and chart render with data. Confirm no `data.json` request appears.

### Implementation for User Story 1

- [x] T014 [P] [US1] Create `src/lib/api/domains/dashboard/contract.ts` — define and export `DashboardReviewItem` (id, header, type, status, target, limit, reviewer), `DashboardChartPoint` (date, desktop, mobile), `DashboardQueueItem` (id, name, owner, priority), and their list response shapes `{ items: DashboardReviewItem[] }`, `{ points: DashboardChartPoint[] }`, `{ items: DashboardQueueItem[] }`
- [x] T015 [US1] Create `src/lib/api/domains/dashboard/client.ts` — implement `fetchDashboardReviewItems()`, `fetchDashboardChart()`, and `fetchDashboardQueue()` using the same `browserFetch` pattern as `src/lib/api/domains/applications/client.ts`; use `NEXT_PUBLIC_API_URL ?? "/api"` as the base
- [x] T016 [P] [US1] Create `src/lib/api/domains/dashboard/query-keys.ts` — export `dashboardKeys` with `reviewItems()`, `chart()`, and `queue()` key factories following the pattern in `src/lib/api/domains/applications/query-keys.ts`
- [x] T017 [US1] Create `src/lib/api/domains/dashboard/query-options.ts` — export `dashboardReviewItemsOptions()`, `dashboardChartOptions()`, and `dashboardQueueOptions()` using `queryOptions()` from TanStack Query following the pattern in `src/lib/api/domains/applications/query-options.ts`
- [x] T018 [US1] Update `src/components/dashboard/dashboard-data-table.tsx` — remove the `data: DashboardTableRow[]` prop and `DashboardDataTableProps` type; remove the inline `reviewRows` constant; add `useQuery(dashboardReviewItemsOptions())` for the main table data and `useQuery(dashboardQueueOptions())` for the queue panel; add minimal loading/empty states consistent with the applications table pattern
- [x] T019 [US1] Update `src/components/chart-area-interactive.tsx` — remove the inline `chartData` constant; add `useQuery(dashboardChartOptions())`; use `data?.points ?? []` where `chartData` was used; add a minimal loading guard
- [x] T020 [US1] Update `src/app/dashboard/page.tsx` — remove `import data from "./data.json"` and remove the `data={data}` prop from `<DashboardDataTable />`; the component now fetches its own data
- [x] T021 [US1] Delete `src/app/dashboard/data.json`

**Checkpoint**: User Story 1 independently verifiable — dashboard renders with MSW-intercepted data, no data.json import remains

---

## Phase 4: User Story 2 — All Mock Data Centralised in One Interception Layer (Priority: P2)

**Goal**: Confirm the applications domain is fully covered by the MSW layer so that all in-scope data domains (dashboard, applications) are served by handlers in `src/mocks/handlers/` and no inline arrays or file imports remain in component or page files.

**Independent Validation**: Open the applications page in dev. Check the Network tab for intercepted `GET /api/applications`. Confirm the applications table renders with mock data. Confirm `src/mocks/data/` is the only location where data payloads are defined.

### Implementation for User Story 2

- [x] T022 [US2] Verify `src/mocks/handlers/applications.ts` correctly handles the query parameters (`page`, `pageSize`, `search`, `status`, `sort`) that `src/lib/api/domains/applications/client.ts` appends to `/api/applications`; update the handler to accept any query string and return the full `mockApplicationsResponse` regardless of filter params (development approximation)

**Checkpoint**: User Story 2 independently verifiable — applications table loads data from MSW handler with no build errors

---

## Phase 5: User Story 3 — Landing Page Content Served From Data Layer (Priority: P3)

**Goal**: Extract the hardcoded landing-page fallback payload from the server-only query function into the centralised mock data file, so that the landing-page query function contains no inline Polish-language content.

**Independent Validation**: Open the public homepage and confirm it renders the same content as before. Open `src/lib/api/domains/landing-page/queries.ts` and confirm no inline content object remains.

### Implementation for User Story 3

- [x] T023 [US3] Update `src/lib/api/domains/landing-page/queries.ts` — replace the inline `fallbackPayload` constant and `fallbackContent` variable with an import of `landingPageFallback` from `@/mocks/data/landing-page`; compute `fallbackContent` from the imported constant using the existing `mapLandingPageContent` call

**Checkpoint**: User Story 3 independently verifiable — homepage renders correctly; queries.ts contains no inline content payload

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, lint, and build validation.

- [x] T024 Run `pnpm lint` and fix any TypeScript or ESLint errors introduced by the migration
- [x] T025 Run `pnpm build` and confirm a clean production build with no type errors; confirm the build output does not reference `mockServiceWorker.js` in any JS bundle (only in `public/`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (`msw` installed) — blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 (MSW wired, data files exist)
- **User Story 2 (Phase 4)**: Depends on Phase 2 (applications handler exists); can run after Phase 2 independently of Phase 3
- **User Story 3 (Phase 5)**: Depends on T007 (landing-page mock data file); can run after T007 independently
- **Polish (Phase 6)**: Depends on all user story phases complete

### User Story Dependencies

- US1 requires the foundational MSW infrastructure (Phase 2) to be complete
- US2 is independently verifiable once Phase 2 is complete (before US1)
- US3 is independently verifiable once T007 is complete (before US1)

### Parallel Opportunities

| Group | Tasks | Condition |
|---|---|---|
| Mock data files | T003, T004, T005, T006, T007 | All different files in `src/mocks/data/` |
| Dashboard domain setup | T014, T016 alongside T015 | contract.ts and query-keys.ts touch different files |
| Component updates | T018, T019 | Different component files |
| US2 and US3 start | T022, T023 | Independent of each other; US3 can start after T007 |

---

## Implementation Strategy

**MVP scope**: Phase 1 → Phase 2 → Phase 3. This delivers the dashboard fully migrated with MSW + TanStack Query and proves the architecture works end-to-end.

**Full delivery**: Add Phase 4 (US2) and Phase 5 (US3) before the final polish pass.

**Total tasks**: 25
- Phase 1 (Setup): 2
- Phase 2 (Foundational): 11
- Phase 3 (US1): 8
- Phase 4 (US2): 1
- Phase 5 (US3): 1
- Phase 6 (Polish): 2

**Parallel opportunities**: 4 groups identified (see table above)
