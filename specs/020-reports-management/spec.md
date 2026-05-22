# Feature Specification: Reports Management Module

**Feature Branch**: `020-reports-management`
**Created**: 2026-05-22
**Status**: Refined
**Input**: User description: "Reports management module with table (generate, edit, delete, add report), shared wizard for edit/view with 3 steps: Dane podstawowe, Zapytanie, Uprawnienia; Monaco editor for SQL; backend /generate, /check-status, /download endpoints"

## User Scenarios *(mandatory)*

### User Story 1 - Browse and Manage Reports List (Priority: P1)

An administrator opens the Reports module and sees a paginated, searchable table listing all configured reports. Above the table there is a "Dodaj raport" action button. Each table row exposes three inline actions: **Generate**, **Edit**, and **Delete**.

**Why this priority**: The list is the entry point to every other action — without it users cannot locate, trigger, or manage any report.

**Independent Validation**: Navigate to the Reports route; the table loads and displays report records with all three row-level action buttons visible.

**Acceptance Scenarios**:

1. **Given** the Reports page loads, **When** the data fetch completes, **Then** a table is rendered with columns including at least: name, status, and action buttons (Generate, Edit, Delete).
2. **Given** a non-empty report list, **When** the user types in the search field, **Then** the table filters rows matching the entered text.
3. **Given** the table has more records than the selected page size, **When** the user navigates pages, **Then** the correct subset of records is displayed.
4. **Given** the data fetch fails, **When** the table would normally render, **Then** an error alert is shown with a "Spróbuj ponownie" retry button.

---

### User Story 2 - Add a New Report (Priority: P1)

A user clicks "Dodaj raport" and is taken to the report wizard in **create** mode. They complete three steps — basic data, SQL query, and permissions — and save the new report.

**Why this priority**: Creating reports is the primary authoring flow; all other actions depend on at least one report existing.

**Independent Validation**: Click "Dodaj raport", fill in all three wizard steps, click Save — a new report appears in the table.

**Acceptance Scenarios**:

1. **Given** the user clicks "Dodaj raport", **When** the wizard opens, **Then** the first step "Dane podstawowe" is active and all fields are empty.
2. **Given** the user fills Status, Nazwa, Opis1, and optionally checks KOP, **When** they proceed to step 2 "Zapytanie", **Then** the SQL editor opens in an editable state.
3. **Given** the user enters a SQL query, **When** they click "Testuj zapytanie", **Then** a result preview (limited to 1 row) is shown below the editor; on failure, a descriptive error message is displayed.
4. **Given** the user proceeds to step 3 "Uprawnienia", **When** they select permissions from the "Dostępne" panel and move them to "Wybrane", **Then** the chosen items appear in the right panel.
5. **Given** all steps are valid, **When** the user clicks "Zapisz", **Then** the report is saved and the user is returned to the reports list; a success toast confirms creation.
6. **Given** a validation error exists on any step, **When** the user tries to save, **Then** the relevant step is highlighted and error messages are displayed inline.

---

### User Story 3 - Edit an Existing Report (Priority: P1)

A user clicks the **Edit** action on a table row and is taken to the wizard in **edit** mode with all three steps pre-populated with the existing report's data.

**Why this priority**: Reports are living configurations; administrators regularly update SQL queries, permissions, or metadata.

**Independent Validation**: Click Edit on any row, verify fields are pre-populated, change a field, save — the table reflects the update.

**Acceptance Scenarios**:

1. **Given** the user clicks Edit on a report row, **When** the wizard opens, **Then** "Dane podstawowe" is pre-filled with the report's current Status, Nazwa, Opis1, and KOP values.
2. **Given** the wizard is in edit mode, **When** the user views "Zapytanie", **Then** the SQL editor contains the existing SQL query.
3. **Given** the wizard is in edit mode, **When** the user views "Uprawnienia", **Then** previously assigned permissions are shown in the "Wybrane" panel.
4. **Given** the user modifies data and clicks "Zapisz", **Then** the changes are persisted and a success toast confirms the update.

---

### User Story 4 - View a Report (Read-Only) (Priority: P2)

A user opens a report in **view** mode. All three wizard steps are rendered in a read-only state; no fields are editable and no Save button is shown.

**Why this priority**: Auditors and read-only roles must be able to inspect report definitions without risk of accidental modification.

