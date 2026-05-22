# Tasks: Reports Management Module

**Input**: Design documents from `/specs/020-reports-management/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/backend.md ✅, quickstart.md ✅

**Tests**: No automated tests per constitution.

**Organization**: Tasks grouped by user story. Each phase is independently verifiable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: New dependency, store slice, and surgical edits to existing files before any feature code.

- [x] T001 Install `@monaco-editor/react` and `monaco-editor` via `pnpm add @monaco-editor/react monaco-editor`
- [x] T002 Create Zustand reports slice in `src/lib/store/reports.slice.ts` — `GenerationState`, `ReportsSlice`, `createReportsSlice`
- [x] T003 Update `src/lib/store/types.ts` — add `GenerationState`, `ReportsSlice`; add `ReportsSlice` to `StoreState`
- [x] T004 Update `src/lib/store/index.ts` — compose `createReportsSlice` alongside `createWizardSlice`
- [x] T005 [P] Extend `src/components/wizard/inputs/TextareaWiz.tsx` — add optional `maxLength?: number` prop; render live remaining-character counter below field; pass `maxLength` to `<Textarea>`
- [x] T006 [P] Add four `/reports` breadcrumb entries to `src/lib/breadcrumbs/registry.ts` — `/reports`, `/reports/new`, `/reports/:id`, `/reports/:id/view` (mirror wizard-demo pattern)

**Checkpoint**: Store slice compiles; `TextareaWiz` renders counter when `maxLength` supplied; breadcrumbs resolve for `/reports*` paths.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain library, Next.js API route handlers, and the `DualListTransfer` UI primitive — all required by at least two user stories.

- [x] T007 Create `src/lib/api/domains/reports/contract.ts` — all TypeScript types: `ReportStatus`, `ParameterType`, `JobStatus`, `GenerationState`, `QueryParameterPayload`, `QueryParameter`, `ReportListItemPayload`, `ReportListItem`, `ReportListPayload`, `ReportListResult`, `Permission`, `GenerateReportInput`, `GenerateReportResponse`, `CheckStatusResponse`, `TestQueryInput`, `TestQueryResponse`
- [x] T008 [P] Create `src/lib/api/domains/reports/mapper.ts` — `mapQueryParameter`, `mapReportListItem`, `mapReportList` (snake_case payload → camelCase model)
- [x] T009 [P] Create `src/lib/api/domains/reports/query-keys.ts` — `reportsKeys` factory: `all`, `list(params)`, `permissions()`
- [x] T010 [P] Create `src/lib/api/domains/reports/polling.ts` — export `REPORT_POLL_INTERVAL_MS = 3_000` and `REPORT_POLL_MAX_ATTEMPTS = 20`
- [x] T011 Create `src/lib/api/domains/reports/client.ts` — `browserFetch` wrappers: `fetchReportList`, `fetchReportPermissions`, `generateReport`, `checkGenerationStatus`, `downloadReport`, `testQuery`
- [x] T012 [P] Create `src/lib/api/domains/reports/commands.ts` — pure write transport functions: `deleteReport(id)`, `generateReport(input)`, `testQuery(input)` (wraps client, throws on error)
- [x] T013 [P] Create `src/lib/api/domains/reports/query-options.ts` — `reportListOptions(params)` and `reportPermissionsOptions()` using TanStack `queryOptions`
- [x] T014 Create Next.js wizard API route handlers — `src/app/api/reports/wizard/mapping/route.ts` (GET), `src/app/api/reports/wizard/data/route.ts` (GET), `src/app/api/reports/wizard/data/[id]/route.ts` (GET), `src/app/api/reports/wizard/save/route.ts` (POST) — each proxies to backend via server-side `http` client
- [x] T015 [P] Create `src/app/api/reports/route.ts` — GET handler proxying report list to backend with pagination + search query params
- [x] T016 [P] Create `src/app/(app)/reports/layout.tsx` — metadata (`title: "Raporty"`) + passthrough layout
- [x] T017 [P] Create `src/components/ui/dual-list-transfer.tsx` — reusable `DualListTransfer` component: `available: DualListItem[]`, `selected: DualListItem[]`, `onChange`, `disabled?`; internal state: left/right selection sets + two search strings; four transfer buttons (`>>`, `>`, `<`, `<<`); stacks vertically on mobile, side-by-side on md+; respects `disabled` prop for all controls

**Checkpoint**: Domain types compile; `DualListTransfer` renders and transfers items in isolation; wizard API route handlers return expected shapes.

---

## Phase 3: User Story 1 — Browse and Manage Reports List (Priority: P1)

**Goal**: Paginated, searchable reports table at `/reports` with name, status badge, and three inline row action buttons.

**Independent Validation**: Navigate to `/reports`; table renders with at least one row showing name (as link), status badge, and Generate/Edit/Delete icon buttons; typing in the search field filters rows; pagination controls change the visible subset; network failure shows error alert with retry.

### Implementation

- [x] T018 [US1] Create `src/components/reports/reports-columns.tsx` — column defs: `name` (plain text placeholder link, will be wired as `Link` in US4), `status` (`Badge` with variant per `ReportStatus`), `actions` (renders `ReportsRowActions`)
- [x] T019 [US1] Create `src/components/reports/reports-row-actions.tsx` — three inline icon-button actions: Generate (`PlayIcon`, onClick TBD wired in US5), Edit (`PencilIcon`, `asChild` `Link` to `/reports/[id]`), Delete (`Trash2Icon`, opens `Dialog`); delete `Dialog` with report name in title + `variant="destructive"` confirm button (mutation wired in US6); all buttons accept `disabled` prop driven by `anyPending` from Zustand
- [x] T020 [US1] Create `src/components/reports/reports-table.tsx` — wraps `DataTable` with reports-specific columns; search toolbar (`Input` above table); loading skeleton; error alert with "Spróbuj ponownie" retry; uses `reportListOptions` + TanStack Query `useQuery`
- [x] T021 [US1] Create `src/app/(app)/reports/page.tsx` — server component; `prefetchQuery(reportListOptions(...))` + `HydrationBoundary`; renders `<ReportsTable />`
- [ ] T022 [US1] Verify US1: navigate to `/reports`; table loads within 2 s; name cell, status badge, and 3 icon buttons visible per row; search input filters rows; page navigation shows correct subset; simulate fetch failure → error alert with retry button; light mode, dark mode, mobile (≤768 px), desktop

**Checkpoint**: Reports list is fully functional and independently navigable.

---

## Phase 4: User Story 2 — Add a New Report (Priority: P1)

**Goal**: "Dodaj raport" button opens a three-step wizard in create mode; saving persists the new report and returns to the list.

**Independent Validation**: Click "Dodaj raport"; wizard opens at step 1 with empty fields; fill all three steps; click "Zapisz"; new report appears in the table; success toast shown.

### Implementation

- [x] T023 [US2] Create `src/components/reports/pages/DanePodstawoweStep.tsx` — step 1 fields using `useWizard()`: status (`SelectWiz`), name (`InputWiz`), description (`TextareaWiz` with `maxLength={2000}`), isKop (`CheckboxWiz` or direct checkbox wired via `setValue`); all fields disabled in `mode === 'view'`
- [x] T024 [P] [US2] Create `src/components/reports/pages/ParameterTable.tsx` — custom editable table for `QueryParameter[]` stored in wizard via `useWizard().setValue('parameters', ...)`; columns: Nazwa parametru (text), Typ parametru (select: numer/string/boolean/data), Wartość parametru (text), Opis parametru (text); delete button per row; "Dodaj parametr" button appends empty row; all inputs + delete + add disabled when `mode === 'view'`
- [x] T025 [US2] Create `src/components/reports/pages/ZapytanieStep.tsx` — step 2: dynamically imported Monaco Editor (`dynamic(() => import('@monaco-editor/react'), { ssr: false })`); reads `resolvedTheme` from `next-themes` and maps to `'vs-dark'` / `'light'`; wired to `sqlQuery` in wizard store; `ParameterTable` below editor; "Testuj zapytanie" button calls `testQuery` command + renders result table (columns + 1 row) or "Brak danych" or inline error; "Testuj zapytanie" button hidden when `mode === 'view'`; Monaco `readOnly` when `mode === 'view'`
- [x] T026 [US2] Create `src/components/reports/pages/UprawieniaStep.tsx` — step 3: fetches permissions via `useQuery(reportPermissionsOptions())`; splits into available (all minus selected) and selected (from `wizard.form.permissionIds`); renders `DualListTransfer`; `onChange` calls `wizard.setValue('permissionIds', ...)`; `disabled` when `mode === 'view'`
- [x] T027 [US2] Create `src/components/reports/reports-wizard.tsx` — `ReportsWizard` component accepting `id?: number` and `mode: 'create' | 'edit' | 'view'`; assembles `pages` array with three steps; configures `<Wizard>` with `mappingUrl`, `dataUrl` (with/without id), `saveUrl`, `saveOnPageChange={false}`, `cancelCallback`, `acceptActions` (Zapisz button on last step; static note "Raport będzie dostępny dla użytkownika po poprawnym teście" alongside); hidden/absent save action in view mode
- [x] T028 [US2] Create `src/app/(app)/reports/new/page.tsx` — renders `<ReportsWizard mode="create" />` inside `div` with padding (matching wizard-demo pattern)
- [x] T029 [US2] Wire "Dodaj raport" button above table in `src/components/reports/reports-table.tsx` — `Link` to `/reports/new`
- [ ] T030 [US2] Verify US2: click "Dodaj raport"; step 1 empty + active; fill status/name/description (observe char counter); add parameter in step 2; enter SQL; test query shows preview; add permissions in step 3; click "Zapisz"; success toast; redirected to list; report appears; validation error on empty required field highlights correct step; light/dark, mobile/desktop

**Checkpoint**: Full create flow works end-to-end.

---

## Phase 5: User Story 3 — Edit an Existing Report (Priority: P1)

**Goal**: Clicking Edit on a table row opens the wizard pre-populated with existing data; saving persists changes.

**Independent Validation**: Click Edit on any row; wizard step 1 shows existing name/status/description/isKop; step 2 shows existing SQL and parameters; step 3 shows assigned permissions in "Wybrane"; modify a field; save; list reflects update + success toast.

### Implementation

- [x] T031 [US3] Create `src/app/(app)/reports/[id]/page.tsx` — async server component; reads `params.id`; renders `<ReportsWizard id={Number(id)} mode="edit" />` inside padded div
- [ ] T032 [US3] Verify US3: click Edit on a row; step 1 pre-filled correctly; step 2 SQL pre-filled, parameters shown; step 3 assigned permissions in "Wybrane"; change name; save; table row updates + success toast; light/dark, mobile/desktop

**Checkpoint**: Edit flow works; wizard populates from `dataUrl /api/reports/wizard/data/[id]`.

---

## Phase 6: User Story 5 — Generate a Report (Priority: P1)

**Goal**: Generate icon button triggers async report generation; parametrised reports show drawer first; polling drives pending state; completion auto-downloads the file.

**Independent Validation**: Click Generate on a no-parameter report → row shows spinner immediately → polling resolves → download triggers. Click Generate on parametrised report → drawer opens → fill values → confirm → same polling flow. Drawer cancel → no request. Timeout after ~60 s → error toast + button re-enabled.

### Implementation

- [x] T033 [US5] Create `src/hooks/reports/use-report-generation.ts` — custom hook accepting `reportId: number`; reads/writes `generationStates` in Zustand `reportsSlice`; calls `generateReport`, then polls `checkGenerationStatus` via `setInterval` every `REPORT_POLL_INTERVAL_MS`; stops after `REPORT_POLL_MAX_ATTEMPTS` with timeout error; on `done` calls `downloadReport` and triggers Blob download; on `failed` shows error toast; clears interval on unmount
- [x] T034 [P] [US5] Create `src/components/reports/generation-drawer.tsx` — `Sheet` (side="right"); accepts `report: ReportListItem | null` and `onClose`; creates isolated `useForm()` (TanStack Form) pre-populated with `parameters.map(p => ({ name: p.name, value: p.defaultValue }))` as `runtimeParameters` array; renders `FormRepeater` (disabled add/remove, `min=max=params.length`); each row shows param label, type-appropriate input (`numer` → number, `string` → text, `boolean` → Checkbox, `data` → date input), and description as helper text; inline TanStack Form validation blocks submit if required fields empty; confirm button calls `onConfirm(runtimeParameters)` which closes drawer and triggers generation; cancel closes without action
- [x] T035 [US5] Wire generation in `src/components/reports/reports-row-actions.tsx` — import `useReportGeneration`; on Generate click: if `report.parameters.length === 0` call `generate()` directly; else call `setGeneratingReport(report)` (set on parent table); pass `anyPending` (derived from Zustand slice) to disable all three buttons; manage `generatingReport` state in `src/components/reports/reports-table.tsx`; render `<GenerationDrawer>` once outside the table, bound to `generatingReport`
- [ ] T036 [US5] Verify US5: Generate no-param report → Generate button becomes spinner immediately, others disabled; polling visible; download triggered on completion; Generate parametrised report → drawer opens < 200 ms; fill values; invalid empty required field shows inline error; confirm → generation starts; cancel → no pending state; wait ~60 s on stalled job → timeout toast; light/dark, mobile/desktop

**Checkpoint**: Full generate flow works including drawer, polling, download, and timeout.

---

## Phase 7: User Story 4 — View a Report (Read-Only) (Priority: P2)

**Goal**: Report name cell links to view mode; all wizard steps are read-only; no Save/Anuluj; footer shows "Edytuj" button.

**Independent Validation**: Click report name in table; wizard opens in view mode; all inputs disabled; Monaco non-editable; parameter table cells disabled; dual-list transfer controls disabled; no Save/Anuluj buttons; "Edytuj" button navigates to edit mode.

### Implementation

- [x] T037 [US4] Create `src/app/(app)/reports/[id]/view/page.tsx` — async server component; reads `params.id`; renders `<ReportsWizard id={Number(id)} mode="view" />`
- [x] T038 [US4] Audit and confirm view-mode guards across all wizard step components — `DanePodstawoweStep` (all `*Wiz` inputs disabled via `mode`), `ZapytanieStep` (Monaco `readOnly`, "Testuj zapytanie" + "Dodaj parametr" hidden/disabled), `ParameterTable` (all inputs + delete + add disabled), `UprawieniaStep` (`DualListTransfer` `disabled`); existing `WizardFooter` in `view` mode already hides Save/shows "Tylko do odczytu" — confirm this is sufficient or add "Edytuj" via `customActions`
- [x] T039 [US4] Wire report name as `Link` to `/reports/[id]/view` in `src/components/reports/reports-columns.tsx`; add "Edytuj" button in `ReportsWizard` `customActions` callback (view mode only) linking to `/reports/[id]`
- [ ] T040 [US4] Verify US4: click report name → view mode opens; all step 1 inputs disabled; step 2 Monaco non-editable, test + param buttons hidden; step 3 transfer controls disabled; no Save/Anuluj in footer; "Edytuj" button navigates to edit; light/dark, mobile/desktop

**Checkpoint**: View mode is fully read-only and navigable from the list.

---

## Phase 8: User Story 6 — Delete a Report (Priority: P2)

**Goal**: Delete button opens a named confirmation dialog; confirming removes the report from the list.

**Independent Validation**: Click Delete on any row; dialog shows report name and destructive confirm button; confirm → row removed + success toast; cancel → list unchanged; backend error → error toast + row preserved.

### Implementation

- [x] T041 [US6] Create `src/hooks/reports/use-delete-report.ts` — TanStack `useMutation` wrapping `deleteReport(id)` command; optimistic removal from `reportListOptions` cache; `onError` rollback + error toast; `onSuccess` success toast; `onSettled` invalidates `reportsKeys.list()`
- [x] T042 [US6] Wire `useDeleteReport` into `src/components/reports/reports-row-actions.tsx` — connect mutation to the delete `Dialog` confirm button (`isPending` disables both buttons; success closes dialog)
- [ ] T043 [US6] Verify US6: click Delete → dialog opens with report name; confirm → optimistic row removal + success toast; cancel → dialog closes, row preserved; simulate backend error → error toast + row restored; light/dark, mobile/desktop

**Checkpoint**: Delete flow complete with confirmation, optimistic update, and rollback.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Consistency, code quality, and final end-to-end validation across all stories.

- [x] T044 [P] Review Polish copy consistency across all new components — labels, placeholders, ARIA labels, toast messages, error messages; fix any missing diacritics or inconsistent terminology (e.g. "Raporty", "Raport", "Zapisz", "Anuluj", "Spróbuj ponownie")
- [x] T045 [P] Run `pnpm lint` and `pnpm build`; fix all TypeScript and ESLint errors introduced by new files; ensure no `any` escapes beyond existing patterns
- [ ] T046 Full end-to-end walkthrough of all six user stories in sequence; verify SC-001 (table < 2 s), SC-002 (step transition < 300 ms), SC-004 (generation feedback visible), SC-006 (Monaco theme switch < 500 ms), SC-009 (drawer opens < 200 ms); confirm light mode, dark mode, mobile, and desktop

**Checkpoint**: Feature is production-ready and all success criteria met.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    └── Phase 2 (Foundational)
            ├── Phase 3 (US1 — List)          ← can start after Phase 2
            ├── Phase 4 (US2 — Create)         ← can start after Phase 2
            ├── Phase 5 (US3 — Edit)           ← depends on Phase 4 (wizard exists)
            ├── Phase 6 (US5 — Generate)       ← depends on Phase 3 (row actions exist)
            ├── Phase 7 (US4 — View)           ← depends on Phase 4 (wizard exists)
            └── Phase 8 (US6 — Delete)         ← depends on Phase 3 (row actions exist)
                        └── Phase 9 (Polish)   ← depends on all phases complete
```

