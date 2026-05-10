# Tasks: Wizard System — Phase 1 Foundation

**Input**: Design documents from `specs/006-wizard-foundation/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ quickstart.md ✅

**Tests**: None — constitution forbids automated tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the one new dependency required before any wizard code can be written.

- [x] T001 Install Zustand: run `pnpm add zustand` from repo root and confirm `zustand` appears in `package.json` dependencies

**Checkpoint**: `pnpm build` passes with the new dependency present.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types and store infrastructure that every user story depends on. Must be complete before Phase 3.

- [x] T002 Create `src/lib/store/types.ts` — define `ValidationItem`, `WizardEntry`, `WizardSlice`, and `StoreState` exactly as specified in `specs/006-wizard-foundation/data-model.md` (Zustand Store Layer section)

- [x] T003 [P] Create `src/lib/store/wizard.slice.ts` — implement `createWizardSlice` using `StateCreator<StoreState, [], [], WizardSlice>`; implement `setWizardData` (upserts form, preserves meta), `setWizardValidation` (replaces validation array), `clearWizard` (removes entry); pass action name string as third argument to every `set()` call: `'wizard/setData'`, `'wizard/setValidation'`, `'wizard/clear'`

- [x] T004 [P] Create `src/lib/wizard/types.ts` — define `FieldType`, `FieldMeta`, `PageMapping`, `SummaryResult`, `WizardPage<T>`, `WizardConfig<T>`, and `WizardAPI<T>` exactly as specified in `specs/006-wizard-foundation/data-model.md` (Wizard Engine Layer section); `WizardAPI<T>` must include `nav`, `save`, and `saveAndQuit` methods

- [x] T005 Create `src/lib/store/index.ts` — implement `useStore` using `create<StoreState>()` wrapped with `devtools()` from `zustand/middleware`; pass `{ name: 'ci-prs-store' }` as devtools options; spread `createWizardSlice` inside the factory function; add a comment `// future slices here` as a TODO marker (allowed by constitution)

**Checkpoint**: Run `pnpm build` — all four new files compile with zero TypeScript errors.

---

## Phase 3: User Story 1 — Developer wires up a multi-step form (P1)

**Goal**: A developer can render a `<Wizard>` with a list of pages and get a navigable shell — side nav on the left showing page names, Back/Next buttons, correct page component rendered.

**Independent Validation**: Open `/wizard-demo` in the browser. Side nav shows 3 page names. Clicking "Dalej" advances to page 2 and highlights it in the nav. Clicking "Wstecz" returns to page 1. "Wstecz" is absent on page 1; "Dalej" is absent on page 3.

### Implementation

- [x] T006 [US1] Create `src/components/wizard/WizardContext.ts` — a single `createContext<WizardAPI | null>(null)` export named `WizardContext`; no other logic in this file (isolation prevents circular imports with `useWizard`)

- [x] T007 [US1] Create `src/hooks/wizard/useWizard.ts` — implement `useWizard<T>()` using React 19 `use(WizardContext)`; throw `new Error('useWizard must be used inside <WizardProvider>')` when context is null; mark file `'use client'`

- [x] T008 [US1] Create `src/components/wizard/WizardProvider.tsx` — implement Phase 1 skeleton (navigation only; no data fetching until Phase 2): local state `page` (number, starts 0), `busy` (boolean), `loading` (boolean, false); read `form` from `useStore`; expose `nav(toPage)` as async function that calls `setWizardValidation(name, [])` then `setPage(toPage)`; expose stub `save` and `saveAndQuit` as no-ops returning `Promise.resolve()`; assemble `WizardAPI` and push to `WizardContext.Provider`; mark `'use client'`

- [x] T009 [US1] Create `src/components/wizard/Wizard.tsx` — implement `Wizard<T>` that renders `<WizardProvider {...props}><WizardShell {...props} /></WizardProvider>`; implement `WizardShell` as an inner component that calls `useWizard()` to get `page`, `mapping`, `nav`, `busy`, `mode`; render a two-column grid (`grid grid-cols-[200px_1fr] gap-6`); left column: vertical nav buttons, one per page, active page styled `bg-primary text-primary-foreground`, inactive styled `text-muted-foreground hover:bg-muted`; right column: top nav bar, page slot `pages[page].form`, sticky bottom nav bar; nav bar shows: "Wstecz" (hidden on page 0), "Anuluj" (edit mode only, calls `props.cancelCallback`), "Dalej" (hidden on last page), "Tylko do odczytu" badge (view mode only); mark `'use client'`

- [x] T010 [US1] Create `src/app/wizard-demo/page.tsx` — stub demo page with `'use client'` directive; import `Wizard`; define three inline components `Krok1`, `Krok2`, `Krok3` each rendering a `<div className="p-4 border rounded">` with their Polish step name; render `<Wizard name="demo" mode="edit" pages={[...]} mappingUrl="" dataUrl="" saveOnPageChange={false} />`

**Checkpoint**: US1 independently verified — open `/wizard-demo`, confirm 3-step navigation works as described in Independent Validation above.

---

## Phase 4: User Story 2 — Form state persists between pages (P1)

**Goal**: Data entered on any wizard page survives forward and backward navigation; the Zustand store holds form state between page switches; store clears on unmount.

