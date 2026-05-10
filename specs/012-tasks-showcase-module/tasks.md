---

description: "Task list for Tasks Showcase Module (Phase 6)"
---

# Tasks: Tasks Showcase Module (Phase 6)

**Input**: Design documents from `specs/012-tasks-showcase-module/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Tests**: Do not add automated tests. Constitution forbids test tasks.

**Organization**: Foundational work (data fixtures, MSW handlers, wizard page components, TasksWizard config) must complete before any route is built. Routes map 1-to-1 to user stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared state)
- **[Story]**: Maps to user story from spec.md

---

## Phase 1: Setup

**Purpose**: Create the single source of truth for all fixture data. Everything downstream depends on this file.

- [x] T001 Create `src/mocks/data/tasks-wizard.ts` exporting: `TASK_MAPPING` (5-page PageMapping[]), `EMPTY_TASK_FORM` (empty TaskForm), `TASK_FIXTURES` (Record<number, TaskForm> for IDs 1–3), `TASK_LIST` (3-row list with id/title/type/priority/deadline), `TASK_TYPES` (3 DictOption[]), `TASK_ASSIGNEES` (3 DictOption[]), `TASK_VALIDATION` (SummaryResult with 1 error on `start.title` and 1 warning on `schedule.deadline`)

**Checkpoint**: File exists and exports compile without errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: MSW handlers and all wizard page components must exist before any route story can be independently tested.

- [x] T002 Create `src/mocks/handlers/tasks-wizard.ts` exporting `taskWizardHandlers` array: use `createWizardMappingHandler('/api/tasks/wizard/mapping', TASK_MAPPING)`, `createWizardDataHandler('/api/tasks/wizard/data', EMPTY_TASK_FORM)`, `createWizardSaveHandler('/api/tasks/wizard/save')`, `createWizardValidationHandler('/api/tasks/wizard/validate', TASK_VALIDATION)`; add custom `http.get('/api/tasks/wizard/data/:id', ...)` returning `TASK_FIXTURES[Number(id)] ?? { error: 'Not found' }` (404 on missing); add custom handlers for `GET /api/tasks/list` → `TASK_LIST`, `GET /api/tasks/dict/types` → `TASK_TYPES`, `GET /api/tasks/dict/assignees` → `TASK_ASSIGNEES`
- [x] T003 Update `src/mocks/handlers/index.ts`: import `taskWizardHandlers` from `'./tasks-wizard'` and spread it into the exported `handlers` array
- [x] T004 [P] Create `src/components/tasks-wizard/pages/StartPage.tsx`: `'use client'`; renders `InputWiz keyName="title"`, `SelectWiz keyName="type" options={TASK_TYPES}`, `TextareaWiz keyName="description"`; exports a `startSchema = z.object({ title: z.string().min(3, 'Tytuł musi mieć co najmniej 3 znaki') })`
- [x] T005 [P] Create `src/components/tasks-wizard/pages/SchedulePage.tsx`: `'use client'`; reads `form` via `useWizard()`; renders `RadioWiz keyName="priority" options={PRIORITY_OPTIONS}` (low/normal/high in Polish), `DateTimeWiz keyName="deadline" hideTime`, `DateTimeWiz keyName="start_date" hideTime`, and a read-only urgency display: `<Badge>{(form.deadline_urgency as string) || 'Brak daty'}</Badge>` with label "Pilność terminu"; exports `scheduleCalc: (form) => ({ ...form, deadline_urgency: calcUrgency(form.deadline as string) })` where `calcUrgency` returns 'Pilne' (<3 days), 'Normalne' (3–14 days), 'Spokojnie' (>14 days), 'Brak daty' (empty)
- [x] T006 [P] Create `src/components/tasks-wizard/pages/AssignmentPage.tsx`: `'use client'`; reads `form` via `useWizard()`; renders `SelectWiz keyName="assignee_id" options={TASK_ASSIGNEES} hide={form.type === 'personal'}`; when `form.type === 'personal'` also shows `<p className="text-sm text-muted-foreground">Zadanie osobiste — brak przypisania.</p>`
- [x] T007 [P] Create `src/components/tasks-wizard/pages/RelatedPage.tsx`: `'use client'`; uses `useWizardField('related_ids')`; renders a checkbox list from `TASK_LIST` where each item toggles its `id` in/out of `(f.value as number[]) ?? []`; respects `f.disabled`; shows `f.label` as section heading
- [x] T008 [P] Create `src/components/tasks-wizard/pages/SummaryPage.tsx`: `'use client'`; renders `<WizardSummary />` (no props — reads context internally)
- [x] T009 Create `src/components/tasks-wizard/TasksWizard.tsx`: `'use client'`; accepts `{ id?: number; mode: 'edit' | 'view' }`; assembles `pages: WizardPage<TaskForm>[]` array with `StartPage` (schema: startSchema), `SchedulePage` (calc: scheduleCalc), `AssignmentPage`, `RelatedPage`, `SummaryPage` (isSummaryPage: true); passes `dataUrl = id ? \`/api/tasks/wizard/data/\${id}\` : '/api/tasks/wizard/data'`; wires `cancelCallback` and `saveAndQuitCallback` to `router.push('/wizard-demo')`; wires `acceptButtons` to a disabled-when-errors "Wyślij zadanie" Button with `toast.success` on click; `saveOnPageChange={true}`

