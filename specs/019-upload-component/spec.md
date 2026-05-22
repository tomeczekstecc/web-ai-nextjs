# Feature Specification: Configurable File Upload Component

**Feature Branch**: `019-upload-component`
**Created**: 2026-05-22
**Status**: Draft (rev 3 — design decisions resolved via grilling session 2026-05-22)
**Input**: User description: "fully configurable upload to backend component — upload area, list to upload/uploaded, progress bar, success message, error message, upload all button, cancel button, upload one, configurable max uploads, max size, extensions allowed list, demo as a step in zadanie wizard; plus: list of files already on backend with update/delete, edit metadata on queued items before upload, file downloader from backend"

**Design notes**: Resolved design forks from the grilling session are summarised
in `### Resolved Design Decisions` below the Assumptions section. Anything not
called out there is at the planning phase's discretion.

## User Scenarios *(mandatory)*

### User Story 1 - Upload files one at a time with feedback (Priority: P1)

A user filling in a zadanie (task) wizard reaches a step that asks for supporting
files (e.g. scans, photos). They drag a file into the upload area, see it appear
in a list as "ready to upload", press the per-row upload button, watch a progress
bar fill, and see a clear success message when the file is stored by the backend.
If the backend rejects the file, the user sees an inline error message explaining
why, with the file remaining in the list so they can retry or remove it.

**Why this priority**: This is the minimum end-to-end flow that proves the
component works against the real backend and unblocks the wizard demo step. All
other capabilities (bulk upload, cancel, configuration) build on top of it.

**Independent Validation**: Mount the component on a standalone demo page with a
mock backend, drop a single valid file, click upload, and verify the success
message appears and the uploaded file shows in the "uploaded" section. Repeat
with a backend that returns 500 and verify the error message.

**Acceptance Scenarios**:

1. **Given** the upload component is mounted with no files queued,
   **When** the user drops one valid file onto the upload area,
   **Then** the file appears in the "to upload" list with name, size, and an
   "upload" button, and no network request has been made yet.
2. **Given** a single file is in the "to upload" list,
   **When** the user clicks its per-row upload button and the backend responds
   successfully, **Then** a progress bar fills from 0% to 100%, the row moves to
   the "uploaded" list, and a success message is shown for that file.
3. **Given** a file is uploading,
   **When** the backend returns an error response,
   **Then** the row shows an inline error message describing the failure, stays
   in the "to upload" list, and offers a retry action when the failure is
   transient (network or server). For backend validation errors that name a
   specific metadata field, the offending field is highlighted on the row.
4. **Given** a file is uploading,
   **When** the user cancels it,
   **Then** the row returns silently to a "ready" state with no error message
   shown (cancellation is a deliberate user action, not a failure).

---

### User Story 2 - Bulk upload with cancel (Priority: P2)

A user selects several files at once, reviews the list, then triggers an
"Upload all" action to send every queued file. While uploads are running, the
user can cancel an individual upload mid-flight or cancel the whole batch
without losing the files that already completed.

**Why this priority**: Batch upload and cancellation are essential for real
workflows where users attach many documents, but the single-file flow (US1)
must work first.

**Independent Validation**: Queue 3 files, click "Upload all", and verify all
three progress bars advance and all three move to "uploaded". Repeat, but click
"Cancel" on one row mid-upload and verify only that row stops while the others
finish.

**Acceptance Scenarios**:

1. **Given** multiple files are queued in the "to upload" list,
   **When** the user clicks the "Upload all" button,
   **Then** every queued file starts uploading and each shows its own progress
   bar; rows complete independently as the backend confirms them.
2. **Given** a file is mid-upload,
   **When** the user clicks its "Cancel" button,
   **Then** the in-flight request is aborted, the row returns to a cancellable
   "ready" state with no partial data persisted, and other uploads are
   unaffected.
3. **Given** an upload batch is running,
   **When** the user clicks a global "Cancel" action,
   **Then** all in-flight uploads are aborted, already-completed files remain in
   the "uploaded" list, and the remaining queued files stay in "to upload".

---

### User Story 3 - Enforced configuration limits (Priority: P2)

