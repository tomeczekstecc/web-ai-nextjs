# Feature Specification: Wizard Validation System

**Feature Branch**: `010-wizard-validation`
**Created**: 2026-05-10
**Status**: Draft
**Input**: Phase 4 of the wizard system design — Validation System

## User Scenarios *(mandatory)*

### User Story 1 - Client-Side Zod Validation Blocks Navigation (Priority: P1)

A developer declares a Zod schema on a `WizardPage`. When the user attempts to
navigate away (Back or Next), the engine validates the current flat form against
that schema. If validation fails, navigation is blocked and inline errors appear
on the relevant fields — the user cannot advance until the page is valid.

**Why this priority**: Preventing invalid data from reaching the summary or
server is the primary safety guarantee of the wizard. Without this, all downstream
validation is moot. Every page author who declares a schema depends on this
working correctly.

**Independent Validation**: Add a Zod schema to the demo wizard's first page
requiring `title` to be a non-empty string of at least 3 characters. Submit the
page with a blank title — navigation must be blocked and a visible error must
appear on the `title` field.

**Acceptance Scenarios**:

1. **Given** a `WizardPage` has a `schema` and the user clicks Next with invalid
   data, **When** the engine validates the form, **Then** navigation is blocked
   and `ValidationItem` entries for the failing fields appear in Zustand.
2. **Given** validation errors are present, **When** a Wiz component for a
   failing field is rendered, **Then** it shows a red border and inline error
   message.
3. **Given** the user corrects all errors and clicks Next again, **When** the
   engine re-validates, **Then** navigation proceeds and validation errors are
   cleared.
4. **Given** a `WizardPage` has no `schema`, **When** the user clicks Next,
   **Then** navigation proceeds without any validation check.

---

### User Story 2 - Server-Side Summary Validation with Jump Links (Priority: P1)

When the user reaches the summary page, the wizard calls the server's
`validationUrl`. The server returns a structured result containing field-level
errors and warnings grouped by page. The `WizardSummary` component renders a
status alert, groups errors and warnings by page with "Go to page" buttons, and
provides "Go to field" jump links that scroll directly to the affected field.

**Why this priority**: The summary page is the final gate before submission.
Server-side validation catches cross-field and business-rule errors that
client-side Zod schemas cannot. Jump links make the feedback actionable rather
than just informational.

**Independent Validation**: Wire the demo wizard's summary page to the MSW
`validationUrl` handler that returns a fixture error on `title` (page `start`).
The summary must render a red status alert, show a "Go to page" button for
`start`, and a "Go to field" button for `title` that navigates to the start page
and scrolls to the title field.

**Acceptance Scenarios**:

1. **Given** the wizard enters a summary page, **When** the `validationUrl` call
   returns a 422 with errors, **Then** `WizardSummary` shows a red status alert
   and lists errors grouped by page.
2. **Given** the summary shows errors, **When** the user clicks "Go to page",
   **Then** the wizard navigates to that page.
3. **Given** the summary shows a field error, **When** the user clicks "Go to
   field", **Then** the wizard navigates to the page and scrolls to the field's
   scroll anchor.
4. **Given** the same field key has both an error and a warning, **When**
   `WizardSummary` renders, **Then** only the error is shown (warning is
   de-duplicated).
5. **Given** the `validationUrl` returns no errors, **When** `WizardSummary`
   renders, **Then** a green success alert is shown and `acceptButtons` are
   rendered.

---

### User Story 3 - Dictionary-Level Errors (Priority: P2)

The server returns `dicts_msg` alongside field-level errors — these are
entity-level or business-rule messages that cannot be attributed to a single
field. `WizardSummary` renders them in a dedicated section at the bottom,
separate from per-field errors and warnings.

**Why this priority**: Business-rule errors that span multiple fields would be
lost without a dedicated display area. This is a required feature of the original
reference implementation.

**Independent Validation**: Update the MSW fixture to include a `dicts_msg`
error keyed to the task entity. Verify it appears in its own section below the
per-field errors without a "Go to field" jump link.

**Acceptance Scenarios**:

1. **Given** the server response includes `dicts_msg.error` entries, **When**
   `WizardSummary` renders, **Then** a "Dictionary errors" section appears below
   the per-field section.