**Independent Validation**: In `/wizard-demo`, type text into an input on Krok1, navigate to Krok2, navigate back to Krok1 — the text is still present. Open Redux DevTools and confirm `wizard/setData` fires on each keystroke and the state tree shows the wizard entry under its name.

### Implementation

- [x] T011 [US2] Update `src/components/wizard/WizardProvider.tsx` — add form state management: read `form` from `useStore(s => s.wizards[name]?.form ?? {}) as T`; implement `setValue(key, value)`: build updated form, run `pages[page]?.calc` if defined, call `setWizardData(name, result)`; implement `setForm(newForm)`: same calc + setWizardData pattern; implement `appendData(data)`: shallow merge into current form, call `setWizardData`; implement `clearFields(fields)`: delete keys from form copy, call `setWizardData`; wire all four into `WizardAPI`

- [x] T012 [US2] Update `src/components/wizard/WizardProvider.tsx` — add lifecycle clearing: call `clearWizard(name)` inside a `useEffect` with `[]` dependency on mount; return `() => clearWizard(name)` as cleanup to clear on unmount; use `eslint-disable-next-line react-hooks/exhaustive-deps` on the effect (intentional empty-dep mount-only pattern)

- [x] T013 [US2] Update `src/app/wizard-demo/page.tsx` — add a controlled text input to `Krok1` that reads from and writes to the wizard form via `useWizard()` to make the persistence behavior visible in the browser

**Checkpoint**: US2 independently verified — text entered on Krok1 survives round-trip navigation; Redux DevTools shows `wizard/setData` and `wizard/clear` actions.

---

## Phase 5: User Story 3 — Read-only view mode (P2)

**Goal**: Rendering `<Wizard mode="view">` disables all save interactions and shows a "Tylko do odczytu" indicator.

**Independent Validation**: In `/wizard-demo`, switch the demo to `mode="view"`. Confirm: no "Dalej"/"Wstecz" nav action triggers save, the "Tylko do odczytu" badge is visible in the nav bar, no save or submit buttons appear.

### Implementation

- [x] T014 [US3] Update `src/components/wizard/Wizard.tsx` nav bar rendering — when `mode === 'view'`: render a disabled `<Button variant="outline" disabled>Tylko do odczytu</Button>` instead of Save/Anuluj buttons; Back and Next buttons remain functional (navigation is allowed in view mode); no DropdownMenu for save

- [x] T015 [US3] Update `src/app/wizard-demo/page.tsx` — add a second `<Wizard>` instance below the first with `name="demo-view"` and `mode="view"` to demonstrate both modes side-by-side on the page

**Checkpoint**: US3 independently verified — view-mode wizard shows "Tylko do odczytu", no save controls present.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Theme parity, Polish copy review, final build check.

- [x] T016 Verify dark mode — open `/wizard-demo` with the system dark theme active; confirm side nav, nav buttons, and page content have correct contrast and no hardcoded light-only colours; fix any Tailwind class that doesn't respect the theme token

- [x] T017 Verify mobile layout — open `/wizard-demo` at 375px viewport width; if the two-column grid overflows, update `Wizard.tsx` to use `grid-cols-1` on small screens and `md:grid-cols-[200px_1fr]` on medium+; side nav collapses or stacks above content on mobile

- [x] T018 Review Polish copy — confirm all user-visible strings in `Wizard.tsx` and `wizard-demo/page.tsx` are in Polish: "Wstecz", "Dalej", "Anuluj", "Zapisz", "Zapisz i wyjdź", "Tylko do odczytu"; no English strings in UI

- [x] T019 Run `pnpm build` and `pnpm lint` from repo root; fix all errors and warnings before marking implementation complete

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (Foundational)
        ├── Phase 3 (US1 — navigable shell)
        │     └── Phase 4 (US2 — form state) [depends on US1 WizardProvider existing]
        │           └── Phase 5 (US3 — view mode) [depends on Wizard.tsx from US1]
        └── Phase 6 (Polish) [depends on all story phases complete]
```

### User Story Dependencies

- US1 (T006–T010) is independent — can begin immediately after Phase 2
- US2 (T011–T013) depends on US1's `WizardProvider.tsx` existing (extends it)
- US3 (T014–T015) depends on US1's `Wizard.tsx` existing (extends it); independent of US2

### Parallel Opportunities

- T003 (wizard.slice.ts) and T004 (lib/wizard/types.ts) can be implemented in parallel after T002
- T014 (view mode in Wizard.tsx) and T011 (form state in WizardProvider.tsx) touch different files — can run in parallel after T010

### Implementation Strategy

**MVP**: Complete Phases 1–3 (T001–T010) for a navigable shell with no state. Verify US1 in the browser before proceeding.

**Increment 1**: Add Phase 4 (T011–T013) for full state persistence.

**Increment 2**: Add Phase 5 (T014–T015) for view mode.

**Finish**: Phase 6 polish and final build check.

---

## Notes

- [P] tasks touch different files and have no pending dependencies — safe to run in parallel
- [Story] labels map tasks to acceptance scenarios in `specs/006-wizard-foundation/spec.md`
- `WizardProvider.tsx` is updated across Phases 3 and 4 — complete T008 before starting T011
- No test tasks — constitution forbids automated tests
- No code comments except the single `// future slices here` TODO in `store/index.ts`