**Checkpoint**: All 8 wizard page components and TasksWizard compile. MSW handlers registered. Can verify by checking `pnpm build` or `pnpm tsc --noEmit`.

---

## Phase 3: User Story 1 — Browse task list (Priority: P1)

**Goal**: The `/wizard-demo` index page shows a table of seeded tasks with create/edit/view links.

**Independent Validation**: Navigate to `/wizard-demo` — a table renders with 3 rows (Przygotowanie raportu Q2, Spotkanie z klientem, Aktualizacja dokumentacji). "Nowe zadanie" button is visible.

### Implementation for User Story 1

- [x] T010 [US1] Replace `src/app/wizard-demo/page.tsx` with a `'use client'` task list page: use `useQuery({ queryKey: ['tasks-list'], queryFn: () => fetch('/api/tasks/list').then(r => r.json()) })` to fetch tasks; render a shadcn `Table` with columns Tytuł, Typ, Priorytet, Termin, and an Akcje column; each row has a `Link` to `/wizard-demo/{id}` (Edytuj) and `/wizard-demo/{id}/view` (Podgląd); add a "Nowe zadanie" `Button` (as Link to `/wizard-demo/new`) above the table; show a loading skeleton row while fetching

**Checkpoint**: `/wizard-demo` loads, shows 3 task rows, "Nowe zadanie" and "Edytuj"/"Podgląd" links are present and correct.

---

## Phase 4: User Story 2 — Create a new task (Priority: P1) and User Story 3 — Edit an existing task (Priority: P1)

**Goal**: Create and edit routes open the TasksWizard in edit mode. Create starts with an empty form. Edit pre-fills from fixture.

**Independent Validation (US2)**: Navigate to `/wizard-demo/new` — wizard opens with empty fields and server-driven labels. Entering a 2-character title and clicking Next shows a validation error.

**Independent Validation (US3)**: Navigate to `/wizard-demo/1` — wizard opens with "Przygotowanie raportu Q2" pre-filled in the title field.

### Implementation for User Story 2

- [x] T011 [P] [US2] Create `src/app/wizard-demo/new/page.tsx`: `'use client'`; renders a heading "Nowe zadanie" and `<TasksWizard mode="edit" />`

### Implementation for User Story 3

- [x] T012 [P] [US3] Create `src/app/wizard-demo/[id]/page.tsx`: `'use client'`; reads `params.id` via `useParams()`; renders a heading `Edycja zadania #\${params.id}` and `<TasksWizard id={Number(params.id)} mode="edit" />`

**Checkpoint US2**: `/wizard-demo/new` renders empty wizard. Short title blocked on Next. Valid title advances to Schedule page.
**Checkpoint US3**: `/wizard-demo/1` renders wizard pre-filled with task 1 data.

---

## Phase 5: User Story 4 — View a task in read-only mode (Priority: P2)

**Goal**: `/wizard-demo/[id]/view` opens the TasksWizard in view mode — all inputs disabled, no Save/Cancel buttons.

**Independent Validation**: Navigate to `/wizard-demo/2/view` — all inputs disabled, side nav navigable, no Save button, "Tylko do odczytu" badge visible.

### Implementation for User Story 4

- [x] T013 [US4] Create `src/app/wizard-demo/[id]/view/page.tsx`: `'use client'`; reads `params.id` via `useParams()`; renders a heading `Podgląd zadania #\${params.id}` and `<TasksWizard id={Number(params.id)} mode="view" />`

**Checkpoint**: `/wizard-demo/2/view` renders wizard with disabled inputs and no Save/Cancel buttons.

---

## Phase 6: User Story 5 — Navigate the side navigation (Priority: P2)

**Goal**: Side nav labels come from server mapping. Clicking a label navigates to that page.

**Independent Validation**: Open any wizard route. Side nav shows exactly 5 pills: Start, Harmonogram, Przypisanie, Powiązane, Podsumowanie. Clicking "Harmonogram" (page 2) navigates there.

