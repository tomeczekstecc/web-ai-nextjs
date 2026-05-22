# Implementation Plan: Configurable File Upload Component

**Branch**: `019-upload-component` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-upload-component/spec.md`

## Summary

Build a single, generic `<Uploader<TMeta>>` component plus the supporting
plumbing the rest of the codebase will use to mount it against any backend
file resource. The component is **self-contained** (owns its in-session
queue; uses TanStack Query against a consumer-supplied
`UploadAdapter<TMeta>` for the durable repository list and all mutations),
**schema-driven** for per-file metadata (built-in input kinds + per-field
`render` escape hatch), **strict about types end-to-end** (one `TMetadata`
generic flows through props, adapter, and entities), and **honest about
failures** (typed `UploaderError` union with field-level routing of backend
validation errors). It ships with an `xhrUpload` helper at
`src/lib/api/core/` that gives every adapter real byte-level progress and
typed error mapping; a `taskFilesAdapter` at
`src/lib/api/domains/tasks/files-adapter.ts`; an MSW handler set at
`src/mocks/handlers/task-files.ts` that simulates progress, supports a
`?fail=true` toggle, and seeds two stored files for the demo; and an
`AttachmentsPage` step inserted as page 2 of the existing `TasksWizard`,
between `start` and `schedule`.

Approach in one paragraph: the component is composed from small parts in
`src/components/uploader/parts/` (DropzoneArea, QueueList, QueueRow,
RepositoryList, RepositoryRow, MetadataFields, EditDialog,
DeleteConfirmDialog) sitting on top of two custom hooks
(`use-uploader-queue` for transient client state,
`use-uploader-mutations` for the TanStack-Query-backed list query plus the
three optimistic mutations) and one drag-and-drop hook (`react-dropzone`
per Q12). All TanStack-Query writes (upload-complete, edit-metadata,
delete) follow the project's documented optimistic-with-rollback pattern.
The wire format is `multipart/form-data` with a `file` part plus a JSON
`metadata` part for uploads, and plain JSON for metadata edits. Inline
state on each row is the canonical user-visible surface; a single optional
`onNotify` callback emits batch-level summaries (Upload-all done,
list-fetch failure) so consumers can wire it to the shared `toast` module
without the component itself importing it. Polish copy lives in
`src/components/uploader/copy.ts` and is overridable via a `copy?` prop.

## Technical Context

**Language/Version**: TypeScript 5.8.x (project default)
**Primary Dependencies**: Next.js 16 App Router, React 19, TanStack Query 5
(already installed and provided at app root), shadcn/ui (base-nova) for
`Dialog`, `Button`, `Input`, `Select`, `Checkbox`, `Calendar/Popover`
(date), `Progress`, `Badge`, `Table`, `Alert`; `lucide-react` for icons
(`Upload`, `X`, `RotateCcw`, `Trash2`, `Pencil`, `Download`, `Paperclip`);
`react-dropzone` (new dependency, Q12) for drag-and-drop; existing
`@/components/toast` (sonner) wired by consumers via `onNotify`. MSW for
the demo backend (already installed and wired in `src/mocks/`).
**Storage**: Browser memory for the in-session queue (transient,
non-persisted by design — Q1). The stored-file list lives in TanStack
Query's cache keyed by the consumer-supplied `queryKey`. The demo's mock
backend keeps an in-memory `Map<taskId, StoredFile<TaskFileMeta>[]>` in
`src/mocks/data/task-files.ts`.
**Testing**: N/A — constitution §IX forbids automated tests.
**Target Platform**: Modern evergreen browsers in secure contexts (HTTPS or
`localhost`). `XMLHttpRequest.upload.onprogress` is universally supported;
the rest is standard DOM.
**Project Type**: Web frontend (Next.js App Router, `src/` layout).
**Performance Goals**:
- Single 5 MB upload from drop to success ≤ 5 s on the mock backend (SC-001)
- 10-file "Upload all" reaches terminal state without manual intervention
  (SC-003), running 3 parallel transfers internally (Q13)
- Stored-file list renders ≤ 2 s on first mount (SC-007)
- Edit-metadata reflected in list ≤ 2 s (SC-009)
- Progress updates ≤ 100 ms cadence during transfer (FR-034)
- Cancel returns row to ready ≤ 1 s (SC-004a)
**Constraints**:
- Polish UI everywhere user-visible (built-in messages, demo step,
  confirmation dialogs) — constitution §VII
- Light + dark theme parity via existing tokens — constitution §VII
- Desktop + mobile responsiveness; dropzone keeps a 44px+ hit target on
  the action button per the accessibility skill
- Constitution §III: surgical edits limited to: `src/components/uploader/`
  (new), `src/lib/api/core/` (two new helpers), `src/lib/api/domains/tasks/`
  (new `files-adapter.ts` + `files-contract.ts`), `src/mocks/handlers/` (new
  `task-files.ts` + index registration), `src/mocks/data/` (new
  `task-files.ts`), `src/components/tasks-wizard/` (new `AttachmentsPage`
  + a one-line page-array edit in `TasksWizard.tsx`).
- Constitution §IX: no test files; no inline comments except the security
  / TODO carve-outs.
- Constitution §V (frontend-decoupled-from-Laravel): the backend contract
  is documented in `contracts/http.md` so the Laravel team can mirror it
  later; no implementation depends on a specific PHP framework.
**Scale/Scope**: 1 new generic component package
(`src/components/uploader/` with ~10 files), 2 new HTTP helpers in
`src/lib/api/core/`, 1 new domain adapter + contract module in
`src/lib/api/domains/tasks/`, 1 new MSW handler module + 1 new in-memory
store, 1 new wizard step + 1 one-line edit to `TasksWizard.tsx`, 1 new
`package.json` dependency (`react-dropzone`). Expected delta: ~20 files
created, ~3 files edited, ~1200 LOC total (including the component's
internal parts and the mock backend).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | Notes |
|-----------|---------|-------|
| I. Think Before Coding | ✅ | Spec rev 3 + the 20-question grilling session captured every meaningful design fork. Plan codifies the outcome. |
| II. Simplicity First | ✅ | One generic component; one adapter shape; no plugin system; no configurable concurrency; no headless/`asChild` split; no remote-config loader; no compensating-delete on cancel; no two-phase upload. |
| III. Surgical Changes | ✅ | Edits confined to the paths listed in *Constraints*. No refactor of existing `Wizard`, `WizardProvider`, `TasksWizard` (other than inserting one page in the `pages` array), or any unrelated mock handler. |
| IV. Goal-Driven Execution | ✅ | 11 measurable success criteria (SC-001 through SC-010 with SC-004 split). Each FR maps to acceptance scenarios in spec rev 3. |
| V. Frontend-First, Backend-Decoupled | ✅ | The component knows nothing about HTTP URLs or Laravel; everything goes through `UploadAdapter<TMeta>`. The wire contract is documented in `contracts/http.md` for the Laravel team. The demo runs on MSW; nothing in `src/components/uploader/` references Laravel idioms. |
| VI. TypeScript, App Router, Design System | ✅ | Generic-typed end-to-end; built on shadcn/ui primitives (`Dialog`, `Button`, `Input`, `Select`, `Checkbox`, `Calendar`, `Progress`, `Badge`, `Table`, `Alert`); demo step lives under `src/app/(app)/wizard-demo/` via the existing wizard. |
| VII. Polish UI, Responsiveness, Theme Parity | ✅ | Default copy in `copy.ts` is Polish; row layout collapses cleanly on narrow viewports (table → stacked cards via existing shadcn `Table` patterns); component uses theme tokens only, no hardcoded colors; dialogs respect `prefers-color-scheme` like the rest of the app. |
| VIII. Clean Code, KISS, DRY | ✅ | Single chokepoint for byte-level upload (`xhrUpload`); single chokepoint for the metadata-field renderer (`MetadataFields.tsx`); the three mutation hooks share an optimistic-rollback shape derived from the project's `api-mutation-pattern`. |
| IX. No Tests, Minimal Comments | ✅ | No test files anywhere in this feature. The only planned comment is a `// TODO:` marker noting the deliberate "no compensating delete on cancel — backend contract per FR-009" in the cancellation code path, kept as security-relevant context per the constitution's carve-out. |