A product owner configures the component with limits — maximum number of
uploads, maximum size per file, and an allowed-extensions list — before exposing
it to users. The component enforces those limits in the browser so users get
immediate feedback if they pick a file that does not meet the rules, without
waiting for a backend round-trip.

**Why this priority**: Configuration is what makes the component reusable across
features (zadanie wizard, applications, future modules). Without it the
component would have to be reimplemented per use case.

**Independent Validation**: Configure the component with maxFiles=2, maxSize=1MB,
allowedExtensions=["pdf"]. Try to add a 3rd file, a 2MB file, and a .png file
in turn; each must be rejected with a specific message and never enter the
"to upload" list.

**Acceptance Scenarios**:

1. **Given** the component is configured with a maximum file count,
   **When** the user attempts to add files that would exceed that count,
   **Then** the excess files are rejected with a clear message stating the
   limit, and the existing queue is unchanged.
2. **Given** the component is configured with a maximum size per file,
   **When** the user attempts to add a file larger than that limit,
   **Then** the file is rejected with a message stating the allowed maximum and
   the actual file size.
3. **Given** the component is configured with an allowed-extensions list,
   **When** the user attempts to add a file whose extension is not on the list,
   **Then** the file is rejected with a message listing the allowed extensions.

---

### User Story 4 - Manage files already stored on the backend (Priority: P1)

When the component mounts for an entity that already has files attached (e.g.
returning to an in-progress zadanie), it fetches and shows the list of files
already stored on the backend in a distinct "repository" section, separate from
the in-session "to upload" queue. From that list a user can download any file,
edit its associated metadata, or delete it after a confirmation step.

**Why this priority**: Without this, the component is write-only and useless
for anything other than first-time data entry. Editing and deleting existing
attachments is part of the same core workflow as uploading them.

**Independent Validation**: Seed the mock backend with two stored files,
mount the component, and verify both appear in the repository list with
download/edit/delete actions. Click download — file is retrieved. Edit
metadata and save — list reflects the change. Delete — confirmation prompt
appears, and on confirm the file disappears from the list.

**Acceptance Scenarios**:

1. **Given** the component is mounted for an entity that has stored files,
   **When** the component loads, **Then** every stored file is listed with its
   name, size, upload date, and any consumer-defined metadata columns.
2. **Given** a stored file is shown in the repository list,
   **When** the user triggers its download action,
   **Then** the file is retrieved from the backend and offered to the user as a
   normal browser download with its original filename.
3. **Given** a stored file is shown in the repository list,
   **When** the user triggers its edit action,
   **Then** an editor for the file's metadata opens (using the consumer-supplied
   field definitions), and saving persists the changes to the backend and
   refreshes the list.
4. **Given** a stored file is shown in the repository list,
   **When** the user triggers its delete action,
   **Then** a confirmation prompt names the file; only after explicit
   confirmation is the delete request sent and the file removed from the list.
5. **Given** the component is in a read-only mode,
   **When** the repository list renders,
   **Then** edit and delete actions are disabled or hidden while download
   remains available.

---

### User Story 5 - Edit per-file metadata before upload (Priority: P2)

The consuming feature may need each file to carry metadata that the user
provides (e.g. document category, validity date, "include in knowledge base"
flag). For every file in the "to upload" queue, the user can fill in those
consumer-defined fields before pressing upload, and that metadata is sent
together with the file in the same request.

**Why this priority**: Real backends almost always require metadata alongside
the file. Without this, the component cannot be reused beyond trivial cases.

**Independent Validation**: Configure the component with a metadata schema
that requires a "category" field. Add a file, verify the row exposes a
category input, fill it in, upload, and confirm the backend received the
selected category alongside the binary.

**Acceptance Scenarios**:

1. **Given** the consumer has declared per-file metadata fields,
   **When** a file is added to the "to upload" queue,
   **Then** the row renders an editable input for each declared field,
   pre-populated with any defaults.
2. **Given** a queued file has a required metadata field,
   **When** the user edits that field,
   **Then** the field shows live validity feedback as the value changes (no
   submit required).