### Implementation for User Story 5

- [x] T014 [US5] Verify (no new file): open `/wizard-demo/new` and confirm the 5 side nav pill labels match the mapping fixture. If any label is hardcoded instead of server-driven, trace to `TasksWizard.tsx` or `WizardProvider.tsx` and fix the mapping URL. No code change expected — this task is a verification checkpoint.

**Checkpoint**: All 5 side nav labels are in Polish and match `TASK_MAPPING[*].label` values.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify all wizard engine features exercised end-to-end. No new files.

- [x] T015 [P] Verify calc urgency on SchedulePage: navigate to `/wizard-demo/new`, advance to Harmonogram, set a deadline within 2 days — confirm urgency badge shows "Pilne"; set deadline >14 days away — confirm "Spokojnie"
- [x] T016 [P] Verify hide behavior: on `/wizard-demo/new`, set type to "Osobiste" on Start page, advance to Przypisanie — confirm assignee field is hidden and the "Zadanie osobiste" message is visible; change type to "Złożone" and return — assignee field visible
- [x] T017 [P] Verify summary validation: advance to Podsumowanie on `/wizard-demo/new` — confirm fixture error on `start.title` is shown with a "Przejdź do pola" jump link; clicking it navigates to Start page and highlights the title field
- [x] T018 [P] Verify save-on-page-change: navigate Next on any edit-mode wizard step — confirm a sonner save toast appears after each navigation
- [x] T019 Verify Cancel: click Cancel button in edit mode — confirm redirect to `/wizard-demo` (task list)
- [x] T020 Verify view mode completeness: open `/wizard-demo/3/view` — confirm all 5 pages show disabled inputs, no Save button, "Tylko do odczytu" badge, and Cancel button is absent

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: T002–T009 depend on T001 (fixture data); T004–T008 [P] can run simultaneously; T009 depends on T004–T008 completing
- **US1 (Phase 3)**: Depends on T002+T003 (MSW handlers registered); does NOT depend on T009
- **US2+US3 (Phase 4)**: Depends on T009 (TasksWizard complete)
- **US4 (Phase 5)**: Depends on T009
- **US5 (Phase 6)**: Depends on T009 and T002 (mapping handler registered)
- **Polish (Phase 7)**: Depends on all route pages existing (T010–T013)

### User Story Dependencies

| Story | Key prerequisite | Can start after |
|-------|-----------------|-----------------|
| US1 — task list | T002+T003 (MSW handlers) | Phase 2 completion |
| US2 — create | T009 (TasksWizard) | Phase 2 completion |
| US3 — edit | T009 (TasksWizard) | Phase 2 completion |
| US4 — view | T009 (TasksWizard) | Phase 2 completion |
| US5 — side nav | T009 + T002 | Phase 2 completion |

US2, US3, US4, US5 are all independently implementable after Phase 2. US1 can proceed even earlier (after T003).

### Parallel Opportunities

- **T004, T005, T006, T007, T008**: All are different files in `tasks-wizard/pages/` — fully parallel
- **T011, T012**: Different route files — fully parallel
- **T015, T016, T017, T018**: Verification tasks on different features — fully parallel
- **T010 (US1) can start immediately after T003** — does not need T009

---

## Implementation Strategy

### MVP Scope (P1 stories only — US1 + US2 + US3)

1. T001 (fixtures) → T002 (handlers) → T003 (register) — sequential, ~20 min
2. T004–T008 in parallel (page components) — ~30 min
3. T009 (TasksWizard config) — ~15 min
4. T010 (task list) + T011 (new route) + T012 (edit route) — parallel, ~20 min

**Estimated MVP wall time**: ~85 min sequential, ~55 min with parallelism

### Full Scope

Add T013 (view route), T014 (side nav verification), T015–T020 (polish) after MVP passes.

---

## Notes

- [P] tasks touch different files — safe to implement in parallel agent calls
- US5 (side nav) has no new file — it's a verification task (T014)
- `TASK_TYPES`, `TASK_ASSIGNEES`, and `TASK_LIST` are static imports from `tasks-wizard.ts` in page components — no additional fetch needed for dict options
- `TasksWizard.tsx` must be `'use client'` because it uses `useRouter()` for `cancelCallback`
- All route pages must be `'use client'` because they use `useParams()` (dynamic segment)
- The existing `/api/wizard-demo/*` MSW handlers remain untouched — the new handlers use `/api/tasks/*` paths
- Task count: 20 total (1 setup + 8 foundational + 1 US1 + 2 US2/3 + 1 US4 + 1 US5 + 6 polish)