**Verdict**: PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/019-upload-component/
├── spec.md
├── plan.md                  ← this file
├── research.md              ← Phase 0
├── data-model.md            ← Phase 1
├── quickstart.md            ← Phase 1
├── contracts/
│   ├── http.md              ← wire contract for the Laravel team
│   ├── adapter.ts           ← TypeScript adapter contract (UploadAdapter<TMeta>)
│   └── component.ts         ← public component props (UploaderProps<TMeta>)
└── checklists/
    └── requirements.md      ← from /speckit.specify rev 2; still passing
```

### Source Code (repository root) — files touched

```text
src/
├── components/
│   ├── uploader/                                ← NEW (generic, ~10 files)
│   │   ├── Uploader.tsx                         ← public component
│   │   ├── types.ts                             ← public types (re-exports from contracts)
│   │   ├── use-uploader-queue.ts                ← local queue state hook
│   │   ├── use-uploader-mutations.ts            ← TanStack Query list + 3 mutations
│   │   ├── copy.ts                              ← Polish defaults
│   │   ├── parts/
│   │   │   ├── DropzoneArea.tsx
│   │   │   ├── QueueList.tsx
│   │   │   ├── QueueRow.tsx
│   │   │   ├── RepositoryList.tsx
│   │   │   ├── RepositoryRow.tsx
│   │   │   ├── MetadataFields.tsx               ← schema-driven renderer (Q4)
│   │   │   ├── EditDialog.tsx
│   │   │   └── DeleteConfirmDialog.tsx
│   │   └── index.ts                             ← public exports
│   └── tasks-wizard/
│       ├── TasksWizard.tsx                      ← EDIT: insert 'attachments' page in pages[]
│       └── pages/
│           └── AttachmentsPage.tsx              ← NEW: mounts <Uploader<TaskFileMeta>>
├── lib/
│   └── api/
│       ├── core/
│       │   ├── xhr-upload.ts                    ← NEW: progress + AbortSignal + UploaderError mapping
│       │   └── file-upload.ts                   ← NEW: buildUploadFormData(file, metadata)
│       └── domains/
│           └── tasks/
│               ├── files-adapter.ts             ← NEW: taskFilesAdapter(taskId) → UploadAdapter<TaskFileMeta>
│               └── files-contract.ts            ← NEW: TaskFileMeta, StoredTaskFile types
└── mocks/
    ├── data/
    │   └── task-files.ts                        ← NEW: in-memory Map + seeds
    └── handlers/
        ├── index.ts                             ← EDIT: register taskFilesHandlers
        └── task-files.ts                        ← NEW: list/upload/edit/delete/download handlers

