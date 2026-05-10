# Feature Specification: Wizard System — Phase 1 Foundation

**Feature Branch**: `006-wizard-foundation`
**Created**: 2026-05-10
**Status**: Draft
**Input**: Phase 1 of Wizard System design — global Zustand store, WizardProvider engine, Wizard shell with vertical side nav and navigation

## User Scenarios *(mandatory)*

### User Story 1 — Developer wires up a multi-step form (Priority: P1)

A developer building a multi-step form in the CI-PRS platform drops in the `<Wizard>` component, provides a list of pages, and gets a fully navigable shell with a vertical side nav and Back/Next buttons — without writing any navigation logic.

**Why this priority**: This is the core deliverable of Phase 1. Everything else depends on the wizard shell existing and being navigable.

**Independent Validation**: A developer can render a 3-page wizard stub in the browser, click Next and Back, and see the correct page render each time.

**Acceptance Scenarios**:

1. **Given** a `<Wizard>` with 3 pages configured, **When** the page first renders, **Then** the first page is shown and the side nav highlights the first step
2. **Given** the first page is active, **When** the developer clicks "Next", **Then** the second page renders and the side nav updates to highlight step 2
3. **Given** the second page is active, **When** the developer clicks "Back", **Then** the first page renders and the side nav returns to step 1
4. **Given** the last page is active, **When** it renders, **Then** there is no "Next" button

---

### User Story 2 — Form state persists as the user moves between pages (Priority: P1)

A user fills in data on page 1, navigates to page 2, then goes back to page 1. Their entered data is still there — it was not lost on navigation.

**Why this priority**: Without state persistence, the wizard is unusable. All form data must survive page navigation.

**Independent Validation**: Enter text on page 1, navigate to page 2, navigate back — the field still contains the entered value.

**Acceptance Scenarios**:

1. **Given** data entered on page 1, **When** the user navigates to page 2 and back, **Then** the page 1 data is unchanged
2. **Given** data on multiple pages, **When** the user jumps directly from page 3 to page 1 via the side nav, **Then** page 1 data is preserved
3. **Given** the wizard unmounts (component removed from DOM), **When** it remounts with the same `name`, **Then** the store is cleared (fresh start)

---

### User Story 3 — Read-only view of a wizard (Priority: P2)

An operator opens a wizard in `view` mode to inspect data without being able to change it. All inputs are visually disabled and no Save button appears.

**Why this priority**: View mode is required for audit and review flows. It must be established in Phase 1 since it affects how the shell renders.

**Independent Validation**: Render a `<Wizard mode="view">` and confirm all interactive controls are disabled.

**Acceptance Scenarios**:

1. **Given** `mode="view"`, **When** the wizard renders, **Then** a "Read-only" indicator is shown instead of Save/Next-with-save buttons
2. **Given** `mode="view"`, **When** a page renders, **Then** no data can be changed (inputs would be disabled — verified in later phases when inputs exist)

### Edge Cases

- What happens when `pages` is an empty array? The wizard renders nothing — no side nav, no content.
- What happens when `name` is the same for two wizard instances? They share the same Zustand state slice — the consumer must ensure unique names.
- What happens if the user clicks a disabled side-nav item? Nothing — `disabled` pages are non-interactive.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a global Zustand store that holds wizard form state, keyed by wizard instance `name`, so multiple wizards can coexist without interference
- **FR-002**: The store MUST be connected to the Redux DevTools browser extension via Zustand devtools middleware, with labelled action names visible in the DevTools panel
- **FR-003**: The system MUST provide a `<Wizard>` component that accepts a list of pages and renders only the active page
- **FR-004**: The `<Wizard>` component MUST render a vertical side nav on the left side showing all page names; the active page MUST be visually highlighted
- **FR-005**: The `<Wizard>` component MUST render Back and Next navigation buttons; Back is hidden on the first page, Next is hidden on the last page
- **FR-006**: Navigating between pages MUST preserve all form data entered on any page
- **FR-007**: The `<Wizard>` component MUST support a `mode` prop with values `"edit"` and `"view"`; in `"view"` mode a read-only indicator replaces interactive save controls
- **FR-008**: Page components MUST be able to access wizard form state and update it via a `useWizard()` hook — no prop drilling required
- **FR-009**: The system MUST expose a `useWizard()` hook that throws a descriptive error when called outside a `<WizardProvider>`
- **FR-010**: The wizard store slice MUST be clearable by name, removing all state for a specific wizard instance on unmount

### Key Entities

- **Wizard Instance**: Identified by a unique `name` string; has a form state object and a validation state array stored in Zustand
- **WizardPage**: A configuration object with a `name`, a React element for `form`, and optional flags (`disabled`, `isSummaryPage`, `noPayload`, `calc`, `schema`)
- **WizardAPI**: The object provided by `useWizard()` — exposes `form`, `setValue`, `setForm`, `appendData`, `clearFields`, navigation helpers, and metadata
- **Global Store**: A single Zustand store instance for the entire application; the wizard slice is the first entry; future slices merge in without changing existing code

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can render a navigable multi-page wizard with 3+ pages in under 10 lines of wiring code
- **SC-002**: Form data entered on any page survives forward and backward navigation without loss across all tested scenarios
- **SC-003**: The wizard store state is visible and labelled in the Redux DevTools extension during development
- **SC-004**: The `useWizard()` hook throws a clear, actionable error message when used outside a provider — no silent failures
- **SC-005**: All TypeScript types covering the wizard config, API, and store are strict (no `any` escape hatches in public interfaces)
- **SC-006**: The Phase 1 implementation compiles without TypeScript errors and passes `pnpm lint`

---

## Assumptions

- The project uses React 19 with the `use()` hook available for context consumption
- shadcn/ui `Button` and `DropdownMenu` components are already installed in the project
- No data fetching, field input components, or validation are part of this phase — those are Phase 2 and Phase 3
- Side nav labels in Phase 1 come from the `page.name` property (server-driven labels from mapping are a Phase 2 concern)
- The wizard `name` prop is expected to be stable across re-renders; changing it at runtime is not a supported use case
- The global store is initialised once at application startup via the Zustand `create()` call; no React context Provider wrapping the app root is required
