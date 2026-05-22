---

description: "Tasks for 019-upload-component"
---

# Tasks: Configurable File Upload Component

**Input**: Design documents from `/specs/019-upload-component/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Branch**: `019-upload-component`

**Tests**: Not generated. Constitution §IX forbids automated test files. All validation is manual against acceptance scenarios + success criteria in `spec.md`.

**Organization**: Tasks grouped by user story (US1 = P1, US4 = P1, US2 = P2, US3 = P2, US5 = P2, US6 = P3). MVP = US1 + US4 + US6 (smallest end-to-end demo).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (touches different files, no incomplete dependencies)
- **[Story]**: US1–US6 maps to spec.md user stories

## Path Conventions

Real repo layout (Next.js 16 App Router, `src/` based):
- Component: `src/components/uploader/` (+ `parts/`)
- HTTP core: `src/lib/api/core/`
- Domain adapter: `src/lib/api/domains/tasks/`
- Wizard step: `src/components/tasks-wizard/pages/`
- Mocks: `src/mocks/handlers/`, `src/mocks/data/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the one new dependency and lay down the empty package skeleton.

- [X] T001 Add `react-dropzone` to `package.json` (latest 14.x) and run `pnpm install`; verify lockfile updates cleanly
- [X] T002 Create directory skeleton `src/components/uploader/` with `parts/` subdir and an empty `index.ts` (no exports yet)
- [X] T003 [P] Create directory skeleton `src/lib/api/domains/tasks/` files-adapter and files-contract stubs (empty modules) at `src/lib/api/domains/tasks/files-adapter.ts` and `src/lib/api/domains/tasks/files-contract.ts`
- [X] T004 [P] Create directory skeleton for mocks: empty `src/mocks/handlers/task-files.ts` and `src/mocks/data/task-files.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Public types, the XHR helper, error mapping, and copy bundle — everything every user story depends on.

- [X] T005 [P] Create `src/components/uploader/types.ts` with the exact shapes from `specs/019-upload-component/contracts/component.ts` (re-exports `StoredFile`, `UploadAdapter`, `UploaderError`)
- [X] T006 [P] Create `src/lib/api/core/xhr-upload.ts` per contracts/adapter.ts §`xhrUpload` (XHR wrapper with `upload.onprogress`, AbortSignal wiring, status→`UploaderError` mapping; strips `metadata.` prefix from `errors` keys)
- [X] T007 [P] Create `src/lib/api/core/file-upload.ts` exporting `buildUploadFormData(file, metadata)` per contracts/adapter.ts (uses `new Blob([...], { type: 'application/json' })` for the metadata part)
- [X] T008 [P] Create `src/lib/api/core/upload-errors.ts` exporting `mapBrowserFetchError(err)` → `UploaderError`, used by adapter list/edit/delete paths
- [X] T009 [P] Create `src/components/uploader/copy.ts` with the full Polish `UploaderCopy` defaults per quickstart.md and contracts/component.ts
- [X] T010 Create `src/components/uploader/use-uploader-queue.ts` — pure local-state hook (no network): manages `UploadItem<TMeta>[]`, validates files against `UploaderConfig`, applies field defaults from `MetadataField[]`, exposes `add/remove/update/setStatus/setProgress/setError/clear`

**Checkpoint**: Public types + helpers compile; nothing renders yet but every story can begin in parallel.

---

## Phase 3: User Story 1 — Upload one file with feedback (Priority: P1)

**Goal**: A consumer can mount the Uploader, drop one file, see byte-level progress, and see it move into the stored-file list on success.

**Independent Validation**: Mount `<Uploader>` in a throwaway test page or the wizard demo (after US6), drop a 2 MB PDF, observe: progress bar animates from 0→100%, success removes queue row, stored-file list shows new entry within 5 s (SC-001).

### Implementation for User Story 1

- [X] T011 [P] [US1] Create `src/components/uploader/parts/DropzoneArea.tsx` — uses `react-dropzone` with `noClick: true, multiple: true`; renders the drop region + Polish label + explicit "Wybierz pliki" button calling `open()`; respects `readOnly`
- [X] T012 [P] [US1] Create `src/components/uploader/parts/MetadataFields.tsx` — schema-driven renderer mapping `MetadataFieldKind` → shadcn primitive (`Input`/`Input number`/`Select`/`Checkbox`/`Popover+Calendar`); honors per-field `render` override; shows per-field error string
- [X] T013 [P] [US1] Create `src/components/uploader/parts/QueueRow.tsx` — renders one `UploadItem`: filename, size, MetadataFields, `Progress` bar when uploading, action buttons (Prześlij, Anuluj, Usuń); shows `UploaderError` UX per data-model.md §5 table
- [X] T014 [US1] Create `src/components/uploader/use-uploader-mutations.ts` — TanStack Query: `useQuery({ queryKey, queryFn: ({signal}) => adapter.list(signal), staleTime: 0 })`; `useMutation` for upload (optimistic prepend to list cache, rollback on error, invalidate on settle); per-row `AbortController` registry keyed by item id; field-error routing from `UploaderError.validation.fieldErrors` into the queue item
- [X] T015 [US1] Create `src/components/uploader/parts/QueueList.tsx` — renders the list of `QueueRow` from `use-uploader-queue`; hides itself when queue is empty; wires per-row upload/cancel buttons to `use-uploader-mutations`
- [X] T016 [US1] Create `src/components/uploader/Uploader.tsx` — top-level component composing `DropzoneArea` + `QueueList` + repository placeholder; merges `copy` prop with defaults; calls boundary `validate?` before upload; sets `'use client'`; wires `onNotify`
- [X] T017 [US1] Update `src/components/uploader/index.ts` to export `Uploader` and the public types from `types.ts`
- [X] T018 [US1] Verify light/dark theme parity and mobile layout on the dropzone + queue row; confirm progress bar respects `aria-live="polite"` and the dropzone is keyboard-activatable (Space/Enter)

**Checkpoint**: One-file upload works end-to-end against any adapter; no repository list yet (placeholder); independently demoable.

---

## Phase 4: User Story 4 — Manage files already stored (Priority: P1)

**Goal**: List, edit metadata, delete (with confirm), and download stored files.

**Independent Validation**: With seeded stored files (US6 setup or any consumer), the repository list renders ≤ 2 s (SC-007), Edit dialog opens, save reflects in list ≤ 2 s (SC-009), Delete shows confirm and removes row ≤ 1 s (SC-010), Download triggers a browser file save with the correct filename (SC-008).

### Implementation for User Story 4

- [X] T019 [P] [US4] Create `src/components/uploader/parts/RepositoryRow.tsx` — renders one `StoredFile<TMeta>`: filename, size, uploadedAt (formatted Polish), inline metadata summary; action buttons (Pobierz, Edytuj, Usuń) gated by `canMutateRow?`
- [X] T020 [P] [US4] Create `src/components/uploader/parts/DeleteConfirmDialog.tsx` — shadcn `Dialog` with Polish copy from `UploaderCopy.deleteConfirmTitle/Body`; focus-trapped; primary action triggers passed-in `onConfirm`
- [X] T021 [P] [US4] Create `src/components/uploader/parts/EditDialog.tsx` — shadcn `Dialog` containing `MetadataFields` in a TanStack Form (Zod if consumer passes one, otherwise schema-required check); submit calls mutation; disabled while invalid; closes optimistically on submit
- [X] T022 [US4] Extend `src/components/uploader/use-uploader-mutations.ts` with three new mutations: `editMetadata` (optimistic update of cached list entry, rollback on error), `deleteFile` (optimistic remove, rollback on error, success notify), `downloadFile` (no cache write; triggers `<a download={filename}>` from `adapter.download` result blob via `URL.createObjectURL`); all three use `onSettled: invalidate(queryKey)`
- [X] T023 [US4] Create `src/components/uploader/parts/RepositoryList.tsx` — reads cached list via `useQuery`, renders title + empty state + array of `RepositoryRow`; mounts `EditDialog` and `DeleteConfirmDialog` controlled by row-level state; emits `onNotify` for delete success and list-fetch failure (when no cached data)
- [X] T024 [US4] Wire `RepositoryList` into `src/components/uploader/Uploader.tsx` (replace placeholder from T016); ensure `readOnly` hides Edit/Delete and keeps Download
- [X] T025 [US4] Verify light/dark theme on dialogs, focus restoration after dialog close, table-to-stacked-cards responsive collapse on narrow viewports

**Checkpoint**: Full repository management works against any adapter that implements list/updateMetadata/delete/download.

---

## Phase 5: User Story 2 — Bulk upload with cancel (Priority: P2)

**Goal**: User can drop many files, click "Przekaż wszystkie", see all rows transferring (3 in parallel internally), cancel any single in-flight row or all of them.

**Independent Validation**: Drop 10 files, click Upload all, watch ≤ 3 progress bars animate simultaneously; cancel one mid-transfer (row resets to ready within 1 s — SC-004a); cancel all halts pending and aborts in-flight (SC-004b); batch completion fires one `onNotify` summary (SC-003).

### Implementation for User Story 2

- [ ] T026 [US2] Extend `src/components/uploader/use-uploader-mutations.ts` with a `uploadAll()` orchestrator: maintains a semaphore of 3, skips items whose metadata fails boundary `validate?` (counted as `skipped`), aggregates ok/skipped/failed and emits one `UploaderNotification` via `onNotify` on completion
- [ ] T027 [US2] Extend `src/components/uploader/use-uploader-mutations.ts` with `cancelOne(id)` and `cancelAll()` helpers using the per-row `AbortController` registry from T014; pending (not-yet-started) items reset to `ready` without ever calling the adapter
- [ ] T028 [US2] Update `src/components/uploader/parts/QueueList.tsx` header with "Przekaż wszystkie" + "Anuluj wszystkie" buttons (gated by queue state) wired to T026/T027
- [ ] T029 [US2] Verify SC-004a (single cancel ≤ 1 s) and SC-003 (10-file batch reaches terminal state) manually against the MSW backend

**Checkpoint**: Batch workflows complete; per-row UX from US1 unchanged.

---

## Phase 6: User Story 3 — Enforced configuration limits (Priority: P2)

**Goal**: Adding files that violate `maxFiles`/`maxSize`/`allowedExtensions` are rejected inline with Polish messages; valid files proceed normally.

**Independent Validation**: Configure `{ maxFiles: 2, maxSize: 1024, allowedExtensions: ['pdf'] }`, drop one 2 KB pdf + one .jpg + one .pdf when 2 are already queued → expect three distinct error messages and no enqueue (FR-014, SC-006).

### Implementation for User Story 3

- [ ] T030 [US3] Extend `src/components/uploader/use-uploader-queue.ts` `add(files)` to apply the four validation rules from data-model.md §1 (size, empty, extension, total-count) using the consumer's `UploaderConfig`; return `{ accepted, rejected: { file, reason }[] }`
- [ ] T031 [US3] Update `src/components/uploader/parts/DropzoneArea.tsx` to surface rejections as inline `Alert` entries underneath the dropzone with the Polish error strings from `UploaderCopy.errors.*`; auto-dismiss after 6 s
- [ ] T032 [US3] Verify SC-006 manually: each rule produces the correct Polish message and never enqueues invalid files

**Checkpoint**: Limit enforcement is honest and visible; no silent drops.

---

## Phase 7: User Story 5 — Edit per-file metadata before upload (Priority: P2)

**Goal**: Per-row metadata inputs (already from US1's MetadataFields) are fully usable inline; clicking Upload on a row with missing required fields shows per-field errors instead of submitting; "Przekaż wszystkie" skips invalid rows.

**Independent Validation**: Queue a file, leave a required field blank, click row Upload → button blocked + field marked red (FR-021/SC-002); fill it → upload proceeds; mixed-validity batch via Upload all → only valid uploaded, summary reports skipped count (FR-021, T026 behavior).

### Implementation for User Story 5

- [ ] T033 [US5] Extend `src/components/uploader/parts/QueueRow.tsx` to compute per-render validity from `MetadataField.required` + consumer `validate?`; disable the row's Upload button when invalid; surface per-field error strings into `MetadataFields` props
- [ ] T034 [US5] Confirm `use-uploader-mutations.ts` `uploadAll()` (T026) honors the validity check and counts invalid rows as `skipped` rather than `failed`
- [ ] T035 [US5] Verify SC-002 (live validation) and FR-021 (upload-all skips invalid) manually

**Checkpoint**: Metadata UX feels alive; no surprise validation at submit time.

---

## Phase 8: User Story 6 — Live demo inside zadanie wizard (Priority: P3)

**Goal**: A new "Załączniki" step in `TasksWizard` mounts the Uploader against the mock task-files backend with two seeded files and a `?fail=true` toggle.

**Independent Validation**: `pnpm dev` → `/wizard-demo` → create task → land on "Załączniki" with two seeded files visible; upload, edit, delete, download all work; `?fail=true` triggers a 422 with the category field highlighted on every 3rd upload (R9, demo configuration in spec.md US6).

### Implementation for User Story 6

- [X] T036 [P] [US6] Define `TaskFileMeta` + `StoredTaskFile` in `src/lib/api/domains/tasks/files-contract.ts` per data-model.md §10
- [X] T037 [P] [US6] Implement `taskFilesAdapter(taskId)` in `src/lib/api/domains/tasks/files-adapter.ts` per quickstart.md Step 2 — list/edit/delete via `browserFetch`+`mapBrowserFetchError`, upload via `xhrUpload`+`buildUploadFormData`, download via plain `fetch` returning `{blob, filename}`
- [X] T038 [P] [US6] Implement `src/mocks/data/task-files.ts` — in-memory `Map<number, StoredTaskFile[]>` with the two seed entries for taskId=1 specified in contracts/http.md §7
- [X] T039 [US6] Implement `src/mocks/handlers/task-files.ts` — five handlers (GET list, POST upload with size-scaled latency cap 2 s and `?fail=true` 422-every-3rd toggle, PUT edit, DELETE, GET download) per contracts/http.md §1–§5
- [X] T040 [US6] Register `taskFilesHandlers` in `src/mocks/handlers/index.ts` (single-line append; no other handlers touched)
- [X] T041 [P] [US6] Create `src/components/tasks-wizard/pages/task-file-schema.ts` with `taskFileFields` and `taskFileConfig` per quickstart.md Step 1
- [X] T042 [US6] Create `src/components/tasks-wizard/pages/AttachmentsPage.tsx` per quickstart.md Step 3 — reads `taskId` from wizard form context, renders empty-state when `null`, mounts `<Uploader<TaskFileMeta>>` with `queryKey: ['tasks', taskId, 'files']` and `onNotify` wired to existing `toast` module; respects `mode === 'view'` → `readOnly`
- [X] T043 [US6] Edit `src/components/tasks-wizard/TasksWizard.tsx` to insert `'attachments'` page at index 1 of the `pages` array (between `start` and `schedule`); single-line edit per plan.md §Constraints
- [X] T044 [US6] Verify the demo end-to-end against quickstart.md §"Verifying the demo locally" steps 1–9; confirm SC-005 (≤ 3 clicks from wizard entry to dropzone)

**Checkpoint**: Demo runs against MSW; nothing in the generic component knows about tasks.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T045 [P] Run the `missspell-checker` skill over `src/components/uploader/copy.ts` + `src/components/tasks-wizard/pages/AttachmentsPage.tsx` for Polish diacritics and typos
- [ ] T046 [P] Run the `aria-check` skill over `Uploader.tsx`, `DropzoneArea.tsx`, `QueueRow.tsx`, `EditDialog.tsx`, `DeleteConfirmDialog.tsx` — fix any focus, label, or live-region gaps
- [ ] T047 Audit all files under `src/components/uploader/` and `src/lib/api/core/{xhr-upload,file-upload,upload-errors}.ts` and remove inline comments that are not the carved-out cancellation TODO (constitution §IX)
- [ ] T048 [P] Verify SC-001 (5 MB upload ≤ 5 s on MSW), SC-007 (list ≤ 2 s), SC-009 (edit ≤ 2 s), SC-010 (delete ≤ 1 s), FR-034 (progress cadence ≤ 100 ms) using browser devtools timing on the demo route
- [ ] T049 Run `pnpm lint` and `pnpm build`; fix any new warnings/errors introduced by this feature
- [ ] T050 Mark `specs/019-upload-component/checklists/requirements.md` items as still passing post-implementation (or note deviations)

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): no deps, runs immediately
- Phase 2 (Foundational): depends on Phase 1; blocks every user story
- Phase 3 (US1): depends on Phase 2
- Phase 4 (US4): depends on Phase 2 (independent of US1)
- Phase 5 (US2): depends on US1 (extends `use-uploader-mutations` and `QueueList` from US1)
- Phase 6 (US3): depends on Phase 2 (extends `use-uploader-queue` from T010 and `DropzoneArea` from T011)
- Phase 7 (US5): depends on US1 (extends `QueueRow` from T013); needs US2's `uploadAll` for the batch-skip behavior
- Phase 8 (US6): depends on US1 + US4 (the demo exercises both surfaces); benefits from US2/US3/US5 being done
- Phase 9 (Polish): depends on every desired user story being complete

### Critical-Path / MVP

**Minimum demoable end-to-end**: Phase 1 → Phase 2 → US1 → US4 → US6
(skip US2/US3/US5 if needed; bulk, limits and pre-validation can land in a follow-up).

### Parallel Opportunities

- **Within Phase 1**: T003 ∥ T004 ∥ (T002 sequential with the dir creation in T001)
- **Within Phase 2**: T005 ∥ T006 ∥ T007 ∥ T008 ∥ T009 (T010 last; consumes T005)
- **Within US1**: T011 ∥ T012 ∥ T013 (all leaf parts), then T014, T015, T016, T017, T018 sequentially
- **Within US4**: T019 ∥ T020 ∥ T021, then T022, T023, T024, T025
- **Within US6**: T036 ∥ T037 ∥ T038 ∥ T041 first; then T039 → T040 → T042 → T043 → T044
- **Across stories**: After Phase 2, US1 ∥ US4 ∥ US3 can begin simultaneously by different agents (they touch disjoint files); US2/US5 must wait for US1; US6 must wait for US1 + US4
- **Phase 9**: T045 ∥ T046 ∥ T048 (different surfaces); T047, T049, T050 sequential

---

## Validation Summary

- **Total tasks**: 50
- **Per story**: Setup=4 · Foundational=6 · US1=8 · US4=7 · US2=4 · US3=3 · US5=3 · US6=9 · Polish=6
- **Independent test criteria**: each user-story checkpoint above lists the manual SC/FR to verify
- **MVP**: US1 + US4 + US6 (skip US2/US3/US5)
- **Format check**: every task has `- [ ]`, TaskID `T0nn`, optional `[P]`, story label only on story-phase tasks, file paths in descriptions ✅
- **No test tasks generated** (constitution §IX) ✅
- **All file paths grounded** in the real repo structure from plan.md §Project Structure ✅

---

## Notes

- `[P]` strictly means "different file, no incomplete dependency". Anything that extends a file created in an earlier same-phase task is sequential.
- The `taskFilesAdapter` (T037) deliberately re-implements the same shape MSW handlers serve (T039); they are two halves of the same contract from `contracts/http.md`.
- Per FR-009, cancellation does NOT call any compensating delete; the only place this might tempt a future contributor is T027 — keep the single `// TODO:` comment allowed by the constitution there.
- Real Laravel backend integration is out of scope for this feature; the contract in `contracts/http.md` is the handoff.