package.json                                     ← EDIT: add "react-dropzone"
```

**Structure Decision**: All paths follow the existing repo grain. The
generic `Uploader` lives next to `src/components/wizard/` (precedent for a
non-trivial, stateful, reusable composition); per-domain adapters live next
to existing `client.ts` in their domain folder; HTTP helpers extend the
existing `src/lib/api/core/` neighbourhood; MSW handlers mirror the
existing per-domain file pattern. No new top-level directory.

## Complexity Tracking

> Constitution Check passed. The following items would otherwise look like
> complexity and are recorded here so reviewers can see they were
> deliberate, not accidental.

| Apparent complexity | Why it's here | Simpler alternative rejected because |
|---|---|---|
| Generic `<Uploader<TMeta>>` with full type flow | The component is reused across unknown future domains; `unknown`/`Record<string, unknown>` metadata loses compile-time safety where it matters most (typo'd field keys, wrong value shapes). | Untyped metadata (`Record<string, unknown>`) — discussed in Q3, rejected because it pushes runtime casting onto every consumer. |
| Adapter seam instead of URL props | The repo enforces a DDD API layering (`AGENTS.md`); raw URL props would bypass `src/lib/api/` and couple the component to a specific HTTP shape. | URL-driven (`uploadUrl`, `editUrl`, etc.) like the legacy `Uploader.jsx` — discussed in Q2, rejected. |
| TanStack Query inside a leaf component | The component lives in a repo that standardised on TanStack Query, including SSR prefetch via `HydrationBoundary`. Building a hand-rolled cache for the stored-file list would re-invent staleness handling badly. | Plain `useEffect` + `useState` for the list — discussed in Q8, rejected. |
| Typed `UploaderError` union with field-level routing | Backend validation errors that target specific metadata fields are common and the user-visible difference (red field vs generic row error) matters. A plain `Error` throws this information away. | Plain `Error` with `.message` — discussed in Q19, rejected. |
| `xhrUpload` helper instead of `fetch` | `fetch()` cannot report upload progress; FR-004 / SC-001 require real byte-level progress for the configured 5 MB files. | `fetch` with `onProgress(0); onProgress(100)` — discussed in Q14, rejected as dishonest UX. |

No deviations from the constitution; this table is informational only.
