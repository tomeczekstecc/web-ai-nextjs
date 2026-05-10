# Research: Tasks Showcase Module (Phase 6)

## Summary

Phase 6 builds a self-contained task management mini-app that is the canonical reference consumer of the wizard engine. All engine code is done. This phase creates: fixture data, MSW handlers, 5 wizard page components, a `TasksWizard` config component, and 4 Next.js App Router routes. One existing file (`src/app/wizard-demo/page.tsx`) is replaced.

---

## Decision: MSW handler strategy

**Decision:** Use existing wizard handler factories for wizard endpoints; write custom `http.get` handlers for task-specific endpoints that don't fit the factory pattern.

**Rationale:** The four wizard factories (`createWizardMappingHandler`, `createWizardDataHandler`, `createWizardSaveHandler`, `createWizardValidationHandler`) cover the wizard-specific URLs perfectly. Three additional task-specific endpoints need custom handlers:
- `GET /api/tasks/wizard/data/:id` — parameterized URL (factory only handles fixed URLs)
- `GET /api/tasks/list` — returns task list array, not wizard data
- `GET /api/tasks/dict/types` and `/api/tasks/dict/assignees` — returns option arrays for dropdowns

All fixture data lives in `src/mocks/data/tasks-wizard.ts`. Handlers in `src/mocks/handlers/tasks-wizard.ts` import from there.

**Alternatives considered:** Extending the wizard factory to support parameterized URLs — rejected as over-engineering; a simple `http.get('/api/tasks/wizard/data/:id', ...)` handler is cleaner.

---

## Decision: `related_ids` multi-select implementation

**Decision:** Implement `RelatedPage` with a custom checkbox-list using `useWizardField('related_ids')` directly. No new Wiz component variant is created.

**Rationale:** `related_ids` is a `number[]` — not a string value like the other fields. None of the existing Wiz components handle multi-value arrays. Using `useWizardField` (the escape-hatch hook) keeps the engine untouched and follows the design spec's intent. The custom component renders a scrollable list of task checkboxes, each toggling the ID in the array.

**Alternatives considered:**
- Creating a `MultiSelectWiz` component — deferred to a future phase; overkill for one showcase field
- Using shadcn `Select` with `multiple` — shadcn's `Select` is single-value; no built-in multi-select

---

## Decision: `deadline_urgency` computed field

**Decision:** `deadline_urgency` is a computed display string derived by the `SchedulePage` calc function. Values: `'Pilne'` (< 3 days), `'Normalne'` (3–14 days), `'Spokojnie'` (> 14 days), `'Brak daty'` (no deadline set).

**Rationale:** The design doc specifies calc derives "a display label for deadline urgency" on the Schedule page. This is frontend-only — not sent to the server. The field is shown as a read-only styled badge or text in `SchedulePage`.

**Alternatives considered:** Using a numeric score instead of a string label — rejected; a human-readable string is more appropriate for a display-only derived field.

---

## Decision: Replace vs. extend `src/app/wizard-demo/page.tsx`

**Decision:** **Replace** the file. The new content is the task list page — a table of tasks with create/edit/view links. The current Phase 5 demo content (Krok1/Krok2/Krok3 wizard) becomes obsolete.

**Rationale:** The Phase 6 design doc explicitly states: "`src/app/wizard-demo/page.tsx` — task list (table of MSW tasks, links to edit/create)". The Phase 5 demo was a scaffold. Phase 6 is the real showcase.

**Alternatives considered:** Keeping the Phase 5 demo at a separate `/wizard-demo/sandbox` route — rejected; the design is clear about the replacement.

---

## Decision: `cancelCallback` behavior

**Decision:** `cancelCallback` in all edit-mode wizards calls `router.push('/wizard-demo')` to return to the task list.

**Rationale:** In Phase 5, `cancelCallback` showed a demo toast. In the real showcase, Cancel should navigate back to the list — this is the production-realistic behavior.

---

## Decision: `acceptButtons` on Summary page

**Decision:** `acceptButtons` renders a "Wyślij zadanie" (Submit task) button that is disabled when `summary.error` is non-empty, and shows a success sonner toast on click.

**Rationale:** Matches the design doc exit criteria: "submit button enabled when no errors".

---

## Decision: `saveAndQuitCallback`

**Decision:** `saveAndQuitCallback` calls `router.push('/wizard-demo')` — same as cancel but after a successful save. The "Save and Quit" dropdown item in the nav triggers save → redirect.

**Rationale:** Standard multi-step form behavior: save current state, then exit to list.

---

## Decision: Fixture tasks count

**Decision:** MSW fixture contains **3 pre-seeded tasks** for the list. Task IDs: 1, 2, 3. Task 1 has type `'złożone'` (complex, assignee shown). Task 2 has type `'personal'` (assignee hidden). Task 3 is a third variant.

**Rationale:** Enough variety to demonstrate the `hide` behavior (type=personal hides assignee) and the edit pre-fill. Three rows keep the table readable in demo mode.

---

## Decision: Route structure

**Decision:** Four routes under `src/app/wizard-demo/`:

| Route | File | Mode |
|-------|------|------|
| `/wizard-demo` | `page.tsx` | Task list |
| `/wizard-demo/new` | `new/page.tsx` | Create wizard (edit mode) |
| `/wizard-demo/[id]` | `[id]/page.tsx` | Edit wizard |
| `/wizard-demo/[id]/view` | `[id]/view/page.tsx` | View wizard |

All wizard pages are `'use client'` (they use `useRouter` for navigation and `useParams` for ID extraction).

**Alternatives considered:** Using a parallel route or a modal for create — rejected; separate routes are simpler and match the design doc.