**Independent Validation**: Open a report in view mode — all inputs are disabled/read-only; Save/Anuluj are absent or disabled; SQL editor is non-editable.

**Acceptance Scenarios**:

1. **Given** view mode is active, **When** the user inspects "Dane podstawowe", **Then** all fields render as read-only (disabled inputs or plain text).
2. **Given** view mode is active, **When** the user inspects "Zapytanie", **Then** the SQL editor is non-editable and the "Testuj zapytanie" and "Dodaj parametr" buttons are hidden or disabled.
3. **Given** view mode is active, **When** the user inspects "Uprawnienia", **Then** the transfer buttons and search inputs for moving items are disabled.

---

### User Story 5 - Generate a Report (Priority: P1)

A user clicks the **Generate** action on a table row. If the report has no defined parameters, generation starts immediately. If the report has one or more parameters, a **drawer** opens on the right side of the screen presenting a form with each parameter's label, type, and an input for its runtime value. The user fills in the values and confirms; the system then submits the generation request with the provided values and polls for completion. When the report is ready, the user can download it.

**Why this priority**: Generating and downloading reports is the core end-user value of the entire module.

**Independent Validation**: Click Generate on a parametrised report → drawer opens; fill values → confirm → polling starts → download resolves.

**Acceptance Scenarios**:

1. **Given** the user clicks Generate on a report with **no parameters**, **When** the action is triggered, **Then** generation starts immediately without opening the drawer.
2. **Given** the user clicks Generate on a report **with parameters**, **When** the action is triggered, **Then** the parameters drawer opens listing each parameter with its name, type label, and an appropriately typed input field (text, number, boolean toggle, or date picker per parameter type).
3. **Given** the drawer is open, **When** the user fills all required parameter values and clicks the confirm/generate button, **Then** the drawer closes, generation is submitted with the entered values, and the row action shows a loading/pending indicator.
4. **Given** the drawer is open, **When** the user clicks Cancel or dismisses the drawer, **Then** no generation request is sent and the table row returns to its idle state.
5. **Given** the generation is in progress, **When** the system polls the status endpoint, **Then** the polling continues at a regular interval until status is complete or failed.
6. **Given** generation completes successfully, **When** status resolves to done, **Then** the download is triggered automatically or a "Pobierz" link appears.
7. **Given** generation fails, **When** the status resolves to an error, **Then** an error toast is shown with a descriptive message and the Generate button becomes available again.

---

### User Story 6 - Delete a Report (Priority: P2)

A user clicks the **Delete** action on a table row and confirms deletion in a dialog. The report is removed and no longer appears in the list.

**Why this priority**: Reports that are obsolete or misconfigured must be removable to keep the list manageable.

**Independent Validation**: Click Delete, confirm the dialog, verify the row is gone from the table.

**Acceptance Scenarios**:

1. **Given** the user clicks Delete, **When** the confirmation dialog appears, **Then** it names the report and presents a destructive-styled confirm button and a cancel button.
2. **Given** the user confirms deletion, **When** the request succeeds, **Then** the report is removed from the table and a success toast is shown.
3. **Given** the user cancels the dialog, **Then** no deletion occurs and the list is unchanged.
4. **Given** the delete request fails, **When** the response returns an error, **Then** an error toast is shown and the report remains in the list.

---

### Edge Cases

