# Feature Specification: Wizard Field Input Components

**Feature Branch**: `009-wizard-field-inputs`
**Created**: 2026-05-10
**Status**: Draft
**Input**: Phase 3 of the wizard system design — Field Input Components

## User Scenarios *(mandatory)*

### User Story 1 - One-Line Field Binding (Priority: P1)

A developer building a wizard page writes a single line per field — no labels
to translate, no validation state to manage, no disabled-mode logic to wire. The
component reads the server-mapped label, handles view-mode disabling, and shows
inline validation feedback entirely on its own.

**Why this priority**: This is the developer-facing API that all wizard page
authors will use. If the ergonomics are wrong, every wizard consumer is affected.
It is the primary deliverable of this phase.

**Independent Validation**: In the demo wizard, replace the raw `<input>` in
Krok 1 with `<InputWiz keyName="tytul" />`. The field should display the label
from the server mapping ("Tytuł"), write to Zustand on change, and show no
label or disabled state code in the page file.

**Acceptance Scenarios**:

1. **Given** a wizard page with `<InputWiz keyName="tytul" />`, **When** the
   mapping resolves, **Then** the label "Tytuł" appears above the input without
   any manual label code in the page file.
2. **Given** a wizard in view mode, **When** a Wiz component is rendered,
   **Then** the input is visually disabled and uneditable.
3. **Given** a field has a validation error, **When** the Wiz component renders,
   **Then** a red border and error message appear inline below the input without
   any `ValidationWrapper` import in the page file.

---

### User Story 2 - Hide Prop and Display Control (Priority: P1)

A developer conditionally hides a field based on form state by passing a `hide`
prop. Fields whose server mapping has `display: false` are also hidden
automatically. Hidden fields leave no empty space in the layout.

**Why this priority**: Conditional visibility is required for the assignment page
of the reference showcase (Phase 6). It must be built into the component contract
from the start.

**Independent Validation**: In the demo, add `<RadioWiz keyName="priority"
hide={form.type === 'personal'} options={priorityOptions} />` and verify the
field disappears entirely when `type` equals `'personal'`.

**Acceptance Scenarios**:

1. **Given** `hide={true}`, **When** a Wiz component renders, **Then** the
   component returns nothing and leaves no DOM element.
2. **Given** `getDisplay()` returns `false` for a field, **When** the Wiz
   component renders, **Then** the component is hidden without any `hide` prop
   in the page file.
3. **Given** `hide={false}`, **When** a Wiz component renders, **Then** the
   component is visible and fully interactive.

---

### User Story 3 - Custom Input Escape Hatch (Priority: P2)

A developer needing a field type not covered by the five Wiz components uses
`useWizardField(keyName)` directly to get label, value, onChange, hidden,
disabled, and error. They render their own custom UI with full control.

**Why this priority**: Without this escape hatch, any custom or composite input
would force the developer to duplicate the label/validation/disable logic that
is already encapsulated in the hook.

**Independent Validation**: In the demo, build a custom star-rating input using
`useWizardField('rating')` and verify it reads the server label, writes to form
state, and disables in view mode — all from the hook, with no direct `useWizard`
import in that component.

**Acceptance Scenarios**:

1. **Given** `useWizardField('myField')` is called inside a custom component,
   **When** the mapping resolves, **Then** `label` equals the server-mapped
   label for that field.
2. **Given** the wizard is in view mode, **When** `useWizardField` is called,
   **Then** `disabled` is `true`.
3. **Given** the field has a validation error, **When** `useWizardField` is
   called, **Then** `error` contains the error message string.
4. **Given** `hidden` is `true`, **When** the custom component checks `f.hidden`,
   **Then** it can return `null` to suppress rendering — the hook does not
   suppress itself.

### Edge Cases

- What happens when a field name passed to a Wiz component has no matching entry
  in the server mapping? The component should fall back gracefully: use `keyName`
  as the label, assume `display: true`, and remain functional.
