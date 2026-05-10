# Tasks: Wizard Field Input Components (Phase 3)

**Input**: Design documents from `specs/008-wizard-field-inputs/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ quickstart.md ✅

**Tests**: None — constitution forbids automated tests.

**Organization**: Tasks grouped by user story. US1 (one-line binding) and US2
(hide/display) share a phase because `hide` prop and `getDisplay()` check are
built into every Wiz component implementation — they cannot be separated.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3

---

## Phase 1: Setup (Missing shadcn/ui Components)

**Purpose**: Install the three shadcn/ui primitives that Wiz components and
`ValidationWrapper` depend on. Must complete before any component is created.

- [x] T001 Install missing shadcn/ui primitives — run `pnpm dlx shadcn@latest add textarea`, then `pnpm dlx shadcn@latest add radio-group`, then `pnpm dlx shadcn@latest add alert` — verify `src/components/ui/textarea.tsx`, `radio-group.tsx`, and `alert.tsx` exist after each install

**Checkpoint**: `textarea.tsx`, `radio-group.tsx`, and `alert.tsx` present in
`src/components/ui/` — component creation can begin.

---

## Phase 2: Foundational (Shared Building Blocks)

**Purpose**: `useWizardField` and `ValidationWrapper` are used by every Wiz
component and by the US3 escape-hatch pattern. Both must exist before any Wiz
component is created.

- [x] T002 [P] Create `src/hooks/wizard/useWizardField.ts` — reads `form`, `setValue`, `getLabel`, `getDisplay`, `validation`, `mode` from `useWizard()`; returns `{ label, value, onChange, hidden, disabled, error }` where `error` is `validation.find(item => item.key === keyName)?.msgs[0]`
- [x] T003 [P] Create `src/components/wizard/ValidationWrapper.tsx` — internal component (not re-exported publicly); reads `pageKey` from `useWizard()`; renders `<span id={pageKey + '.' + field} />` scroll anchor, red `ring-2 ring-destructive` border around children when `error` is set, and a shadcn `<Alert variant="destructive">` with the error message below

**Checkpoint**: Foundation ready — `useWizardField` and `ValidationWrapper`
available for all Wiz component implementations.

---

## Phase 3: User Stories 1 & 2 — One-Line Binding + Hide/Display (Priority: P1)

**Goal**: Five self-contained Wiz input components, each encapsulating server
label lookup, view-mode disabling, explicit `hide` prop, automatic `getDisplay()`
hiding, and inline validation feedback. A page author writes one line per field.

**Independent Validation**: In the demo wizard at `/wizard-demo`, `Krok1` shows
`<InputWiz keyName="tytul" />` rendering label "Tytuł" from MSW mapping. Switch
the demo to view mode — the input is disabled. Add a `ValidationItem` via Zustand
DevTools — red border and error alert appear. Set `hide={true}` — the input
vanishes with no DOM trace.

### Implementation for User Stories 1 & 2

- [x] T004 [US1] Create `src/components/wizard/inputs/InputWiz.tsx` — calls `useWizardField(keyName)`; returns `null` if `f.hidden || hide`; renders `<Label>` + `<ValidationWrapper>` wrapping shadcn `<Input>`; accepts `keyName`, `hide?`, `label?` override
- [x] T005 [P] [US1] Create `src/components/wizard/inputs/SelectWiz.tsx` — same pattern as `InputWiz`; uses shadcn `Select` / `SelectTrigger` / `SelectContent` / `SelectItem`; accepts additional `options: { value: string; label: string }[]` prop
- [x] T006 [P] [US1] Create `src/components/wizard/inputs/TextareaWiz.tsx` — same pattern as `InputWiz`; uses shadcn `Textarea` from the newly installed `src/components/ui/textarea.tsx`
- [x] T007 [P] [US1] Create `src/components/wizard/inputs/DateTimeWiz.tsx` — same pattern; uses a native `<input type="date" | "datetime-local">` styled with the same Tailwind classes as shadcn `Input`; accepts `hideTime?: boolean` to toggle between date-only and datetime-local
- [x] T008 [P] [US1] Create `src/components/wizard/inputs/RadioWiz.tsx` — same pattern; uses shadcn `RadioGroup` / `RadioGroupItem`; accepts `options: { value: string; label: string }[]`; each option rendered as a row with `RadioGroupItem` + `Label`
- [x] T009 [US1] Update `src/app/wizard-demo/page.tsx` — replace the raw `<input>` and manual label in `Krok1` with `<InputWiz keyName="tytul" />`; remove the `useWizard()` import from `Krok1` since `InputWiz` handles it internally; keep `Krok2` and `Krok3` unchanged

**Checkpoint**: US1 + US2 complete — all five Wiz components render server labels,
disable in view mode, hide on `hide={true}` or `display: false`, and show inline
validation without any boilerplate in the page file.

---

## Phase 4: User Story 3 — Custom Input Escape Hatch (Priority: P2)

**Goal**: Demonstrate that `useWizardField` works as a public escape hatch for
custom inputs that have no pre-built Wiz variant. A developer uses only the hook
and has full control over rendering.

**Independent Validation**: In the demo wizard, the custom component built with
`useWizardField` shows the server-mapped label, writes to Zustand on change, and
disables in view mode — all without importing `useWizard` directly.

### Implementation for User Story 3

- [x] T010 [US3] Add a `CustomWizField` demo component to `src/app/wizard-demo/page.tsx` that calls `useWizardField('opis')` directly, checks `f.hidden` to return `null`, and renders a plain styled `<textarea>` with `f.label`, `f.value`, `f.onChange`, and `f.disabled` — demonstrating the escape hatch pattern; add it to `Krok2`

**Checkpoint**: US3 complete — escape hatch shown working in the demo alongside
the built-in Wiz components.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: TypeScript correctness, lint hygiene, and manual verification.

- [x] T011 Run `pnpm build` and `pnpm lint` from repo root; fix any TypeScript errors in the new hook, wrapper, and five Wiz component files
- [ ] T012 [P] Manually verify all six items in the `quickstart.md` dev verification checklist against the running dev server at `/wizard-demo`

**Checkpoint**: All constitution gates pass, all quickstart items verified.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (T001 must complete so `Alert`, `Textarea`, `RadioGroup` can be imported by T002/T003)
- **Phase 3 (US1+US2)**: Depends on Phase 2 complete (T002 + T003 must exist)
- **Phase 4 (US3)**: Depends on Phase 2 complete (T002 must exist); can run in parallel with Phase 3
- **Phase 5 (Polish)**: Depends on Phases 3 and 4 complete

### User Story Dependencies

- US1 and US2 are implemented together — `hide` and `getDisplay()` are part of each Wiz component from the start
- US3 depends only on `useWizardField` (T002) being complete — it is independent of the five Wiz components

### Within Each User Story

- T004 (InputWiz) is the reference implementation — implement it first and use the same pattern for T005–T008
- T005–T008 are independent new files — they can all be written in parallel once T003 is done

### Parallel Opportunities

| Parallel Group | Tasks | Condition |
|----------------|-------|-----------|
| Group A | T002, T003 | Both new files — no mutual dependency |
| Group B | T005, T006, T007, T008 | All new files — reference T004 pattern |
| Group C | T010 | Independent of T005–T009 (only needs T002) |
| Group D | T011, T012 | Polish — both after all Wiz files exist |

---

## Notes

- [P] tasks touch different files with no incomplete dependencies
- [Story] labels map tasks to user stories for traceability
- `ValidationWrapper` is INTERNAL — never import it in page files or export it from any barrel/index
- `useWizardField` is PUBLIC — it is the escape hatch for US3 and the internal engine of all Wiz components
- No test tasks — constitution forbids automated tests
- Polish copy is Polish (język polski): labels come from MSW mapping fixture; error messages from `ValidationItem.msgs[0]`