- What happens when the SQL query test returns no rows? → Display "Brak danych" message in the preview area.
- What happens when the SQL query is syntactically invalid? → Return an error from the test endpoint; show the error message inline in step 2.
- What happens if generation polling times out? → Stop polling after a configurable maximum duration, show a timeout error toast, re-enable the Generate button.
- What happens when a report has no permissions assigned? → Allow saving; report visibility is simply restricted to administrators.
- What happens when the SQL editor theme preference changes? → The editor switches between light and dark theme immediately without losing query content.
- What happens when the user navigates away mid-wizard with unsaved changes? → A browser confirmation prompt warns about unsaved data loss (standard browser unload guard).
- What happens when the parameters drawer is open and generation of a different row is triggered? → The drawer is scoped to a single report; concurrent generation triggers are not permitted while the drawer is open.
- What happens when a parameter has type `boolean`? → Render a toggle or checkbox; the runtime value sent to the backend is `true` or `false`.
- What happens when a parameter has type `data` (date)? → Render a date picker; the value is sent in ISO 8601 format.
- What happens when required parameter inputs are left empty and the user confirms? → Inline validation errors appear in the drawer; generation is not submitted until all required values are provided.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a paginated, searchable table of reports at a dedicated Reports route, with columns for name, status, and row-level actions.
- **FR-002**: System MUST provide a "Dodaj raport" button above the table that opens the wizard in create mode.
- **FR-003**: Users MUST be able to Edit any report from the table, opening the shared wizard pre-populated with existing data.
- **FR-004**: Users MUST be able to Delete any report from the table behind a named confirmation dialog with a destructive confirm button.
- **FR-005**: Users MUST be able to Generate a report from the table, triggering an async backend job with polling and download on completion.
- **FR-006**: System MUST provide a shared wizard component with a `mode` prop (`create` | `edit` | `view`) that controls field editability and available actions.
- **FR-007**: The wizard MUST consist of exactly three steps: "Dane podstawowe", "Zapytanie", "Uprawnienia", navigable via a tab/step header.
- **FR-008**: "Dane podstawowe" step MUST include: Status (select), Nazwa (text), Opis1 (textarea, max 2000 chars with live remaining-character counter), and KOP (checkbox).
- **FR-009**: "Zapytanie" step MUST include a SQL editor with light/dark theme toggle, a dynamic parameter table managed via "Dodaj parametr", and a "Testuj zapytanie" button that calls the test endpoint and renders a [LIMIT 1] result preview.
- **FR-009a**: The parameter table in "Zapytanie" MUST display one row per parameter with four editable columns: **Nazwa parametru** (text), **Typ parametru** (select: numer | string | boolean | data), **Wartość parametru** (text, used as default/test value), **Opis parametru** (text); each row MUST have a delete action. In view mode all cells and the delete button MUST be read-only/disabled.
- **FR-010**: The SQL editor MUST use Monaco Editor, supporting SQL syntax highlighting and standard editing features. In view mode the editor MUST be read-only.
- **FR-011**: "Uprawnienia" step MUST include a dual-list transfer widget with "Dostępne" and "Wybrane" panels, each with a text search filter, and four transfer buttons (move all right `>>`, move selected right `>`, move selected left `<`, move all left `<<`).
- **FR-012**: In view mode, the "Uprawnienia" dual-list transfer controls MUST be disabled and search-only.
- **FR-013**: The wizard footer MUST show "Zapisz" and "Anuluj" in edit/create modes; in view mode these buttons MUST be absent or non-functional. An informational note "Raport będzie dostępny dla użytkownika po poprawnym teście" MUST appear alongside the save action.
- **FR-014**: When the user triggers Generate on a report that has **no parameters**, the system MUST call `/generate` immediately, poll `/check-status` at regular intervals, and invoke `/download` when complete; the Generate row action MUST show a pending state throughout.
- **FR-014a**: When the user triggers Generate on a report that has **one or more parameters**, the system MUST open the existing application **Drawer** (Sheet/side panel) component with a parameter input form. Each parameter is rendered with a label, type-appropriate input, and its description as helper text. Only after the user confirms the values does the system call `/generate` with the runtime values included in the request body.
- **FR-015**: All write operations (create, update, delete, generate) MUST provide success and error toast feedback.
- **FR-016**: The wizard step navigation MUST visually indicate completed, current, upcoming, and error states per step.

### Key Entities