2. **Given** `dicts_msg` is absent or empty, **When** `WizardSummary` renders,
   **Then** no dictionary errors section is shown.

### Edge Cases

- What happens when `validationUrl` is not configured? The wizard skips the
  server call and `WizardSummary` shows a success state with no server errors.
- What happens when the `validationUrl` call fails with a network error? A
  non-blocking toast is shown; the summary page still renders with partial state.
- What happens when a server error references a field that has no scroll anchor
  (e.g., the field is hidden or not rendered on any page)? The "Go to field"
  button navigates to the page but does not scroll.
- What happens when errors reference a page name not present in the current
  mapping? Those errors are rendered under an "Unknown page" fallback group.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a `validation.ts` module with a Zod runner that
  executes a `WizardPage.schema` against the flat form and returns `ValidationItem[]`.
- **FR-002**: System MUST provide a `parseSummaryResult` function that converts a
  server 422 response body (`SummaryResult`) into `ValidationItem[]` grouped by page.
- **FR-003**: `WizardProvider` MUST run the page schema on every Back/Next
  navigation attempt and block navigation when the schema fails.
- **FR-004**: `WizardProvider` MUST call `validationUrl` when the user navigates
  to a page with `isSummaryPage: true` and write the result to context.
- **FR-005**: System MUST provide a `WizardSummary` component that renders a
  status alert (error / warning / success), per-page error and warning groups,
  "Go to page" buttons, and "Go to field" jump buttons.
- **FR-006**: `WizardSummary` MUST de-duplicate warnings when the same field key
  already has an error entry.
- **FR-007**: `WizardSummary` MUST render dictionary-level errors (`dicts_msg`)
  in a dedicated section when present.
- **FR-008**: `WizardSummary` MUST render `acceptButtons` only when the summary
  result contains no errors.
- **FR-009**: Each Wiz component MUST display its validation error (set by either
  client Zod or server 422) via the `ValidationWrapper` scroll anchor so that
  jump-to-field navigation works.
- **FR-010**: The MSW demo handler for `validationUrl` MUST return a fixture
  `SummaryResult` with at least one error, one warning, and one `dicts_msg` entry.

### Key Entities

- **ValidationItem**: `{ page: string, field: string, message: string, type: 'error' | 'warning' }` — the normalized representation of any validation result, whether from Zod or a server 422.
- **SummaryResult**: The raw server 422 body shape: `{ error: Record<string, string[]>, warning: Record<string, string[]>, dicts_msg?: { error: Record<string, string[]>, warning: Record<string, string[]> } }`.
- **WizardSummary**: Page-level component that reads `summary` and `validation` from `useWizard()` and renders a structured validation report.
- **validation.ts**: Pure utility module — no React, no hooks — containing the Zod runner and `parseSummaryResult`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A page with a failing Zod schema blocks navigation in one user
  action and shows inline errors on all failing fields without any validation
  logic in the page component itself.
- **SC-002**: Clicking a "Go to field" jump link in the summary delivers the user
  to the exact field in one interaction — no manual scrolling required.
- **SC-003**: The summary page correctly de-duplicates all warning entries where
  an error for the same field exists, resulting in zero duplicate messages.
- **SC-004**: `WizardSummary` renders a passing state (green alert + accept
  buttons) when the server returns no errors.
- **SC-005**: The complete validation flow — client Zod block → correction →
  server summary → jump-to-field → fix → accept — is achievable without
  leaving the wizard or refreshing the page.

## Assumptions

- Phases 1, 2, and 3 are complete: `WizardProvider`, `useWizard`, Zustand slice,
  TanStack Query hooks, and all five Wiz input components are available.
- `ValidationItem` and `SummaryResult` types are already declared in
  `src/lib/wizard/types.ts` (established in Phase 1).
- The `ValidationWrapper` scroll anchor convention (`id={pageKey + '.' + field}`)
  is already implemented in the Wiz components from Phase 3.
- `parseSummaryResult` must handle the operator-precedence bug from the reference
  implementation where warnings were merged incorrectly; the correct logic groups
  errors and warnings separately before de-duplication.
- The server 422 response uses dot-notation field paths (e.g., `start.title`)
  that `parseSummaryResult` splits into `{ page, field }`.
- `acceptButtons` is a render prop on `WizardConfig` (established in Phase 1
  types); this phase wires it to the `WizardSummary` output.