3. **Given** a queued file has required metadata that is not yet filled in,
   **When** the user tries to upload that single row,
   **Then** the upload is blocked with an inline message identifying the
   missing field, and the field itself is visually highlighted.
4. **Given** a queue contains a mix of rows with valid and missing metadata,
   **When** the user clicks "Upload all",
   **Then** valid rows upload while invalid rows remain queued with their
   inline validation errors, and the batch summary notification names the
   count of skipped rows.
5. **Given** a queued file has valid metadata,
   **When** the upload succeeds,
   **Then** the metadata is included in the same request as the file bytes
   and the resulting stored file in the repository list reflects those values.
6. **Given** the consumer has declared constant metadata (e.g. parent
   entity id) that the user does not edit,
   **When** any file is uploaded or its metadata edited,
   **Then** that constant metadata is attached to the request automatically.

---

### User Story 6 - Live demo inside the zadanie wizard (Priority: P3)

A developer or stakeholder opens the existing wizard demo and finds a new step
that showcases the upload component end-to-end against the project's mock
backend. The step exercises the same configuration knobs a real consumer would
use, so it doubles as living documentation.

**Why this priority**: The demo step proves the component integrates with the
wizard data layer and gives reviewers a clickable artefact, but it depends on
the component itself (US1–US3) being functional.

**Independent Validation**: Run the wizard demo, navigate to the upload step,
upload at least one file, advance to the next step, return to the upload step,
and verify the previously uploaded files are still listed.

**Acceptance Scenarios**:

1. **Given** the wizard demo is open,
   **When** the user reaches the upload step,
   **Then** the upload component renders with a clearly described configuration
   (limits, allowed extensions) and works against the demo backend.
2. **Given** the user has uploaded files in the upload step,
   **When** they move to a later step and come back,
   **Then** the previously uploaded files remain visible (because they live on
   the backend); files that were queued but not yet uploaded are *not*
   preserved across navigation away from the step.
3. **Given** the user enters the wizard in "new task" mode and lands on the
   attachments step before the task has been saved,
   **When** the step renders,
   **Then** an explanatory empty state is shown asking the user to complete
   the first step (no dropzone, no repository list); the step never attempts to
   call the backend without a parent entity id.

**Demo configuration (decided 2026-05-22):**

- Placement in the wizard: page 2 (`start → attachments → schedule → assignment → related → summary`)
- Limits: max 10 files, max 5 MB per file
- Allowed extensions: `pdf`, `docx`, `jpg`, `jpeg`, `png`
- Metadata schema (exercises every built-in field kind):
  - `category` (select, required) — options: Dokument PDF / Skan / Zdjęcie / Inne
  - `description` (text, optional)
  - `pageCount` (number, optional)
  - `validFrom` (date, optional)
  - `isConfidential` (checkbox, default false)
- Constant metadata: `{ taskId }` from the wizard form context
- Mock backend seeds two stored files for the demo task so the repository-
  management flow (US4) is exercisable on first load
- A `?fail=true` query-string toggle on the wizard URL makes the mock backend
  reject one upload in ten with a field-level validation error, for QA and
  error-state demonstrations; the happy path is otherwise deterministic

### Edge Cases

- User drops a folder or a 0-byte file: must be rejected with an explanatory
  message and never added to the queue.
- Network drops mid-upload: the affected row shows a connectivity error and
  offers retry; other uploads are unaffected.
- Backend accepts the request but later returns a validation error: the row
  moves back from "uploading" to an error state with the backend message.
- User navigates away from the page while uploads are in flight: in-flight
  uploads are cancelled (client-side abort); see Assumptions for the backend
  contract that prevents orphan stored files.
- A wizard step embeds the Uploader before the parent entity id is available
  (e.g. user reaches the attachments step via deep link without completing
  the first step): the embedding step renders an explanatory empty state; the
  Uploader itself is never mounted with a missing id.
- Consumer passes contradictory configuration (e.g. allowedExtensions is empty):
  the component falls back to a safe default (accept nothing) and surfaces the
  misconfiguration in development.
- Backend fails to return the list of already-stored files: the repository
  section surfaces a non-blocking error with a retry action; the upload queue
  remains fully usable.