- **Report**: Represents a configured data report. Key attributes: id, name, status (e.g., projekt, aktywny), description (Opis1), isKop (boolean), sqlQuery, parameters (list of named query parameters), assignedPermissions (list of permission ids), createdAt, updatedAt.
- **ReportStatus**: Enumeration of lifecycle states — e.g., `projekt` (draft), `aktywny` (active). Controls whether a report is visible to end-users.
- **QueryParameter**: A named placeholder inside the SQL query. Defined at report-authoring time (step 2). Attributes: name (used as SQL placeholder), type (numer | string | boolean | data), defaultValue (shown as "Wartość parametru" in the editor and pre-filled in the generation drawer), description ("Opis parametru", shown as helper text in the generation drawer).
- **RuntimeParameterValue**: The concrete value provided by the user in the generation drawer for a specific QueryParameter. Attributes: parameterName, value (typed per parameter type). Sent to `/generate` as part of the request payload.
- **Permission**: A system-level access right that can be assigned to a report, controlling who may generate or view it. Attributes: id, label.
- **GenerationJob**: Represents an async backend generation task. Attributes: jobId, reportId, status (pending | processing | done | failed), downloadUrl.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The reports table loads and is interactive within 2 seconds under normal network conditions for a list of up to 200 reports.
- **SC-002**: All three wizard steps are accessible and navigable without page reload; step-to-step transition completes in under 300 ms.
- **SC-003**: The SQL query test ("Testuj zapytanie") returns a preview result or a descriptive error within the time the backend takes, with no frontend timeout below 30 seconds.
- **SC-004**: Report generation polling provides visible feedback at every poll cycle; users are never left with a blank or frozen UI state during async generation.
- **SC-009**: The parameters drawer opens within 200 ms of clicking Generate on a parametrised report; parameter inputs are immediately interactive.
- **SC-010**: Inline validation in the parameters drawer prevents submission of an incomplete form; the user receives field-level error messages without a full-page reload.
- **SC-005**: 100% of destructive actions (Delete, Cancel in wizard) are protected by an explicit confirmation step — no data is lost without user acknowledgment.
- **SC-006**: The Monaco SQL editor renders correctly in both light and dark themes within 500 ms of a theme switch.
- **SC-007**: All CRUD operations (create, update, delete) produce a success or error toast within 300 ms of the server response.
- **SC-008**: The dual-list permissions transfer widget correctly reflects selections immediately on interaction with no perceptible delay.

## Design Decisions *(resolved via grill session 2026-05-22)*

### Routing
- Reports module lives at `/(app)/reports/` (App Router group)
- `/(app)/reports/` → list table
- `/(app)/reports/new/` → `ReportsWizard` `mode="create"`
- `/(app)/reports/[id]/` → `ReportsWizard` `mode="edit"`
- `/(app)/reports/[id]/view/` → `ReportsWizard` `mode="view"`
- Report name cell in the table is a `<Link>` to `/reports/[id]/view`
- Wizard footer in view mode shows an "Edytuj" button linking to `/reports/[id]`

### Wizard Data Wiring
- Mirrors the tasks-wizard pattern exactly
- `mappingUrl` → `/api/reports/wizard/mapping`
- `dataUrl` → `/api/reports/wizard/data` (create) or `/api/reports/wizard/data/[id]` (edit)
- `saveUrl` → `/api/reports/wizard/save`
- Corresponding Next.js route handlers live under `src/app/api/reports/wizard/`
- `saveOnPageChange: false` — all data committed on explicit "Zapisz" only

### Backend Endpoint Shapes

**`POST /reports/generate`**
```ts
// request
{ reportId: number; parameters?: { name: string; value: string | number | boolean }[] }
// response
{ jobId: string }
```

**`GET /reports/check-status?jobId={jobId}`**
```ts
// response
{ jobId: string; status: "pending" | "processing" | "done" | "failed"; message?: string }
```

**`GET /reports/download?jobId={jobId}`**
```ts
// response: binary file (Blob download)
```

**`POST /reports/test-query`**
```ts
// request
{ sql: string; parameters?: { name: string; value: string | number | boolean }[] }
// response (success)
{ columns: string[]; rows: Record<string, unknown>[] }  // max 1 row
// response (error)
{ message: string }
```

**`GET /reports/permissions`**
```ts
// response
{ id: number; label: string }[]
```

### Polling Strategy
- Interval: 3 000 ms
- Max attempts: 20 (~60 s total)
- Constants exported from `src/lib/api/domains/reports/polling.ts`
- Implemented in a dedicated `useReportGeneration` hook (not TanStack Query `refetchInterval`)

### Report Statuses
| Value | Polish label | Badge variant |
|-------|-------------|---------------|
| `projekt` | Projekt | `outline` |
| `aktywny` | Aktywny | `default` |
| `archiwum` | Archiwum | `secondary` |

### Monaco Editor
- Package: `@monaco-editor/react` + `monaco-editor` (added via `pnpm add`)
- Loaded via `dynamic(() => import('@monaco-editor/react'), { ssr: false })`
- Theme follows `next-themes` app theme automatically — no manual toggle button
- Default worker config (no custom webpack setup needed)

