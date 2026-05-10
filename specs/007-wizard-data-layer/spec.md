# Feature Specification: Wizard Data Layer

**Feature Branch**: `007-wizard-data-layer`
**Created**: 2026-05-10
**Status**: Draft
**Input**: Phase 2 of the wizard system design — Data Layer (TanStack Query + MSW)

## User Scenarios *(mandatory)*

### User Story 1 - Wizard Labels From Server (Priority: P1)

A developer wiring up a wizard sees page nav labels that come from the server
mapping response rather than being hardcoded. When the MSW fixture returns a
`PageMapping[]` array, the side nav automatically reflects those labels without
any manual configuration in the page file.

**Why this priority**: Server-driven labels are the foundational data contract
between backend and wizard engine. Every subsequent feature depends on mapping
being available.

**Independent Validation**: Navigating to the demo wizard page in development
shows side-nav pills whose text matches the labels in the MSW mapping fixture.

**Acceptance Scenarios**:

1. **Given** the wizard mounts with a `mappingUrl`, **When** MSW returns the
   mapping fixture, **Then** the side nav pills display the server-provided
   labels for all pages.
2. **Given** the mapping request is in-flight, **When** the wizard is rendered,
   **Then** a loading state is shown and the nav is non-interactive.
3. **Given** the mapping request fails, **When** the wizard renders, **Then**
   an error state is communicated to the user.

---

### User Story 2 - Form Pre-fill From Data Fetch (Priority: P1)

A developer opening an existing record in the wizard sees fields pre-populated
with the data returned by `dataUrl`. The Zustand store is written on success,
so navigating between pages preserves the pre-filled values.

**Why this priority**: Without pre-fill, edit mode is indistinguishable from
create mode and the data layer is incomplete.

**Independent Validation**: Navigating to the demo wizard page pre-fills all
form fields with the values from the MSW data fixture.

**Acceptance Scenarios**:

1. **Given** the wizard mounts with a `dataUrl`, **When** MSW returns the data
   fixture, **Then** all pre-filled field values appear in the correct form
   controls.
2. **Given** the user navigates between pages, **When** returning to a
   previously filled page, **Then** the pre-filled values are still present.
3. **Given** the data fetch is in-flight, **When** the wizard renders, **Then**
   form inputs are in a loading/disabled state until data is available.

---

### User Story 3 - Save Fires PUT and Shows Toast (Priority: P1)

A developer clicks Save while in edit mode and sees a success toast. The wizard
sends the full flat form as a `PUT` request to `saveUrl`. The same mutation is
triggered automatically on page navigation when `saveOnPageChange` is enabled.

**Why this priority**: Save is the primary write path and the core interaction
proof for the data layer.

**Independent Validation**: Clicking Save in the demo wizard fires a PUT to the
MSW save handler and a sonner success toast appears.

**Acceptance Scenarios**:

1. **Given** the wizard is in edit mode, **When** the user clicks Save, **Then**
   a PUT is sent to `saveUrl` with the full flat form payload, and a sonner
   success toast appears.
2. **Given** `saveOnPageChange: true` and mode is `edit`, **When** the user
   navigates to the next page, **Then** a save is automatically triggered before
   navigation completes.
3. **Given** the user clicks "Save and Quit", **When** the save succeeds,
   **Then** `saveAndQuitCallback()` is invoked.
4. **Given** the save fails, **When** the request returns an error, **Then**
   a failure toast or error state is shown and navigation is not blocked.

### Edge Cases

- What happens when `saveUrl` is undefined? Save button should be hidden or
  disabled; no mutation is dispatched.
- What happens when the data fetch returns an empty object? Form fields start
  empty — same as create mode.
- What happens when `saveOnPageChange` is true but mode is `view`? Auto-save
  must NOT fire.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch field mapping from `mappingUrl` on wizard mount
  and cache the result for the lifetime of the wizard.
- **FR-002**: System MUST populate Zustand form state from the `dataUrl` response
  on wizard mount.
- **FR-003**: System MUST expose a save mutation that sends a `PUT` to `saveUrl`
  with the full flat form as payload.
- **FR-004**: System MUST show a sonner success toast when the save mutation
  succeeds.
- **FR-005**: System MUST auto-save on page navigation when `saveOnPageChange`
  is `true` and mode is `edit`.
- **FR-006**: System MUST invoke `saveAndQuitCallback` after a successful
  save-and-quit action.
- **FR-007**: MSW handler factories MUST be provided for mapping, data, save,
  and validation endpoints so any consumer can register their own mock data.
- **FR-008**: Side nav labels MUST reflect the server-returned `PageMapping`
  labels once the mapping fetch resolves.
- **FR-009**: System MUST surface loading state while mapping or data is
  in-flight and not allow navigation until data is ready.

### Key Entities

- **PageMapping**: Per-page descriptor returned by `mappingUrl`; contains page
  `name`, `label`, and `fields: FieldMeta[]`.
- **FieldMeta**: Per-field descriptor with `name`, `label`, `type`, `lp`,
  `display`, optional `max`, optional `decimal`.
- **WizardEntry (Zustand)**: Keyed by wizard `name`; holds `form` (flat
  key-value) and `meta.validation`.
- **SavePayload**: Full flat form object sent as the PUT body to `saveUrl`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Side nav labels reflect server mapping within one network round-trip
  — no hardcoded label strings remain in the wizard shell.
- **SC-002**: All form fields are pre-populated from the data fixture when the
  demo wizard loads in development mode.
- **SC-003**: Clicking Save in the demo wizard produces a visible sonner toast
  and a PUT request visible in the MSW request log.
- **SC-004**: Auto-save on navigation is verifiable by observing a PUT request
  in the MSW log each time the user moves between pages in edit mode.
- **SC-005**: Any future wizard consumer can register its own MSW handlers by
  calling the four exported factory functions — no wizard internals need to be
  modified.

## Assumptions

- Phase 1 (store + engine core) is already merged and `WizardProvider`,
  `useWizard`, and the Zustand wizard slice are available.
- TanStack Query is already installed and a `QueryClientProvider` wraps the app.
- MSW is already configured in the project for development mocking.
- The sonner toast library (`sonner`) is already available via shadcn/ui.
- The demo page created in Phase 1 (`/wizard-demo`) will be updated — not
  replaced — to wire the real URLs.
- `saveOnPageChange` auto-save does not fire in `view` mode.
- Save-and-quit failure handling defers to the same error toast pattern as
  a regular save failure.