- Download request fails (network error or 4xx/5xx): user sees an error
  message and the file row stays in the repository list unchanged.
- Delete confirmation is cancelled: no request is sent and the file remains
  in the list.
- Edit modal is opened, fields changed, then cancelled: no request is sent and
  the list shows the original metadata.
- Two users edit or delete the same stored file concurrently: the component
  surfaces the backend's conflict/not-found response and refreshes the list.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Component MUST render an upload area that accepts files via both
  drag-and-drop and a click-to-browse interaction.
- **FR-002**: Component MUST render a visible list of files in two logical
  groups: "to upload" (queued or in progress) and "uploaded" (completed).
- **FR-003**: Each row MUST display the file name, file size in a
  human-readable format, current status, and any per-file action buttons
  appropriate to that status (upload, cancel, retry, remove).
- **FR-004**: Component MUST display per-file progress that advances from 0% to
  100% as bytes are transferred to the backend.
- **FR-005**: Component MUST display success state for each file once the
  backend confirms the upload, inline on the file's row, and move the file
  into the "uploaded" group. Inline state is the primary, durable surface;
  optional batch-level notifications (FR-031) are emitted separately.
- **FR-006**: Component MUST display a per-file error message inline on the
  affected row when the backend rejects the upload or the transfer fails,
  including the reason when one is available. The component MUST distinguish
  failure causes per FR-033 and present each appropriately.
- **FR-007**: Component MUST expose an "Upload all" action that uploads every
  file currently in the "to upload" group. Rows with unmet client-side
  validation (size, extension, required metadata) are skipped without removing
  them from the queue; the batch summary notification names the skipped count.
- **FR-008**: Component MUST expose a per-file upload action that uploads only
  that file.
- **FR-009**: Component MUST expose a per-file cancel action that aborts the
  in-flight upload client-side. "No orphan stored file" is a contract the
  backend MUST uphold by treating aborted POSTs as non-committed (see
  Assumptions); the component does not attempt to issue a compensating delete.
- **FR-010**: Component MUST expose a global cancel action that aborts every
  in-flight upload while preserving already-completed uploads.
- **FR-011**: Consumers MUST be able to configure the maximum number of files
  the component will hold at once; attempts to add more MUST be rejected client
  side with a clear message.
- **FR-012**: Consumers MUST be able to configure the maximum size per file;
  oversize files MUST be rejected client side with a clear message that names
  the limit and the actual size.
- **FR-013**: Consumers MUST be able to configure the list of allowed
  extensions; files outside the list MUST be rejected client side with a
  message that lists the allowed extensions.
- **FR-014**: Component MUST validate every file against the configured rules
  before any network request is initiated.
- **FR-015**: Component MUST emit events or callbacks that let the consuming
  feature observe the lifecycle of each file (added, validated, uploading,
  uploaded, failed, cancelled, removed).
- **FR-016**: Component MUST provide accessible labels, statuses, and focus
  behaviour so all actions and state changes are perceivable by keyboard and
  screen-reader users.
- **FR-017**: Component MUST integrate with the project mock backend so it can
  be exercised end-to-end without a live API.
- **FR-018**: A demo step in the existing wizard demo MUST mount the component
  with a representative configuration and persist its state across wizard
  navigation within a session.
- **FR-019**: User-visible copy in the demo step and the component's built-in
  messages MUST be in Polish, consistent with the rest of the application.
- **FR-020**: Component MUST fetch and display the list of files already
  stored on the backend for the current context in a section visually distinct
  from the "to upload" queue.
- **FR-021**: Each stored-file row MUST show name, size, upload date, any
  consumer-defined metadata columns, and per-row actions (download, edit,
  delete) appropriate to the component's current mode.
- **FR-022**: Component MUST expose a per-file download action that retrieves
  the file from the backend and delivers it to the user as a browser download
  with the original filename and a sensible content type.
- **FR-023**: Component MUST expose a per-file edit action for stored files
  that opens an editor for consumer-defined metadata fields and persists the
  changes via the backend on save, refreshing the list afterwards.
