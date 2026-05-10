# Feature Specification: Tasks Showcase Module (Phase 6)

**Feature Branch**: `012-tasks-showcase-module`
**Created**: 2026-05-10
**Status**: Draft
**Input**: Phase 6 of the wizard design — self-contained task management showcase exercising the full wizard engine

## User Scenarios *(mandatory)*

### User Story 1 - Browse task list (Priority: P1)

As a user of the application, I want to see a list of existing tasks on the main tasks page, so that I can understand what tasks exist and navigate to create or edit them.

**Why this priority**: The task list is the entry point for the entire showcase. Without it, users cannot reach the create or edit flows.

**Independent Validation**: The task list page loads and shows a table of seeded tasks with columns for title, type, priority, and deadline. Each row has links to edit and view the task.

**Acceptance Scenarios**:

1. **Given** I navigate to the tasks page, **When** the page loads, **Then** I see a table listing all seeded tasks with their titles, types, and priorities.
2. **Given** the task list is displayed, **When** I click "Nowe zadanie" (New task), **Then** I am taken to the task creation wizard.
3. **Given** a task row is visible, **When** I click the edit link, **Then** I am taken to the task edit wizard with all fields pre-filled.
4. **Given** a task row is visible, **When** I click the view link, **Then** I am taken to the read-only view of the task.

---

### User Story 2 - Create a new task through the wizard (Priority: P1)

As a user, I want to create a new task by filling in a 5-step wizard, so that I can capture all relevant task details in a structured, guided flow.

**Why this priority**: Task creation is the primary interaction for this showcase module.

**Independent Validation**: Starting from an empty form, a user can complete all 5 steps (Start, Schedule, Assignment, Related, Summary) and reach the summary page. Each page saves automatically when navigating to the next.

**Acceptance Scenarios**:

1. **Given** I open the create wizard, **When** the first page loads, **Then** the form is empty and the server-driven field labels are displayed (Title, Task Type, Description).
2. **Given** I am on the Start page, **When** I enter a title shorter than 3 characters and click Next, **Then** navigation is blocked and a validation error appears on the title field.
3. **Given** I am on the Start page with a valid title, **When** I click Next, **Then** the data is auto-saved and I advance to the Schedule page.
4. **Given** I am on the Schedule page, **When** I set a deadline, **Then** an urgency indicator (derived via calc) updates automatically to reflect how soon the deadline is.
5. **Given** I select "Personal" as the task type on Start, **When** I reach the Assignment page, **Then** the assignee field is hidden.
6. **Given** I reach the Summary page, **When** the fixture validation runs, **Then** I see at least one error with a "Go to field" link that navigates me directly to the problematic field.
7. **Given** all validation errors are resolved, **When** I click "Wyślij zadanie" (Submit task), **Then** a success notification appears.

---

### User Story 3 - Edit an existing task (Priority: P1)

As a user, I want to open an existing task in the edit wizard with all fields pre-filled, so that I can review and update the task data.

**Why this priority**: Editing pre-filled forms is a core use case that validates the data-fetch and form population behavior of the wizard engine.

**Independent Validation**: Opening a task from the list shows the edit wizard with all fields populated from the MSW fixture. The side navigation shows server-driven labels. Navigating between pages preserves edits.

**Acceptance Scenarios**:

1. **Given** I click edit on an existing task, **When** the wizard opens, **Then** all fields are populated with the task's stored data.
2. **Given** I edit a field and navigate to another page, **When** I return to the edited page, **Then** my change is still present.
3. **Given** I am in edit mode, **When** I click Cancel, **Then** I am returned to the task list with a notification that I cancelled.

---

### User Story 4 - View a task in read-only mode (Priority: P2)

As a user, I want to view a task's data in read-only mode, so that I can inspect the details without risk of accidentally modifying them.

**Why this priority**: View mode validates that the wizard correctly disables all inputs and hides the Save and Cancel buttons when in view mode.

**Independent Validation**: Opening a task in view mode shows all field values but all inputs are disabled. The side navigation is still functional. No Save or Cancel buttons appear.

**Acceptance Scenarios**:

1. **Given** I open a task in view mode, **When** the wizard loads, **Then** all inputs are disabled and display the stored values.
2. **Given** I am in view mode, **When** I look at the navigation bar, **Then** there is no Save button and no Cancel button — only a "Read-only" indicator.
3. **Given** I am in view mode, **When** I click on a page in the side navigation, **Then** I navigate to that page and all its inputs remain disabled.

---

### User Story 5 - Navigate the side navigation (Priority: P2)

As a user, I want to click any step in the side navigation to jump directly to it, so that I can quickly move between wizard pages without pressing Back/Next repeatedly.

**Why this priority**: Side navigation is the primary navigation paradigm for the wizard. Its labels must come from the server mapping fixture.

**Independent Validation**: All 5 page labels in the side nav match the fixture mapping ("Start", "Harmonogram", "Przypisanie", "Powiązane", "Podsumowanie"). Clicking each label navigates to the correct page.

**Acceptance Scenarios**:

