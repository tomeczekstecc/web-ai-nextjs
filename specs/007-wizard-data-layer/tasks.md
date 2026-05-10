# Tasks: Wizard Data Layer (Phase 2)

**Input**: Design documents from `specs/007-wizard-data-layer/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ quickstart.md ✅

**Tests**: None — constitution forbids automated tests.

**Organization**: Tasks are grouped by user story to enable independent
implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify the sonner Toaster is mounted — required for save toasts in US3.

- [x] T001 Verify `<Toaster />` from `sonner` is present in `src/app/layout.tsx`; add it if missing (single import + JSX line)

**Checkpoint**: Toaster confirmed in root layout — save toasts will render.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: MSW handler factory file — consumed by all user stories via the demo
page registration and future wizard consumers.

- [x] T002 Create `src/mocks/handlers/wizard.ts` with four factory functions: `createWizardMappingHandler`, `createWizardDataHandler`, `createWizardSaveHandler`, `createWizardValidationHandler` using MSW v2 `http` and `HttpResponse`

**Checkpoint**: Factory functions exported — demo registration and future consumers
can import them.

---

## Phase 3: User Story 1 — Wizard Labels From Server (Priority: P1)

**Goal**: Side nav labels come from the MSW mapping response, not hardcoded values.
`WizardProvider` replaces the empty mapping state with a real TanStack Query fetch.
Mapping helpers (`getLabel`, `getType`, etc.) return real server values.

**Independent Validation**: Launch the demo wizard at `/wizard-demo`. The side nav
pills must display the labels returned by the MSW mapping fixture (e.g., "Dane
podstawowe"), not placeholder bracket text like `[title]`.

### Implementation for User Story 1

- [x] T003 [P] [US1] Create `src/hooks/wizard/useWizardMapping.ts` — TQ v5 `useQuery` that fetches `mappingUrl`, returns `PageMapping[]`, `staleTime: Infinity`
- [x] T004 [US1] Update `src/components/wizard/WizardProvider.tsx` — replace `const [mapping] = useState<PageMapping[]>([])` with `useWizardMapping(mappingUrl)` call; replace all five stub helpers (`getLabel`, `getType`, `getDisplay`, `getMax`, `getDecimal`) with real field-lookup implementations that search `mapping` array

**Checkpoint**: US1 complete — side nav labels rendered from server mapping.

---

## Phase 4: User Story 2 — Form Pre-fill From Data Fetch (Priority: P1)

**Goal**: When the wizard mounts, `useWizardData` fetches `dataUrl` and writes
the result into the Zustand wizard slice. Form fields render pre-filled on first
load; values persist across page navigation.

**Independent Validation**: Launch the demo wizard at `/wizard-demo`. All fields
must be pre-filled with values from the MSW data fixture on initial render.
Navigate between pages and confirm values are retained.

### Implementation for User Story 2

- [x] T005 [P] [US2] Create `src/hooks/wizard/useWizardData.ts` — TQ v5 `useQuery` that fetches `dataUrl`, returns `Record<string, unknown>`, `staleTime: Infinity`
- [x] T006 [US2] Update `src/components/wizard/WizardProvider.tsx` — call `useWizardData(dataUrl)`; add `useEffect` that writes `fetchedData` into Zustand via `setWizardData(name, fetchedData)` on resolution; derive `loading` from both `mappingLoading` and `dataLoading`; wire `refetch` to the data query's refetch function

**Checkpoint**: US2 complete — form pre-fills from MSW data fixture.

---

## Phase 5: User Story 3 — Save Fires PUT and Shows Toast (Priority: P1)

**Goal**: Clicking Save sends a PUT to `saveUrl` with the full flat form. A sonner
success toast appears. Auto-save fires on page navigation when `saveOnPageChange:
true` and `mode === 'edit'`. "Save and Quit" saves then calls `saveAndQuitCallback`.

**Independent Validation**: In the demo wizard (edit mode), click Save — a PUT
appears in the MSW request log and a toast appears. Click Next — another PUT fires
automatically. Change the demo's `saveAndQuitCallback` to `() => alert('quit')` and
confirm it fires after Save and Quit succeeds.

### Implementation for User Story 3

- [x] T007 [P] [US3] Create `src/hooks/wizard/useWizardSave.ts` — TQ v5 `useMutation` that PUTs `saveUrl` with JSON payload; `onSuccess`: `toast.success('Zapisano')`; `onError`: `toast.error('Błąd zapisu')`; handles undefined `saveUrl` gracefully
- [x] T008 [US3] Update `src/components/wizard/WizardProvider.tsx` — call `useWizardSave(saveUrl)`; replace `save: async () => {}` stub with `saveMutation.mutateAsync(form)`; replace `saveAndQuit: async () => {}` stub with mutate + `saveAndQuitCallback?.()`; update `nav()` to auto-save before page change when `saveOnPageChange && mode === 'edit'` (non-blocking: catch and continue on error)

**Checkpoint**: US3 complete — save, auto-save, save-and-quit all functional with
toast feedback.

---

## Phase 6: Integration & Demo

**Purpose**: Wire the updated `WizardProvider` into the demo page with real URLs
and register the MSW handlers so the full data flow is exercisable in the browser.

- [x] T009 [P] Update `src/app/wizard-demo/page.tsx` — pass `mappingUrl="/api/wizard-demo/mapping"`, `dataUrl="/api/wizard-demo/data"`, `saveUrl="/api/wizard-demo/save"`, `saveOnPageChange={true}` to `<Wizard>`; ensure the demo's pages array still has two steps with `name` values matching the MSW mapping fixture page names
- [x] T010 [P] Update `src/mocks/handlers/index.ts` — import factory functions from `./wizard`; define a `demoMapping` fixture with two pages (`step1`, `step2`) with Polish labels; append `createWizardMappingHandler`, `createWizardDataHandler`, `createWizardSaveHandler` calls to the `handlers` array
- [x] T011 Verify `src/components/wizard/Wizard.tsx` reads `loading` from `useWizard()` and disables Back/Next nav buttons when `loading === true`; add a minimal loading guard if missing

**Checkpoint**: End-to-end data flow works in browser — mapping → labels, data →
pre-fill, save → toast.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Type safety, code hygiene, and manual verification.

- [x] T012 Run `pnpm build` and `pnpm lint` from repo root; fix any TypeScript errors in the new hook files and the updated `WizardProvider.tsx`
- [ ] T013 [P] Manually verify all six items in the `quickstart.md` dev verification checklist against the running dev server at `/wizard-demo`

**Checkpoint**: All constitution gates pass, all quickstart items verified.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: No dependencies — can run in parallel with Phase 1
- **Phase 3 (US1)**: Depends on Phase 2 (T002 must exist before demo registration, though T003/T004 can be written independently)
- **Phase 4 (US2)**: Depends on Phase 3 being committed to avoid WizardProvider merge conflicts
- **Phase 5 (US3)**: Depends on Phase 4 being committed (same reason)
- **Phase 6 (Integration)**: Depends on Phases 2–5 complete
- **Phase 7 (Polish)**: Depends on Phase 6 complete

### User Story Dependencies

All three user stories are P1. US2 and US3 both modify `WizardProvider.tsx`,
so they must be applied sequentially to that file. The new hook files for each
story (T003, T005, T007) are independent new files and can be created in parallel.

### Within Each User Story

- Create the hook file first (parallelizable with other hook creation)
- Then apply the WizardProvider change for that story
- Manually verify the story's independent validation before moving to the next

### Parallel Opportunities

| Parallel Group | Tasks | Condition |
|----------------|-------|-----------|
| Group A | T001, T002 | Independent — different files |
| Group B | T003, T005, T007 | All new files — can be created simultaneously |
| Group C | T009, T010 | Both integration tasks — different files |

---

## Notes

- [P] tasks touch different files and have no incomplete dependencies
- [Story] label maps each task to a specific user story for traceability
- WizardProvider.tsx tasks (T004, T006, T008) are sequential — apply one story's
  changes at a time to avoid conflicts within the same file
- No test tasks — constitution forbids automated tests
- Polish copy in this phase is Polish (język polski): labels "Zapisano", "Błąd zapisu",
  "Dane podstawowe", "Szczegóły" per constitution Principle VII