- **FR-024**: Component MUST require an explicit user confirmation before
  sending a delete request for a stored file; on confirmation the file MUST be
  removed from the backend and from the repository list.
- **FR-025**: Consumers MUST be able to declare per-file metadata fields
  (with type, label, default, required flag) that render as editable inputs on
  each queued row and on the edit form for stored files.
- **FR-026**: Component MUST validate per-file metadata both incrementally as
  the user edits (live field-level feedback) and at the moment of upload or
  save; uploads/saves with missing required metadata MUST be blocked with an
  inline message naming the missing field; "Upload all" MUST skip invalid
  rows without removing them from the queue.
- **FR-027**: Component MUST attach consumer-supplied constant metadata
  (context fields the user does not edit, e.g. parent entity id) to every
  upload and metadata-edit request.
- **FR-028**: Upload requests MUST be `multipart/form-data` with a `file` part
  carrying the binary and a `metadata` part carrying a single JSON document
  with the merged user-supplied and constant metadata. Metadata-edit requests
  for already-stored files MUST be `application/json` with the same metadata
  shape, no file part. File and metadata MUST travel in the same request; no
  separate metadata round-trip is used.
- **FR-029**: Component MUST support a read-only mode in which the
  upload area and edit/delete actions are hidden or disabled while the
  repository list and download action remain available.
- **FR-030**: Component MUST source its configuration (limits, allowed
  extensions, metadata schema) from a consumer-supplied object passed in at
  mount time. Backend-driven configuration is out of scope for this iteration.
- **FR-031**: Component MUST expose an optional batch-level notification
  callback (e.g. for "Upload all" completion summary and list-fetch failure).
  Per-file events MUST remain visible inline on the affected row regardless of
  whether the callback is wired; the component MUST NOT depend directly on a
  specific toast implementation.
- **FR-032**: Component MUST allow the consumer to gate edit and delete
  actions per stored-file row based on domain rules (e.g. ownership, version);
  when no gating callback is supplied, both actions are available subject to
  the read-only flag (FR-029).
- **FR-033**: Component MUST distinguish the following per-file failure causes
  and present each appropriately: (a) user cancellation — silent, row returns
  to ready; (b) network failure — inline message with retry; (c) backend
  validation error — inline message; when the backend response identifies
  specific metadata fields, those fields MUST be highlighted within the row;
  (d) server error — inline message with retry; (e) unknown — generic message.
- **FR-034**: Component MUST report real, byte-level upload progress per file
  (not a busy indicator). Progress updates SHOULD arrive at least every 100 ms
  during transfer of files larger than a few hundred kilobytes.
- **FR-035**: Mutations on the stored-file list (upload completion, metadata
  edit, delete) MUST update the cached list optimistically and roll back on
  error, consistent with the project's `api-mutation-pattern`.

### Key Entities

- **UploadItem**: Represents one file the user has added in the current
  session. Attributes: stable client-side id, original name, size,
  type/extension, current status (queued, uploading, uploaded, failed,
  cancelled), progress 0–100, optional `UploaderError`, optional backend-
  issued identifier once uploaded, current per-file metadata values.
- **UploadConfiguration**: The set of rules a consumer passes in. Attributes:
  maximum file count, maximum size per file (bytes), case-insensitive list of
  allowed extensions, optional read-only flag, optional per-row capability
  callback (for edit/delete gating), optional batch-notification callback,
  optional copy overrides. Concurrency for "Upload all" is fixed internally
  and is not part of the public configuration.
- **UploadAdapter**: A consumer-supplied object exposing the operations the
  component needs against a specific backend resource: list (with
  AbortSignal), upload (file + metadata + progress + signal), update-metadata,
  delete, download (returning blob + filename). Adapters are generic over
  `TMetadata` so the metadata type flows end-to-end. Adapter implementations
  use a shared `xhrUpload` helper provided by the project for byte-level
  progress and typed error mapping.