- What happens when `options` are not provided to `SelectWiz` or `RadioWiz`?
  The component should render an empty select/group without crashing.
- What happens when a Wiz component is rendered outside a `WizardProvider`? The
  `useWizard` hook throws a descriptive error; this is the expected behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide `useWizardField(keyName)` hook that returns
  `{ label, value, onChange, hidden, disabled, error }` derived from `useWizard()`
  context without additional props.
- **FR-002**: System MUST provide `InputWiz`, `SelectWiz`, `TextareaWiz`,
  `DateTimeWiz`, and `RadioWiz` components, each self-contained with label,
  input control, and inline validation feedback.
- **FR-003**: Each Wiz component MUST read its label from the server mapping via
  `useWizardField` — no hardcoded or prop-injected labels required in page files.
- **FR-004**: Each Wiz component MUST disable itself when the wizard is in view
  mode without any prop or wrapper required in the page file.
- **FR-005**: Each Wiz component MUST accept a `hide` prop; when `true` the
  component renders nothing.
- **FR-006**: Each Wiz component MUST hide automatically when `getDisplay()`
  returns `false` for its field, even without a `hide` prop.
- **FR-007**: Each Wiz component MUST show a visual error indicator and error
  message inline when the field has a validation entry, without any
  `ValidationWrapper` import in the page file.
- **FR-008**: The internal `ValidationWrapper` component MUST render a scroll
  anchor `id` on validation failure so jump-links from the summary page work.
- **FR-009**: Each Wiz component MUST accept an optional `label` prop to override
  the server-mapped label when a custom display name is needed.
- **FR-010**: `useWizardField` MUST be exported as a public escape hatch for
  custom inputs that have no pre-built Wiz variant.

### Key Entities

- **Wiz Component**: Self-contained field control combining server label, shadcn
  input primitive, and inline validation. Accepts `keyName`, optional `hide`,
  optional `label` override, and input-specific props (`options`, `hideTime`, etc.).
- **ValidationWrapper**: Internal component (not part of the public API) that
  wraps any child element with a red border on validation hit and renders a scroll
  anchor and error alert below.
- **useWizardField result**: `{ label: string, value: unknown, onChange: (v: unknown) => void, hidden: boolean, disabled: boolean, error: string | undefined }`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A wizard page author writes at most one line per field — no label
  text, no disabled logic, no validation state — to render a fully functional
  form control.
- **SC-002**: All five Wiz component types render correctly in both light and dark
  mode without additional theme configuration in the page file.
- **SC-003**: A field with `hide={true}` leaves zero DOM nodes in the rendered
  output.
- **SC-004**: A field with an active validation error shows a visible error
  message that is reachable by the summary page jump-link within one user
  interaction.
- **SC-005**: A custom input built with `useWizardField` is indistinguishable in
  behavior from a built-in Wiz component without importing or wrapping any wizard
  infrastructure beyond the one hook call.

## Assumptions

- Phases 1 and 2 are complete: `WizardProvider`, `useWizard`, the Zustand slice,
  and the three TanStack Query hooks are available and working.
- The shadcn/ui components `Input`, `Select`, `Textarea`, `RadioGroup` are
  already installed in the project.
- A date picker shadcn component is available; if not, a plain `<input
  type="date" />` is an acceptable fallback for `DateTimeWiz`.
- `ValidationWrapper` is an implementation detail — it is never exported from
  the wizard public surface and is not imported in any page file.
- Each Wiz component accepts a single `keyName` string that matches a field name
  in the server mapping; there is no per-component type enforcement at the
  mapping level.
- `SelectWiz` and `RadioWiz` require `options` to be passed as props because the
  options list is not part of the field mapping (mapping carries metadata only).
- The demo page update in this phase is limited to replacing existing raw inputs
  with Wiz components — no new pages or mapping entries are added.
