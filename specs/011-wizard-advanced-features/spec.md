# Feature Specification: Wizard Advanced Features (Phase 5)

**Feature Branch**: `011-wizard-advanced-features`
**Created**: 2026-05-10
**Status**: Draft
**Input**: Phase 5 of the wizard design — calc, clearFields, appendData, acceptButtons, customButtons, cancelCallback

## User Scenarios *(mandatory)*

### User Story 1 - Computed fields update automatically (Priority: P1)

As a wizard page author, I want derived/computed fields to recalculate whenever a controlling field changes, so that dependent display values stay in sync without any manual coordination.

**Why this priority**: The `calc` function is the primary mechanism for reactive derived state across wizard pages. Without it, pages must manually update multiple fields or rely on side effects.

**Independent Validation**: Given a wizard page with a `calc` function defined, when any field value changes, the computed fields update immediately and are reflected in the form state.

**Acceptance Scenarios**:

1. **Given** a `WizardPage` with `calc: (form) => ({ ...form, urgency: computeUrgency(form.deadline) })`, **When** the user changes `deadline`, **Then** `urgency` in the flat form is updated automatically without the page author calling `setValue` manually.
2. **Given** a calc that zeroes out a dependent field when a controlling field changes value, **When** the controlling field changes, **Then** the dependent field is cleared in the same render cycle.
3. **Given** a `WizardPage` with no `calc` defined, **When** any field value changes, **Then** the form state updates as normal with no side effects.

---

### User Story 2 - Reset dependent fields on controlling value change (Priority: P2)

As a wizard page author, I want to clear a set of form fields programmatically, so that stale dependent data is removed when a controlling field changes (e.g., clearing `assignee_id` when `type` changes to `'personal'`).

**Why this priority**: Without `clearFields`, page authors must call `setValue` for each field individually, making the code verbose and error-prone when field lists change.

**Independent Validation**: Calling `clearFields(['assignee_id', 'notes'])` removes those keys from the flat form state and the wizard stores the updated form.

**Acceptance Scenarios**:

1. **Given** a form with `assignee_id = 5` and `notes = 'hello'`, **When** `clearFields(['assignee_id', 'notes'])` is called, **Then** both keys are removed (or set to `undefined`) from the flat form.
2. **Given** `clearFields` is called with an empty array, **When** executed, **Then** the form state is unchanged.

---

### User Story 3 - Merge supplementary data into wizard form (Priority: P2)

As a wizard page component, I want to merge additional data fetched by my own query into the wizard form, so that fields sourced from a secondary endpoint appear in the flat form alongside user-entered fields.

**Why this priority**: Some wizard pages need to pre-populate read-only fields fetched from a side-channel (e.g., a lookup by ID). `appendData` provides a safe way to do this without replacing the entire form.

**Independent Validation**: Calling `appendData({ related_label: 'Task A' })` adds the key to the flat form without overwriting other existing keys.

**Acceptance Scenarios**:

1. **Given** a form with `{ title: 'T1', type: 'bug' }`, **When** `appendData({ related_label: 'Task A', status: 'open' })` is called, **Then** the form becomes `{ title: 'T1', type: 'bug', related_label: 'Task A', status: 'open' }`.
2. **Given** `appendData` is called with a key that already exists in the form, **When** executed, **Then** the new value overwrites the existing one (shallow merge semantics).

---

### User Story 4 - Submit action appears only when validation passes (Priority: P1)

As a wizard consumer (page author using the wizard engine), I want to render custom submit button(s) on the last wizard page only when there are no validation errors, so that users cannot accidentally submit invalid data.

**Why this priority**: The `acceptButtons` render prop is the primary integration point for the actual submission action — it must be guarded by the validation result.

**Independent Validation**: The `acceptButtons` prop receives the current `SummaryResult | null` and is rendered only on the last wizard page. When errors exist, the render prop can conditionally hide the button; when none remain, it renders the submit button.

**Acceptance Scenarios**:

1. **Given** `isSummaryPage: true` and `acceptButtons` defined, **When** the wizard reaches the summary page with no errors, **Then** the `acceptButtons` render output is visible below the summary.
2. **Given** the summary page has at least one validation error, **When** the `acceptButtons` render prop is provided, **Then** the `summary` argument passed to it contains the errors and the consumer can hide or disable the submit button.
3. **Given** the wizard is not on the last page, **When** navigating, **Then** `acceptButtons` output is not rendered.

---

### User Story 5 - Additional last-page actions alongside submit (Priority: P3)

As a wizard consumer, I want to render secondary action buttons on the last page alongside the submit button, so that actions like "Save as Draft" or "Export" are available at the final step.

**Why this priority**: `customButtons` is a secondary extension point. The primary value is `acceptButtons`; this story addresses the secondary slot for other actions.

**Independent Validation**: The `customButtons` render prop output appears alongside `acceptButtons` output on the last wizard page only.