### Generation Drawer
- Reuses existing `Sheet` component (same as `AppDrawer`)
- State: single `selectedReport: Report | null` in the reports table component
- Reports with no parameters → skip drawer, call `/generate` immediately
- Reports with parameters → open Sheet with `FormRepeater` for runtime parameter inputs
- Each parameter rendered with label, type-appropriate input, and description as helper text
- Closing/cancelling the drawer sends no request

### Generation Pending State
- Stored in Zustand as a new `reports.slice.ts`: `Record<number, GenerationState>`
- `GenerationState = 'idle' | 'pending' | 'done' | 'failed'`
- When **any** report is `pending`, **all** table action buttons are disabled
- Constants in `src/lib/api/domains/reports/polling.ts`

### Step 2 — Parameter Table State
- Parameters stored as `parameters: QueryParameter[]` in the wizard Zustand store via `useWizard().setValue`
- Custom `ParameterTable` component reads/writes the array through `useWizard()` — no TanStack Form in step 2
- In view mode all cells and delete button are read-only/disabled

### Step 3 — Permissions Dual-List
- New reusable `DualListTransfer` primitive at `src/components/ui/dual-list-transfer.tsx`
- Full permission list fetched via TanStack Query from `GET /reports/permissions` (not through wizard `dataUrl`)
- `assignedPermissions` from wizard form state used to split available vs selected on mount
- Selected IDs stored as `permissionIds: number[]` in wizard form state

### Test Query Result
- Result renders as a small read-only table below the SQL editor
- "Brak danych" shown when `rows` is empty
- Error message renders inline below the editor (not a toast)
- State is local to the Zapytanie step component

### Row Actions
- Three inline icon buttons per row: Generate (`PlayIcon`), Edit (`PencilIcon`), Delete (`Trash2Icon`)
- No dropdown menu
- All disabled when `anyPending` is true

### Delete Confirmation
- Uses `Dialog` + `DialogContent` pattern (same as `DashboardRowActions`)
- Dialog title names the report; destructive confirm button reads "Usuń raport"
- Pending state disables both Anuluj and confirm buttons

### TextareaWiz Extension
- `TextareaWiz` extended with an optional `maxLength` prop
- When set, renders a live remaining-character counter below the field
- Used for Opis1 field (max 2 000 chars)

### Breadcrumbs
- Entries added to `breadcrumbRegistry` mirroring the wizard-demo pattern:
  - `/reports` → `[Start, Raporty]`
  - `/reports/new` → `[Start, Raporty, Nowy raport]`
  - `/reports/:id` → `[Start, Raporty, Edycja raportu #id]`
  - `/reports/:id/view` → `[Start, Raporty, Podgląd raportu #id]`

### Sidebar Navigation
- Already present in `menuConfigFixture` (`key: "reports"`, icon `bar-chart-3`, `to: "/reports"`)
- No changes needed

---

## Assumptions

- The existing `Wizard` / `WizardProvider` / `WizardShell` foundation (specs 006–011) is reused; only report-specific step pages and a new `ReportsWizard` wrapper are added.
- The existing `Sheet` / `Drawer` component (used in `AppDrawer`) is reused for the generation parameters drawer; no new drawer primitive is introduced.
- The existing `DataTable` component (spec 003) is reused for the reports list table with report-specific columns and action cells.
- The backend already exposes CRUD endpoints for reports; the frontend maps to these via the project's standard `commands.ts` + `queries.ts` domain pattern.
- `/generate`, `/check-status`, and `/download` endpoints exist on the backend; the frontend is responsible for orchestration, polling logic, and including runtime parameter values in the `/generate` request body.
- Parameter types map to input controls as follows: `numer` → number input, `string` → text input, `boolean` → checkbox/toggle, `data` → date picker.
- The Monaco editor package (`@monaco-editor/react`) is not yet installed; it will be added as a dependency.
- Permission data for the "Uprawnienia" dual-list is fetched from an existing backend endpoint returning a flat list of permission objects.
- The "KOP" checkbox represents a domain-specific flag (KOP module association); its exact business meaning is owned by the backend domain model.
- The informational banner "Raport będzie dostępny dla użytkownika po poprawnym teście" is a static UI hint; no dynamic enablement logic is in scope for this feature.
- User authentication and route-level authorization are handled by the existing auth layer; this feature respects roles already enforced globally.
- Polish-language labels, placeholders, and messages match the existing application locale convention.