- **StoredFile**: Represents a file that already lives on the backend.
  Attributes: backend-issued identifier, original name, size, upload date,
  consumer-defined metadata values (typed as the consumer's `TMetadata`).
  Per-row authorization is supplied via the configuration's capability
  callback, not as a flag on the entity itself.
- **MetadataField**: A consumer-declared field describing one piece of
  metadata to collect per file. Attributes: key (typed as `keyof TMetadata`),
  label, input kind (`text` | `number` | `select` | `checkbox` | `date`),
  options for the select kind, default value, required flag, whether it is
  editable after upload, and an optional `render` override for custom inputs.
- **ConstantMetadata**: Key/value pairs supplied once by the consumer
  (e.g. parent entity id) that the component merges into every upload and
  metadata-edit request without exposing them to the user.
- **UploaderError**: Typed sum describing why an operation failed. Kinds:
  `cancelled` (silent), `network` (retry-able), `validation` (with optional
  per-field errors that route to specific metadata inputs), `server` (with
  status code, retry-able), `unknown` (generic).
- **UploaderNotification**: Coarse-grained event the component may emit to the
  consumer's optional callback (Upload-all summary, list-fetch failure).
  Attributes: level (`success` | `error`) and a human-readable message.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can upload a single valid file from drop to success
  message in under 5 seconds on the project's mock backend.
- **SC-002**: 100% of files that violate a configured rule (count, size,
  extension) are rejected before any network request is made.
- **SC-003**: A user can queue at least 10 files at once, trigger "Upload all",
  and see every file reach a terminal state (uploaded or clearly errored)
  without manual intervention.
- **SC-004a**: Cancelling an in-flight upload returns the affected file to a
  retryable state in the UI within 1 second (client-side guarantee).
- **SC-004b**: The backend treats aborted upload requests as non-committed,
  so no stored file remains after a cancellation (backend contract; verified
  by integration tests against the mock and required of the real backend).
- **SC-005**: The wizard demo upload step is reachable in under 3 clicks from
  the wizard demo entry point and demonstrates every documented capability.
- **SC-006**: A new consumer can integrate the component into another feature
  by supplying only a configuration object and an upload destination, without
  modifying the component's source.
- **SC-007**: When the component is mounted for an entity that already has
  stored files, the repository list renders within 2 seconds on the mock
  backend with every file's actions immediately usable.
- **SC-008**: A user can download any stored file in a single click and
  receives it with the correct original filename in 100% of cases.
- **SC-009**: A user can edit metadata on a stored file and see the updated
  values reflected in the repository list within 2 seconds of saving.
- **SC-010**: A delete action never removes a stored file without an explicit
  user confirmation, verified by 100% of delete-flow tests.

## Assumptions

- The target backend is the existing project mock backend (and the future real
  backend will mirror its contract); a concrete endpoint contract will be
  defined during planning.
- Concurrency for "Upload all" is fixed at 3 simultaneous transfers. This is
  an internal implementation detail and is not exposed as configuration.
- Allowed-extensions configuration is a case-insensitive whitelist matched
  against the file extension only; MIME type sniffing is out of scope.
- The component does not own long-term persistence: queued-but-unsent files
  are transient session state and are lost on navigation away from the host
  page; the backend repository is the durable source of truth for attached
  files.
- The Uploader is a self-contained component the wizard instantiates as a
  step. It assumes the parent entity already exists (so a `taskId` is
  available); wizard steps embedding it are responsible for showing a
  defensive empty state when that id is not yet available.
- The "zadanie wizard" referenced by the user maps to the existing
  `TasksWizard` under `src/components/tasks-wizard/`; the demo step is added
  to its page sequence as page 2.
- The component is consumed inside this repository's React tree, so a
  TanStack Query `QueryClientProvider` is always in scope; the component uses
  TanStack Query internally for caching, mutation, and SSR hydration of the
  stored-file list.
- Filename uniqueness across queue and repository is not enforced by the
  component. If a specific consumer's backend requires it, the adapter
  surfaces the constraint as a normal validation error.
- Authentication, authorisation, and virus scanning are handled by the
  backend and are out of scope for the component itself.
- Resumable / chunked uploads are out of scope; uploads are single-request
  transfers that can be cancelled but not paused.
- File reordering / sort handling, role-based action gating beyond the
  per-row capability callback, and any knowledge-base / external-indexing
  side effects observed in the legacy example component are explicitly out
  of scope for this iteration.
- Metadata field rendering is limited to the built-in kinds (`text`,
  `number`, `select`, `checkbox`, `date`) plus the per-field `render` escape
  hatch; rich editors and conditional field logic are out of scope.
- Upload requests are `multipart/form-data` with a `file` part and a JSON
  `metadata` part; metadata-edit requests are `application/json`. This is
  the contract the mock backend implements and the real backend is expected
  to mirror.
- Real upload progress requires `XMLHttpRequest` (the `fetch` API cannot
  report upload progress). The project provides an `xhrUpload` helper that
  adapters use; it also produces typed `UploaderError` values from XHR
  responses.
- Downloads are fetched via the adapter as `{ blob, filename }` and triggered
  client-side by creating an anchor with the `download` attribute. This
  guarantees the correct filename but means each downloaded file is buffered
  in browser memory; the configured `maxSize` keeps this within reasonable
  bounds.
- The cancellation contract is split: the client guarantees timely UI
  feedback (SC-004a); the backend guarantees no orphan stored file by
  treating aborted POSTs as non-committed (SC-004b). The component does not
  issue a compensating delete on cancel.
- List mutations (upload complete, metadata edit, delete) update the cached
  file list optimistically and roll back on error, per the project's
  `api-mutation-pattern`.

## Resolved Design Decisions

Following a grilling session on 2026-05-22, the following design forks were
resolved. They are recorded here to keep the spec self-contained for the
planning phase; the corresponding requirements and assumptions above are the
normative source.

| # | Decision |
|---|---|
| Q1 | Uploader is self-contained; wizard hosts it as a step. Component owns the in-session queue; backend repository is durable state. |
| Q2 | Adapter-driven integration (consumer passes an `UploadAdapter<TMeta>`), not URL-driven. |
| Q3 | Component is generic over `TMetadata`; UI described by `MetadataField<TMeta>[]`; optional `validate` callback for boundary validation. |
| Q4 | Schema-driven rendering by default, with per-field `render` override for custom inputs. |
| Q5 | Client aborts only; "no orphan" is a backend contract (no `cancelUpload` adapter method). |
| Q6 | Download via `adapter.download() → { blob, filename }`; client triggers save by creating an `<a download>`. |
| Q7 | Duplicate filenames allowed silently; uniqueness (if needed) is the adapter's responsibility. |
| Q8 | TanStack Query used internally; adapter is the `queryFn`; consumer passes a `queryKey`. |
| Q9 | Inline messages are the primary surface; optional batch `onNotify` callback (component does not import the toast module). |
| Q10 | `readOnly?: boolean` plus per-row `canMutateRow?(file) => { edit, delete }`. |
| Q11 | Attachments step placed as page 2 of the wizard (after `start`); parent id always available; defensive empty state otherwise. |
| Q12 | `react-dropzone` for the drag-and-drop primitive. |
| Q13 | "Upload all" runs 3 transfers in parallel internally; not exposed as configuration. |
| Q14 | Real byte-level progress required via a shared `xhrUpload` helper (XHR-based). |
| Q15 | Live validation feedback while editing, plus blocking at upload time; "Upload all" skips invalid rows. |
| Q16 | Optimistic updates with rollback for all three mutations (upload, edit, delete). |
| Q17 | Wire format: `multipart/form-data` with `file` part + JSON `metadata` part for uploads; `application/json` for metadata edits. |
| Q18 | Component at `src/components/uploader/`; per-domain adapters at `src/lib/api/domains/<domain>/files-adapter.ts`; HTTP helper at `src/lib/api/core/xhr-upload.ts`; wizard step at `src/components/tasks-wizard/pages/AttachmentsPage.tsx`; MSW handlers at `src/mocks/handlers/task-files.ts`. |
| Q19 | Typed `UploaderError` union (`cancelled` / `network` / `validation` / `server` / `unknown`); field-level validation errors route to specific metadata inputs. |
| Q20 | Demo schema and config recorded in the US6 acceptance section. |