**Acceptance Scenarios**:

1. **Given** `customButtons` is defined, **When** the wizard is on the last page, **Then** both `customButtons` and `acceptButtons` outputs render.
2. **Given** `customButtons` is not defined, **When** on the last page, **Then** only `acceptButtons` renders (no empty slot).

---

### User Story 6 - Cancel navigates away from the wizard (Priority: P2)

As a wizard user in edit mode, I want a "Cancel" button to exit the wizard without saving, so that I can abandon changes without being trapped in the multi-step form.

**Why this priority**: Without `cancelCallback`, users have no way to leave the wizard mid-way without browser navigation, breaking the UX contract of multi-step forms.

**Independent Validation**: Clicking the Cancel button in edit mode invokes `cancelCallback` once. In view mode, no Cancel button is shown.

**Acceptance Scenarios**:

1. **Given** `mode === 'edit'` and `cancelCallback` is defined, **When** the user clicks the Cancel button, **Then** `cancelCallback()` is invoked once.
2. **Given** `mode === 'view'`, **When** rendering the wizard, **Then** no Cancel button is shown.
3. **Given** `cancelCallback` is not provided, **When** in edit mode, **Then** the Cancel button is either hidden or no-op.

---

### Edge Cases

- What happens when `calc` throws an error? The engine should not crash — the form update proceeds without the `calc` result and the error surfaces to the console.
- What happens when `clearFields` is called with keys that do not exist? No-op; form state unchanged.
- What happens when `appendData` receives an empty object? No-op; form state unchanged.
- What happens when `acceptButtons` is undefined on the last page? No action buttons are rendered on the summary page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The wizard engine MUST execute `WizardPage.calc(form)` synchronously after every `setValue` call and write the returned object back to the flat form state.
- **FR-002**: The wizard engine MUST expose `clearFields(fields: (keyof T)[])` on the `WizardAPI`, removing the specified keys from the current flat form state.
- **FR-003**: The wizard engine MUST expose `appendData(data: Record<string, unknown>)` on the `WizardAPI`, shallow-merging the provided object into the current flat form state.
- **FR-004**: The `Wizard` shell MUST render the `acceptButtons(summary)` render prop output exclusively on the last wizard page (the page with `isSummaryPage: true` or the last entry in `pages`).
- **FR-005**: The `Wizard` shell MUST render the `customButtons()` render prop output on the last wizard page alongside `acceptButtons`.
- **FR-006**: The `Wizard` shell MUST render a "Cancel" button in `edit` mode. Clicking it MUST invoke `cancelCallback()` if provided; if not provided, the button MUST be hidden or inert.
- **FR-007**: `calc` is optional per `WizardPage`. If absent, `setValue` updates the form state without any additional transformation.
- **FR-008**: All new `WizardAPI` methods (`clearFields`, `appendData`) MUST be typed with the generic form type `T`.
- **FR-009**: The demo page MUST be updated to demonstrate `calc`, `hide` prop, `acceptButtons`, and a complete submit flow.

### Key Entities

- **WizardPage.calc**: Optional `(form: T) => T` function defined per page. Runs synchronously after each `setValue`. Produces the next form state.
- **WizardAPI.clearFields**: Method that takes an array of form keys and removes them from the flat store entry.
- **WizardAPI.appendData**: Method that takes a partial object and shallow-merges it into the flat store entry.
- **WizardConfig.acceptButtons**: Render prop `(summary: SummaryResult | null) => React.ReactNode`. Rendered only on the last page.
- **WizardConfig.customButtons**: Render prop `() => React.ReactNode`. Rendered only on the last page alongside `acceptButtons`.
- **WizardConfig.cancelCallback**: `() => void`. Invoked when the user clicks Cancel in edit mode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All `WizardConfig` props defined in the design (`calc`, `clearFields`, `appendData`, `acceptButtons`, `customButtons`, `cancelCallback`) are wired and functional.
- **SC-002**: The wizard engine is feature-complete — no `WizardConfig` prop is left as a stub or no-op when it should have behavior.
- **SC-003**: The demo page demonstrates every Phase 5 feature at least once, so a developer can verify each behavior by interacting with the UI.
- **SC-004**: No regressions in Phases 1–4 behavior: navigation, data fetch, save, field components, and validation all continue to work after Phase 5 changes.

## Assumptions

- The wizard engine from Phases 1–4 (store, provider, hooks, field components, validation) is implemented and working.
- `calc` errors are non-fatal; form state should not be corrupted if `calc` throws.
- `acceptButtons` visibility logic (show only when no errors) is the consumer's responsibility — the engine passes `summary` and renders whatever the render prop returns.
- The demo page used is `src/app/wizard-demo/` with the multi-step task form from Phase 6 planned later; Phase 5 updates the existing demo page.
- No new shadcn/ui components are needed for Phase 5; existing components from prior phases are sufficient.
