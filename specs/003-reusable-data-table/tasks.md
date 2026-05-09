# Tasks: Reusable Data Table

**Input**: Design documents from `/specs/003-reusable-data-table/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/data-table-ui-contract.md, quickstart.md

**Tests**: Do not add automated tests. Constitution forbids test tasks unless the constitution changes.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- App routes: `src/app/`
- Shared components: `src/components/`
- Dashboard-specific components: `src/components/dashboard/`
- Shared hooks: `src/hooks/`
- Feature artifacts: `specs/003-reusable-data-table/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Minimal project preparation required for the feature

- [X] T001 Review current dashboard table usage in `src/components/data-table.tsx` and `src/app/dashboard/page.tsx` against `specs/003-reusable-data-table/contracts/data-table-ui-contract.md`
- [X] T002 [P] Create dashboard component folder for migrated usage code at `src/components/dashboard/`
- [X] T003 [P] Confirm existing dependencies in `package.json` cover TanStack Table, dnd-kit, shadcn/ui primitives, lucide-react, and browser-only client behavior without adding packages

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core groundwork that MUST be complete before user stories

- [X] T004 Define generic `DataTableProps<TData>`, table feature option types, persistence option types, reorder result types, and column metadata types in `src/components/data-table.tsx`
- [X] T005 Implement a column metadata reader for labels, required visibility, searchable values, and visibility-menu exclusion in `src/components/data-table.tsx`
- [X] T006 Implement controlled-or-local state helpers for global search, sorting, pagination, column visibility, and row selection in `src/components/data-table.tsx`
- [X] T007 Implement safe row identity validation and row ID mapping from caller-provided `getRowId` in `src/components/data-table.tsx`
- [X] T008 [P] Create dashboard table row type definitions and current dashboard data typing in `src/components/dashboard/dashboard-data-table.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Configure Any Domain Table (Priority: P1)

**Goal**: A developer can configure the shared table per usage with rows, columns, labels, row identity, empty/no-results content, optional custom cells, and no hard-coded sample model.

**Independent Validation**: Use the shared table for the current dashboard row shape and one second row shape with different columns/search metadata without editing the shared table source.

### Implementation for User Story 1

- [X] T009 [US1] Refactor `DataTable` in `src/components/data-table.tsx` to accept generic `data`, `columns`, and `getRowId` props instead of the hard-coded dashboard schema and columns
- [X] T010 [US1] Implement generic table rendering, header rendering, cell rendering, and fallback empty/no-results rows in `src/components/data-table.tsx`
- [X] T011 [US1] Add default toolbar layout with left and right extension slots in `src/components/data-table.tsx`
- [X] T012 [US1] Add display-only loading and error state rendering in `src/components/data-table.tsx`
- [X] T013 [US1] Move current dashboard columns, badges, inline fields, row action menu, drawer content, and chart preview into `src/components/dashboard/dashboard-data-table.tsx`
- [X] T014 [US1] Move current dashboard tabs and add-section command into `src/components/dashboard/dashboard-data-table.tsx`
- [X] T015 [US1] Update `src/app/dashboard/page.tsx` to render `DashboardDataTable` from `src/components/dashboard/dashboard-data-table.tsx`
- [X] T016 [US1] Add a second lightweight row-shape configuration in `src/components/dashboard/dashboard-data-table.tsx` to prove the shared table renders different headers and rows without shared table changes
- [ ] T017 [US1] Manually verify dashboard rows, headers, row actions, drawer content, tabs, empty state, light mode, dark mode, mobile width, and desktop width after the migration

**Checkpoint**: User Story 1 should be fully functional and independently verifiable

---

## Phase 4: User Story 2 - Search Across Configured Data (Priority: P2)

**Goal**: Users can use one global search input that filters by each table usage's configured searchable values and comparison behavior.

**Independent Validation**: Configure one dashboard table search to match section header/status/type and the second row shape to match different fields; confirm each table searches only its configured values.

### Implementation for User Story 2

- [X] T018 [US2] Implement configurable global search props, placeholder copy, controlled value support, and local value support in `src/components/data-table.tsx`
- [X] T019 [US2] Implement default text normalization and partial-match comparison in `src/components/data-table.tsx`
- [X] T020 [US2] Implement custom `getSearchValues` and custom comparator support in `src/components/data-table.tsx`
- [X] T021 [US2] Wire global filtering into the TanStack Table setup without enabling fetch ownership in `src/components/data-table.tsx`
- [X] T022 [US2] Configure dashboard search fields and Polish search labels in `src/components/dashboard/dashboard-data-table.tsx`
- [X] T023 [US2] Configure the second row-shape search fields in `src/components/dashboard/dashboard-data-table.tsx`
- [ ] T024 [US2] Manually verify enabled search, disabled search, custom field matching, case-insensitive matching, partial matching, no-results state, light mode, dark mode, mobile width, and desktop width

**Checkpoint**: User Story 2 should be fully functional and independently verifiable

---

## Phase 5: User Story 3 - Personalize Table View (Priority: P3)

**Goal**: Users can hide/reveal optional columns and restore explicitly enabled search, column visibility, and page-size preferences for the same table on the same browser device.

**Independent Validation**: Hide a configurable column, change search text and page size, reload, and confirm only explicitly enabled preferences restore for that table while required columns stay visible.

### Implementation for User Story 3

- [X] T025 [US3] Implement column visibility menu rendering with configured labels and required-column enforcement in `src/components/data-table.tsx`
- [X] T026 [US3] Implement safe preference read/write helpers for search text, column visibility, and page size in `src/components/data-table.tsx`
- [X] T027 [US3] Validate persisted preferences against current column IDs and required columns in `src/components/data-table.tsx`
- [X] T028 [US3] Ensure page index, row selection, row order, and table data are not persisted by default in `src/components/data-table.tsx`
- [X] T029 [US3] Configure dashboard persistence key and explicit search, column visibility, and page-size persistence flags in `src/components/dashboard/dashboard-data-table.tsx`
- [X] T030 [US3] Configure a distinct persistence key or disabled persistence for the second table in `src/components/dashboard/dashboard-data-table.tsx`
- [ ] T031 [US3] Manually verify hide/reveal, required columns, malformed storage fallback, stale column preference fallback, scoped preferences, reload restore behavior, light mode, dark mode, mobile width, and desktop width

**Checkpoint**: User Story 3 should be fully functional and independently verifiable

---

## Phase 6: User Story 4 - Reorder Rows When Allowed (Priority: P4)

**Goal**: A usage can opt into row drag reordering and receive ordered row IDs and rows, while ambiguous reorder states are disabled.

**Independent Validation**: Enable reorder for the dashboard outline table, confirm reordered IDs/rows are reported, and confirm handles disappear or disable when search, sorting, filtering, or ambiguous pagination is active.

### Implementation for User Story 4

- [X] T032 [US4] Implement optional drag-handle utility column and sortable row wrapper in `src/components/data-table.tsx`
- [X] T033 [US4] Implement reorder eligibility logic for search, filtering, sorting, pagination, and page-only opt-in in `src/components/data-table.tsx`
- [X] T034 [US4] Implement reorder callback payload with `orderedIds` and ordered `rows` in `src/components/data-table.tsx`
- [X] T035 [US4] Implement explicit local display-order behavior for enabled local reorder and caller-owned update behavior when `onReorder` is provided in `src/components/data-table.tsx`
- [X] T036 [US4] Configure dashboard row reorder behavior and observable reorder callback handling in `src/components/dashboard/dashboard-data-table.tsx`
- [ ] T037 [US4] Manually verify enabled reorder, disabled reorder, active-search disablement, sorting disablement, ambiguous-pagination disablement, ordered ID payload, light mode, dark mode, mobile width, and desktop width

**Checkpoint**: User Story 4 should be fully functional and independently verifiable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T038 [P] Review all user-facing table labels and messages for Polish copy consistency in `src/components/data-table.tsx` and `src/components/dashboard/dashboard-data-table.tsx`
- [X] T039 [P] Review responsive toolbar wrapping, wide-table overflow, and button text fit in `src/components/data-table.tsx`
- [X] T040 Review accessibility labels, checkbox labels, search input label, column menu trigger label, pagination labels, and drag handle labels in `src/components/data-table.tsx`
- [X] T041 Remove dead dashboard-specific imports and sample-only schema leftovers from `src/components/data-table.tsx`
- [ ] T042 Run manual verification checklist from `specs/003-reusable-data-table/quickstart.md`
- [X] T043 Run `pnpm lint` from repository root
- [X] T044 Run `pnpm build` from repository root

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion and is the MVP
- **User Story 2 (Phase 4)**: Depends on User Story 1 because search needs the generic table contract and dashboard configurations
- **User Story 3 (Phase 5)**: Depends on User Story 2 for persisted search and on User Story 1 for column metadata
- **User Story 4 (Phase 6)**: Depends on User Story 1 and should account for search/sort/pagination behavior from User Stories 2 and 3
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1**: MVP and required before other stories
- **US2**: Builds on generic table configuration and can be validated independently after US1
- **US3**: Builds on search and column visibility state; can be validated independently after US1 and US2
- **US4**: Builds on table state and dashboard configuration; can be validated independently after US1 and with final ambiguity checks after US2/US3

### Within Each User Story

- Finish type/API changes before usage migration.
- Keep dashboard-specific UI outside `src/components/data-table.tsx`.
- Prefer local state by default and add controlled behavior only through focused props.
- Validate each story manually before moving to the next story.

### Parallel Opportunities

- T002 and T003 can run in parallel during setup.
- T008 can run in parallel with T004-T007 if the dashboard component file is isolated.
- After T009-T012 define the reusable contract, T013-T016 can be split between dashboard migration and second row-shape configuration.
- T018-T021 touch shared search behavior while T022-T023 configure usage-specific search after the shared API shape is clear.
- T025-T028 touch shared persistence/visibility behavior while T029-T030 configure usage-specific persistence after the shared API shape is clear.
- T032-T035 touch shared reorder behavior while T036 configures dashboard usage after the callback contract is clear.
- T038 and T039 can run in parallel during polish.

---

## Implementation Strategy

### MVP First

Complete Phase 1, Phase 2, and User Story 1. This delivers a reusable table contract, removes hard-coded dashboard data from `DataTable`, preserves dashboard behavior, and proves a second row shape can render.

### Incremental Delivery

1. Add configurable global search in User Story 2.
2. Add column visibility and explicit browser preference persistence in User Story 3.
3. Add opt-in reorder behavior and ambiguity guards in User Story 4.
4. Finish with manual verification, lint, and build.

### Validation Focus

- Do not add automated tests.
- Use the manual verification criteria in each story and in `specs/003-reusable-data-table/quickstart.md`.
- Run `pnpm lint` and `pnpm build` after code changes are complete.

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to a specific user story for traceability
- Each user story is independently completable and manually verifiable
- Avoid adding fetch ownership, URL mutation, user-resizable columns, account-level preference sync, or automated tests