### User Story Dependencies

| Story | Depends On | Notes |
|-------|-----------|-------|
| US1 (List) | Phase 2 only | Independent — first deliverable |
| US2 (Create) | Phase 2 only | Independent after foundation |
| US3 (Edit) | US2 (wizard component exists) | Wizard reused from US2 |
| US4 (View) | US2 (wizard component exists) | Adds read-only mode to existing wizard |
| US5 (Generate) | US1 (row actions scaffolded) | Wires into existing row actions |
| US6 (Delete) | US1 (row actions scaffolded) | Wires into existing delete dialog |

### Parallel Opportunities Within Phases

**Phase 2** — T008, T009, T010, T012, T013, T015, T016, T017 can all run in parallel after T007 (contract types exist).

**Phase 4** — T024 (ParameterTable) can run in parallel with T023 (DanePodstawoweStep).

**Phase 6** — T034 (GenerationDrawer) can run in parallel with T033 (useReportGeneration hook).

---

## Implementation Strategy

**MVP Scope** (deliver value fastest): Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2).
After MVP: US3 (Edit) and US5 (Generate) — both P1.
Then: US4 (View) and US6 (Delete) — both P2.
Finally: Polish phase.

**Task count**: 46 tasks across 9 phases
**Per story**: US1 (5), US2 (8), US3 (2), US4 (4), US5 (4), US6 (3), Setup+Foundation (16), Polish (3)
**Parallelisable**: 18 tasks marked [P]
