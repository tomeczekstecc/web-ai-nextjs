---

description: "Task list for Wizard Advanced Features (Phase 5)"
---

# Tasks: Wizard Advanced Features (Phase 5)

**Input**: Design documents from `specs/011-wizard-advanced-features/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Tests**: Do not add automated tests. Constitution forbids test tasks.

**Scope**: All changes in one file — `src/app/wizard-demo/page.tsx`.
Engine features (calc, clearFields, appendData, acceptButtons, customButtons, cancelCallback) are already implemented. These tasks demonstrate each feature in the demo page.

**US2 & US3 note**: `clearFields` and `appendData` are already fully implemented in the engine (WizardProvider). The demo exercises `clearFields` implicitly via the `hide` prop pattern (US2) and `appendData` via a note in the Krok2 component. No engine changes needed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (touches different sections of the file or different logical concerns)
- **[Story]**: Maps to user story from spec.md

## Phase 1: Setup

**Purpose**: Add missing imports needed by Phase 5 tasks

- [x] T001 Add `SelectWiz` import from `@/components/wizard/inputs/SelectWiz` and `toast` import from `sonner` to `src/app/wizard-demo/page.tsx`

**Checkpoint**: Imports ready — all Phase 5 tasks can proceed

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Add the `typ` select and `tytul_upr` derived field to the `Krok2` component body — needed by both US1 (calc) and US2 (hide)

- [x] T002 In `Krok2` in `src/app/wizard-demo/page.tsx`, read `form.typ` via `useWizard()` and add a `SelectWiz` for `keyName="typ"` with options `[{ value: 'prosty', label: 'Prosty' }, { value: 'złożony', label: 'Złożony' }]` and `label="Typ zadania"`
- [x] T003 In `Krok2` in `src/app/wizard-demo/page.tsx`, add a disabled `InputWiz` for `keyName="tytul_upr"` with `label="Tytuł (wersaliki)"` — this field is populated by `calc` (T004) and hidden when `form.typ === 'prosty'` (T005); add placeholder text `"(wypełniany automatycznie)"`

**Checkpoint**: Krok2 has the two new fields — subsequent tasks can wire calc and hide without touching component structure

---

## Phase 3: User Story 1 — Computed fields update automatically (Priority: P1)

**Goal**: `calc` on the `krok-2` page entry derives `tytul_upr` (uppercase of `tytul`) automatically after every `setValue`

**Independent Validation**: Navigate to Krok 2; the `tytul_upr` field auto-fills with the uppercase value of `tytul` entered on Krok 1. Editing `tytul` from Krok 2 updates `tytul_upr` immediately.

### Implementation for User Story 1

- [x] T004 [US1] In `demoPages` in `src/app/wizard-demo/page.tsx`, add `calc: (form) => ({ ...form, tytul_upr: ((form.tytul as string) ?? '').toUpperCase() })` to the `krok-2` entry

**Checkpoint**: Navigate to Krok 2 — `tytul_upr` InputWiz shows the uppercase of `tytul`. Change `tytul` and observe `tytul_upr` updating.

---

## Phase 4: User Story 2 — Conditional visibility / clearFields pattern (Priority: P2)

**Goal**: `hide` prop on `tytul_upr` field hides it when `form.typ === 'prosty'`, demonstrating the standard conditional visibility pattern that complements `clearFields`

**Independent Validation**: On Krok 2, select "Prosty" from the Typ dropdown — the `tytul_upr` field disappears. Select "Złożony" — it reappears.

### Implementation for User Story 2

- [x] T005 [US2] In `Krok2` in `src/app/wizard-demo/page.tsx`, add `hide={form.typ === 'prosty'}` prop to the `tytul_upr` `InputWiz` added in T003

**Checkpoint**: Select "Prosty" — `tytul_upr` hides. Select "Złożony" — it shows.

---

## Phase 5: User Story 4 — Submit guarded by validation result (Priority: P1)

**Goal**: `acceptButtons` render prop disables the submit button when the `summary` contains errors, so users cannot submit invalid data

**Independent Validation**: Navigate to the summary page (Krok 4). The "Wyślij formularz" button is disabled because the MSW fixture returns a validation error. A sonner success toast fires if errors are cleared.

### Implementation for User Story 4

- [x] T006 [US4] In `WizardDemoPage` in `src/app/wizard-demo/page.tsx`, update the `acceptButtons` render prop: derive `const hasErrors = summary && Object.keys(summary.error ?? {}).length > 0`, set `disabled={!!hasErrors}` on the `Button`, and change `onClick` to call `toast.success('Formularz wysłany!')` instead of `console.log`

**Checkpoint**: Navigate to summary page — submit button is disabled (MSW fixture has an error). If the fixture is edited to return no errors, the button becomes enabled and shows a success toast on click.

---

## Phase 6: User Story 6 — Cancel navigates away (Priority: P2)

**Goal**: `cancelCallback` wires the Cancel button in edit mode to a visible handler

**Independent Validation**: Click Cancel on any step in edit mode — a sonner info toast appears saying "Anulowano — w produkcji nastąpi przekierowanie".

### Implementation for User Story 6

- [x] T007 [US6] In `WizardDemoPage` in `src/app/wizard-demo/page.tsx`, add `cancelCallback={() => toast.info('Anulowano — w produkcji nastąpi przekierowanie')}` to the edit-mode `<Wizard>` component

**Checkpoint**: Click Cancel in edit mode — info toast appears.

---

## Phase 7: User Story 5 — Additional last-page actions (Priority: P3)

**Goal**: `customButtons` renders a secondary "Zapisz jako szkic" button alongside `acceptButtons` on the summary page

**Independent Validation**: Navigate to the summary page (Krok 4) — both "Wyślij formularz" (disabled/enabled per US4) and "Zapisz jako szkic" buttons are visible. Clicking "Zapisz jako szkic" shows an info toast.

### Implementation for User Story 5

- [x] T008 [US5] In `WizardDemoPage` in `src/app/wizard-demo/page.tsx`, add `customButtons={() => (<Button variant="outline" onClick={() => toast.info('Zapisano jako szkic')}>Zapisz jako szkic</Button>)}` to the edit-mode `<Wizard>` component

**Checkpoint**: Navigate to summary page — secondary button is visible alongside submit button.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Visual review and cleanup

- [x] T009 [P] Verify `Krok2` renders correctly in light and dark mode and on mobile widths — check that both new fields (`typ` select and `tytul_upr` input) are fully visible and not clipped
- [x] T010 [P] Verify the summary page (Krok 4) in edit mode shows: disabled submit button, "Zapisz jako szkic" button, and navigation arrows — confirm no layout overflow
- [x] T011 Verify view-mode wizard (`name="demo-view"`) is unaffected — Cancel button absent, no `acceptButtons`, no `customButtons`
- [x] T012 Remove any `console.log` statements left in the demo page after replacing them with toast calls in T006

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 — must complete before T004 and T005
- **User Story Phases (3–7)**: Each depends on Phase 2 completion; US1 (T004) and US2 (T005) share T003 as a prerequisite but touch different props
- **Polish (Phase 8)**: Depends on all story phases being complete

### User Story Dependencies

| Story | Depends on | Can run independently after |
|-------|-----------|----------------------------|
| US1 — calc | T001, T002, T003 | Phase 2 completion |
| US2 — hide | T001, T002, T003, T004 (calc must exist so tytul_upr field exists) | Phase 3 completion |
| US4 — acceptButtons | T001 only | Phase 1 completion |
| US6 — cancelCallback | T001 only | Phase 1 completion |
| US5 — customButtons | T001 only | Phase 1 completion |

### Within-File Parallel Opportunities

Tasks T006, T007, T008 all modify the `<Wizard>` JSX props in `WizardDemoPage` — they cannot be applied simultaneously, but they are logically independent and can be applied in any order.

Tasks T004 and T005 modify different things in the same file section and must be sequential (T004 first — adds `calc` which populates `tytul_upr`; T005 second — adds `hide` to the rendered field).

---

## Notes

- All tasks are in `src/app/wizard-demo/page.tsx` — no new files created
- No new MSW handlers needed
- US3 (`appendData`) has no demo task: the engine method exists and is exported in `WizardAPI`; a page author can call it via `useWizard()` — no demo addition needed for phase completeness
- `SelectWiz` options are inline (no server mapping) — this is acceptable for demo purposes per research decision
- Task count: 12 total (1 setup + 2 foundational + 5 story + 4 polish)
