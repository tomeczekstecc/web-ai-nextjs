# Tasks: Wizard Validation System (Phase 4)

**Input**: Design documents from `specs/010-wizard-validation/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: No automated tests — constitution forbids test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: No new dependencies or scaffolding required. Zod is already installed. Confirm it is available before proceeding.

- [x] T001 Confirm `zod` is listed in `package.json` dependencies and available for import; if missing, add with `pnpm add zod`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure utility module and context extension that both user story phases depend on.

- [x] T002 [P] Create `src/lib/wizard/validation.ts` — export `runPageSchema<T>(schema: z.ZodSchema<T>, form: T): ValidationItem[]` that calls `schema.safeParse(form)`, groups issues by `String(issue.path[0])` as key, and returns one `ValidationItem` per unique key with `type: 'error'` and all matching messages in `msgs`
- [x] T003 [P] Add `parseSummaryResult(result: SummaryResult): ValidationItem[]` to `src/lib/wizard/validation.ts` — iterates `result.error` entries as `type: 'error'`, then `result.warning` entries as `type: 'warning'` skipping any key that already has an error entry; excludes `dicts_msg` (rendered separately by WizardSummary from the raw summary object)
- [x] T004 Add `summary` local state (`useState<SummaryResult | null>(null)`) to `src/components/wizard/WizardProvider.tsx` and include `summary` and `setSummary` in the value passed to `WizardContext` — replace the current hardcoded `summary: null` in the context value

**Checkpoint**: `validation.ts` exports both functions; `WizardProvider` exposes `summary` state via context. US1 and US2 implementation can now proceed.

---

## Phase 3: User Story 1 — Zod Validation Blocks Navigation (Priority: P1)

**Goal**: Navigating away from a wizard page with a failing Zod schema blocks navigation and shows inline errors on the relevant fields.

**Independent Validation**: Open the demo wizard at `/wizard-demo`. On krok-1, leave `tytul` blank and click Next. Navigation must be blocked and a red inline error must appear on the `tytul` field. Fix the title (3+ chars) and click Next — navigation proceeds, errors clear.

### Implementation for User Story 1

- [x] T005 [US1] In `src/components/wizard/WizardProvider.tsx`, update the `nav(toPage)` function: before navigating, read `pages[page].schema`; if it exists, call `runPageSchema(schema, form)` — if the result is non-empty, call `setWizardValidation(name, errors)` and return early (blocking navigation); if empty or no schema, call `setWizardValidation(name, [])` then proceed — this replaces the current unconditional `setWizardValidation(name, [])` call
- [x] T006 [P] [US1] Add a Zod schema to the `krok-1` page entry in `src/app/wizard-demo/page.tsx`: `schema: z.object({ tytul: z.string().min(3, 'Tytuł musi mieć co najmniej 3 znaki') })` — add `import { z } from 'zod'` at the top of the file
- [ ] T007 [US1] Verify T005 + T006: start the dev server (`pnpm dev`), navigate to `/wizard-demo`, leave tytul blank, click Next — confirm error appears on tytul input, navigation is blocked; fill in 3+ chars, click Next — confirm navigation proceeds and error clears

**Checkpoint**: US1 is fully functional. Client-side Zod validation blocks navigation and shows inline field errors.

---

## Phase 4: User Story 2 — Server-Side Summary with Jump Links (Priority: P1)

**Goal**: Entering the summary page triggers a server validation call. WizardSummary renders grouped errors and warnings with working "Go to page" and "Go to field" jump links.

**Independent Validation**: In the demo wizard, navigate through all pages to krok-4 (summary). The summary page must show a red status alert, one error group for `krok-1` with a "Go to field" button for `tytul`, one warning for `opis` under its page group, and `acceptButtons` must be hidden (errors present). Clicking "Go to field" must navigate to krok-1 and scroll to the tytul input.

### Implementation for User Story 2

- [x] T008 [P] [US2] Create `src/components/wizard/WizardSummary.tsx` as a `'use client'` component — read `summary`, `validation`, `mapping`, `setPageByName`, and `acceptButtons` from `useWizard()`; derive status (`hasErrors` checks both `summary.error` and `summary.dicts_msg?.error`; `hasWarnings` checks `validation` for warning type); render a shadcn `<Alert>` at the top matching the status; group validation items by page by filtering `validation` against each page's `mapping.fields`; render per-page groups with a "Przejdź do strony" `<Button variant="outline" size="sm">` that calls `setPageByName(page.name)` and per-field buttons "Przejdź do pola" that call `setPageByName(page.name, page.name + '.' + item.key)`; render `acceptButtons(summary)` at the bottom only when `!hasErrors`; do NOT render the dicts_msg section yet (added in US3)
- [x] T009 [P] [US2] In `src/components/wizard/WizardProvider.tsx`, wire the `validationUrl` fetch after `setPage(toPage)`: if `pages[toPage].isSummaryPage` and `validationUrl` exist, `await fetch(validationUrl)`, parse the JSON as `SummaryResult`, call `setSummary(result)` and `setWizardValidation(name, parseSummaryResult(result))`; wrap in try/catch (non-blocking — on error, leave summary as null); import `parseSummaryResult` from `@/lib/wizard/validation`
- [x] T010 [P] [US2] Update the MSW demo validation fixture in `src/mocks/handlers/wizard.ts` — locate the `createWizardValidationHandler` call for `/api/wizard-demo/validate` and set its fixture to: `{ error: { tytul: ['Tytuł jest wymagany i musi mieć co najmniej 3 znaki.'] }, warning: { opis: ['Opis jest bardzo krótki. Rozważ dodanie więcej szczegółów.'] }, dicts_msg: { error: { formularz: ['Formularz zawiera błędy, które muszą zostać poprawione przed zapisem.'] }, warning: {} } }`
- [x] T011 [US2] In `src/app/wizard-demo/page.tsx`, add a fourth page to the pages array: `{ name: 'krok-4', isSummaryPage: true, form: <WizardSummary /> }`; add `validationUrl="/api/wizard-demo/validate"` and `acceptButtons={(summary) => <Button>Wyślij</Button>}` to both the edit and view wizard config props; add `import { WizardSummary } from '@/components/wizard/WizardSummary'`
- [ ] T012 [US2] Verify T008–T011: navigate to krok-4 in the demo — confirm the status alert is red, the tytul error group shows for krok-1 with "Przejdź do pola" button, the opis warning group shows, acceptButtons is hidden; click "Przejdź do pola" for tytul — confirm navigation to krok-1 and scroll to the tytul field; fix tytul, navigate back to krok-4 — confirm acceptButtons appears when no errors remain

**Checkpoint**: US2 is fully functional. Server summary validation with grouped jump links works end-to-end.

---

## Phase 5: User Story 3 — Dictionary-Level Errors (Priority: P2)

**Goal**: `SummaryResult.dicts_msg` errors render in a dedicated "Błędy systemowe" section below the per-field groups in WizardSummary, without jump buttons.

**Independent Validation**: With the current MSW fixture (already includes `dicts_msg.error.formularz`), navigate to krok-4 — a "Błędy systemowe" section must appear below the per-page groups with the formularz error message and no "Przejdź do pola" button.

### Implementation for User Story 3

- [x] T013 [US3] In `src/components/wizard/WizardSummary.tsx`, add the dicts_msg section: after the per-page groups, check if `Object.keys(summary?.dicts_msg?.error ?? {}).length > 0` or warnings; if so, render a section with heading "Błędy systemowe" (or "Ostrzeżenia systemowe" for warnings-only) and a list of messages — no jump buttons; the dicts_msg warning entries follow the same de-duplication rule (suppress warning if the same key has an error)
- [ ] T014 [US3] Verify T013: navigate to krok-4 in the demo — confirm the "Błędy systemowe" section appears with the formularz message, no jump button is rendered for it, and it is visually distinct from the per-field error groups

**Checkpoint**: US3 complete. All three WizardSummary sections (field errors, field warnings, dicts_msg) render correctly.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: UI quality, theme parity, and responsiveness pass across all deliverables.

- [x] T015 [P] Review all Polish-language strings in `src/components/wizard/WizardSummary.tsx` for correctness and consistency with existing wizard copy
- [ ] T016 [P] Verify `WizardSummary` renders correctly in dark mode: toggle theme in the demo, confirm the Alert variants, Button styles, and section headings maintain proper contrast and colour
- [ ] T017 Verify `WizardSummary` on mobile viewport (375px width): confirm no horizontal overflow, buttons are tappable, and grouped sections stack cleanly
- [x] T018 Run `pnpm build` and resolve any TypeScript errors in `validation.ts`, `WizardProvider.tsx`, `WizardSummary.tsx`, and `wizard-demo/page.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — T002, T003, T004 can all run in parallel with each other
- **US1 (Phase 3)**: Depends on Phase 2 (T002, T004) — T005 and T006 can run in parallel
- **US2 (Phase 4)**: Depends on Phase 2 (T002, T003, T004) — T008, T009, T010 can all run in parallel; T011 depends on T008 and T009 completing
- **US3 (Phase 5)**: Depends on T008 (WizardSummary must exist) and T010 (fixture must have dicts_msg)
- **Polish (Phase 6)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1** and **US2** are independent of each other — they can be worked in parallel after Phase 2 completes
- **US3** depends on US2 (adds to WizardSummary)

### Within Each User Story

- US1 is 2 parallel tasks + 1 verification
- US2 is 3 parallel tasks + 1 sequential integration + 1 verification
- US3 is 1 implementation task + 1 verification

### Parallel Opportunities

| Parallel Set | Tasks | Condition |
|---|---|---|
| Foundation setup | T002, T003, T004 | After T001 |
| US1 + US2 story work | T005–T006 with T008–T010 | After Phase 2 |
| Within US2 | T008, T009, T010 | After Phase 2 |
| Polish | T015, T016 | After all stories |

---

## Notes

- [P] tasks touch different files and have no incomplete task dependencies
- [Story] labels map each task to its user story for independent traceability
- US1 and US2 can be executed in parallel by separate agents after Phase 2 completes
- `WizardSummary.tsx` is the most complex single task (T008) — estimate ~80 lines including all three sections (field groups, dicts_msg, acceptButtons)
- T009 (validationUrl wiring in WizardProvider) is the riskiest edit — the existing `nav` function must remain correct for non-summary pages