1. **Given** the wizard is open, **When** I look at the side navigation, **Then** I see exactly 5 pills with the server-provided labels in order.
2. **Given** I am on page 2, **When** I click the pill for page 4, **Then** I navigate directly to page 4.
3. **Given** a page is marked `disabled`, **When** I click its pill, **Then** nothing happens (the pill is visually greyed out and non-interactive).

---

### Edge Cases

- What happens when the MSW data fetch fails? The wizard shows a loading state initially and an error state if the fetch times out.
- What happens when I navigate via the side nav and the current page has validation errors? Client-side Zod validation runs; if errors exist, navigation is blocked and errors are shown.
- What happens when the related_ids field is left empty? The form is valid — related tasks are optional.
- What happens when I open the create wizard with no pre-filled data and immediately navigate to Summary? Navigation should be blocked by the Start page Zod schema requiring a title.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tasks index page MUST display a list of all tasks from the MSW fixture in a table with columns: title, type, priority, deadline.
- **FR-002**: The index page MUST have a "Nowe zadanie" button that navigates to the create wizard at `/wizard-demo/new`.
- **FR-003**: Each task row MUST have links to the edit wizard (`/wizard-demo/[id]`) and the view page (`/wizard-demo/[id]/view`).
- **FR-004**: The create wizard MUST open with an empty form and server-driven field labels from the mapping fixture.
- **FR-005**: The edit wizard MUST open with all fields pre-filled from the per-task MSW fixture.
- **FR-006**: The view wizard MUST open with all fields disabled and no Save or Cancel buttons visible.
- **FR-007**: The wizard MUST auto-save on every page transition (Next/Back) in edit mode.
- **FR-008**: The Start page MUST validate `title` with Zod (required, minimum 3 characters) and block navigation on failure.
- **FR-009**: The Schedule page MUST derive an urgency category from the deadline via a `calc` function and display it as a read-only derived field.
- **FR-010**: The Assignment page MUST hide the `assignee_id` field when `type === 'personal'`.
- **FR-011**: The Summary page MUST display a `WizardSummary` component showing the fixture validation result with at least one error and one warning, each with "Go to page" and "Go to field" navigation links.
- **FR-012**: The submit button on the Summary page MUST be disabled when validation errors exist.
- **FR-013**: The wizard side navigation labels MUST be loaded from the server mapping fixture — no hardcoded labels in the component.
- **FR-014**: The MSW fixture data MUST include: a mapping response, a task list, empty create data, at least 2 pre-filled task edit fixtures, dict options for types and assignees, a save handler, and a validation handler with 1 error + 1 warning.
- **FR-015**: The Cancel button in edit mode MUST navigate back to the task list.

### Key Entities

- **Task**: The primary domain object. Fields: `title`, `type`, `description`, `priority`, `deadline`, `start_date`, `assignee_id`, `related_ids`, `notes`. Flat form shape used by the wizard.
- **TaskForm**: The flat wizard form. Same fields as Task plus `deadline_urgency` (derived by calc on the Schedule page).
- **PageMapping**: Server-driven field metadata returned by the mapping endpoint. Consumed by the wizard engine to populate side nav labels and field labels.
- **SummaryResult**: Server-driven validation result returned by the validate endpoint. Contains `error` and `warning` records keyed by field path.
- **DictOption**: `{ value: string | number; label: string }`. Used for Task Type and Assignee dropdowns.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can navigate to `/wizard-demo`, see a list of at least 2 MSW-seeded tasks, and reach the create wizard in one click.
- **SC-002**: A developer can complete all 5 wizard pages from create mode, observe auto-save toasts on each Next click, reach the Summary page, and see the fixture validation error with a working "Go to field" jump link.
- **SC-003**: Opening an existing task in edit mode pre-fills all fields from the MSW fixture — no empty or incorrect field values.
- **SC-004**: Opening a task in view mode shows all fields disabled with no editable inputs and no Save/Cancel buttons.
- **SC-005**: The entire showcase demonstrates every wizard engine feature listed in the design: server-driven labels, `calc`, `hide`, `isSummaryPage`, `WizardSummary`, `saveOnPageChange`, Save and Quit, view mode, `acceptButtons`, Zod schema, `useWizardField`, dict lookup.

## Assumptions

- The wizard engine from Phases 1–5 is fully implemented and working.
- The existing wizard-demo page (`src/app/wizard-demo/page.tsx`) will be **replaced** by the task list page for the showcase module.
- The existing demo MSW handlers (`/api/wizard-demo/*`) can remain but are superseded by the new `/api/tasks/*` handlers for the showcase.
- MSW handlers are sufficient for all data needs — no real backend is needed.
- The `related_ids` multi-select field in Phase 6 is the one field that does not have a built-in `Wiz` component variant. It will use `useWizardField()` with a custom multi-select or be rendered as a simplified multi-select using existing shadcn/ui primitives.
- `deadline_urgency` is a computed display-only label (e.g., "Pilne", "Normalne", "Spokojnie") derived from the difference between today's date and the deadline. It is not sent to the server.
- Polish language is used for all user-facing labels and copy.
