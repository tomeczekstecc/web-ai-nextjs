# Tasks: Client Server-State Integration

**Input**: Design documents from `/specs/002-integrate-tanstack-query/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Do not add automated tests. Constitution forbids test tasks unless the constitution changes.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and prepare TanStack Query provider infrastructure

- [X] T001 Install TanStack Query v5 and dev-only Devtools dependencies via `pnpm add @tanstack/react-query` and `pnpm add -D @tanstack/react-query-devtools`
- [X] T002 [P] Create shared QueryClient factory with balanced freshness, transient read retries, reconnect refetch, and mutation retry disabled in src/lib/query/client.ts
- [X] T003 [P] Create app-wide QueryProvider component with development-only Devtools in src/components/providers/query-provider.tsx
- [X] T004 Wrap app layout with QueryProvider in src/app/layout.tsx without changing static page behavior

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish applications domain contract and browser-safe fetchers required for all user stories

- [X] T005 Extend applications contract types with Application, ApplicationListParams, ApplicationListResult, CreateApplicationInput, UpdateApplicationInput, UpdateApplicationStatusInput, and browser-safe error shapes in src/lib/api/domains/applications/contract.ts
- [X] T006 [P] Add or update applications mapper functions for backend-to-frontend and frontend-to-backend transformations in src/lib/api/domains/applications/mapper.ts
- [X] T007 [P] Create applications query key factory with all, lists, list(params), details, detail(id) shapes in src/lib/api/domains/applications/query-keys.ts
- [X] T008 Create browser-safe applications client with list, detail, create, update, delete, and status fetchers in src/lib/api/domains/applications/client.ts
- [X] T009 Create applications query options with list and detail options, balanced freshness, background refresh, and retry policy in src/lib/api/domains/applications/query-options.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Dynamic CRUD Data Stays Current (Priority: P1)

**Goal**: Applications records refresh predictably after creates, edits, deletes, and status changes without manual page reload.

**Independent Validation**: Navigate to /applications, create a record, edit it, delete it, change status, and verify table shows server-confirmed data after each operation. Verify optimistic status change rolls back or revalidates on simulated failure.

### Implementation for User Story 1

- [X] T010 [P] [US1] Create protected /applications route page with auth guard and internal app shell in src/app/applications/page.tsx
- [X] T011 [P] [US1] Create applications loading skeleton matching table layout in src/app/applications/loading.tsx
- [X] T012 [P] [US1] Create applications route error boundary with recoverable state in src/app/applications/error.tsx
- [X] T013 [US1] Add first-screen applications list prefetch with dehydrate and HydrationBoundary in src/app/applications/page.tsx
- [X] T014 [P] [US1] Create applications table component with TanStack Table, URL-owned page/search/filter/sort state, debounced text search, and row actions in src/components/applications/applications-table.tsx
- [X] T015 [P] [US1] Create application row actions component with edit, delete, and status change actions in src/components/applications/application-row-actions.tsx
- [X] T016 [P] [US1] Create application create dialog component using project form pattern and domain validation in src/components/applications/application-create-dialog.tsx
- [X] T017 [P] [US1] Create application edit dialog component using project form pattern and domain validation in src/components/applications/application-edit-dialog.tsx
- [X] T018 [US1] Implement create mutation with success feedback and list invalidation in src/components/applications/application-create-dialog.tsx
- [X] T019 [US1] Implement update mutation with detail and list invalidation in src/components/applications/application-edit-dialog.tsx
- [X] T020 [US1] Implement delete mutation with list invalidation and empty-page recovery in src/components/applications/application-row-actions.tsx
- [X] T021 [US1] Implement optimistic status mutation with snapshot, rollback/revalidation, and settle invalidation in src/components/applications/application-row-actions.tsx
- [X] T022 [US1] Add conservative active-list background refresh via refetchInterval when table is visible in src/components/applications/applications-table.tsx
- [X] T023 [US1] Verify light mode, dark mode, mobile, and desktop behavior for all applications components

**Checkpoint**: User Story 1 should be fully functional and independently verifiable

---

## Phase 4: User Story 2 - Domain Integrations Stay Consistent (Priority: P2)

**Goal**: Developers can add CRUD domains using a repeatable pattern with clear separation between server-only and browser-safe operations.

**Independent Validation**: Inspect the applications domain folder structure and verify: contract.ts has types, mapper.ts has transformations, client.ts has browser-safe fetchers, query-keys.ts has stable keys, query-options.ts has reusable config, and no browser code imports server-only modules.

### Implementation for User Story 2

- [X] T024 [P] [US2] Verify applications domain file structure follows progressive model in src/lib/api/domains/applications/
- [X] T025 [P] [US2] Verify browser-safe client.ts does not import server-only modules or src/lib/api/core/http.ts in src/lib/api/domains/applications/client.ts
- [X] T026 [US2] Update README.md with server-first vs client server-state responsibilities, domain file pattern, and when to use each approach in README.md
- [X] T027 [US2] Update coding-standards.md with TanStack Query domain pattern, query key conventions, and browser-safe contract rules in context/coding-standards.md

**Checkpoint**: User Story 2 documentation is complete and developer pattern is auditable

---

## Phase 5: User Story 3 - First-Screen Data Can Be Fast Without Breaking Server Boundaries (Priority: P3)

**Goal**: Protected CRUD routes load fast first-screen data while keeping auth, redirects, and secure calls server-owned.

**Independent Validation**: Open /applications in browser dev tools Network tab and verify hydrated list appears without duplicate immediate client request. Verify unauthenticated access redirects before protected content shows.

### Implementation for User Story 3

- [X] T028 [P] [US3] Verify /applications route evaluates auth and redirects before rendering protected content in src/app/applications/page.tsx
- [X] T029 [US3] Verify hydrated applications list renders without duplicate immediate browser request using React Query Devtools inspection
- [X] T030 [US3] Verify static public pages and auth screens do not use TanStack Query by default

**Checkpoint**: User Story 3 confirms server-first boundaries and hydration correctness

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements affecting multiple user stories

- [X] T031 [P] Refine Polish copy and user feedback messages across applications dialogs and table
- [X] T032 [P] Review inline recoverable error states for list failures and mutation failures
- [X] T033 [P] Review action-local mutation feedback and transient notifications
- [X] T034 Validate quickstart manual verification flow from quickstart.md
- [X] T035 Run pnpm lint and fix any linting errors
- [X] T036 Run pnpm build and fix any build errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T004) - blocks all user stories
- **User Stories (Phase 3-5)**: Depend on Foundational phase completion (T005-T009)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Dynamic CRUD)**: Independent after foundational - core CRUD functionality
- **US2 (Domain Pattern)**: Independent after foundational - documentation and audit
- **US3 (Fast First-Screen)**: Independent after foundational - hydration verification

All three user stories can proceed in parallel after Phase 2 completes.

### Within Each User Story

- Prefer the simplest viable implementation
- Keep edits surgical and scoped to the story goal
- Finish the story's core path before optional refinements
- Validate the story manually against acceptance scenarios and success criteria

### Parallel Opportunities

**Phase 1**:
- T002 and T003 can run in parallel (different files)

**Phase 2**:
- T006 and T007 can run in parallel (different files)

**Phase 3 (US1)**:
- T010, T011, T012 can run in parallel (different route files)
- T014, T015, T016, T017 can run in parallel (different component files)

**Phase 4 (US2)**:
- T024 and T025 can run in parallel (audit tasks)
- T026 and T027 can run in parallel (different documentation files)

**Phase 5 (US3)**:
- T028 can run in parallel with US1/US2 tasks

**Phase 6**:
- T031, T032, T033 can run in parallel (different concerns)

---

## Implementation Strategy

### MVP Scope (Recommended)

**Minimum Viable Product**: Complete Phase 1, Phase 2, and User Story 1 (Phase 3).

This delivers:
- App-wide TanStack Query provider
- Applications domain with browser-safe fetchers and query options
- Protected /applications CRUD table with create, edit, delete, status change
- Optimistic UI with rollback for status mutation
- First-screen hydration
- Background refresh and reconnect refetch

### Incremental Delivery

1. **Increment 1**: Setup + Foundational + US1 core table (T001-T015)
2. **Increment 2**: US1 mutations and optimistic behavior (T016-T023)
3. **Increment 3**: US2 documentation (T024-T027)
4. **Increment 4**: US3 verification (T028-T030)
5. **Increment 5**: Polish (T031-T036)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and verifiable
- Browser-safe client.ts must not import `server-only` modules or `src/lib/api/core/http.ts`
- Mock endpoints must preserve the same contract as real backend endpoints per contracts/applications-browser-api.openapi.yaml
- Query keys follow the factory pattern defined in contracts/applications-query-contract.md
- Development-only Devtools must not appear in production builds
