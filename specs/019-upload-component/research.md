# Phase 0 — Research: Configurable File Upload Component

**Feature**: 019-upload-component
**Date**: 2026-05-22
**Status**: Complete (no NEEDS CLARIFICATION remaining)

## Scope of research

Spec rev 3 closed every design fork via the 2026-05-22 grilling session
(see `spec.md` → "Resolved Design Decisions" table). This document
captures the **technology-level** research that backs those decisions so
the implementation phase has a single place to consult for the
"why this library / why this API" questions.

---

## R1 — Drag-and-drop primitive

**Decision**: `react-dropzone` v14.x

**Rationale**:
- Cross-browser drag event normalization (Safari directory drops, Edge
  link-vs-file distinction, drag-counter handling) is non-trivial and
  battle-tested in this library.
- `noClick` separates the dropzone div from an explicit "Wybierz pliki"
  button, which matches the legacy UX pattern users in this domain are
  familiar with.
- Supplies an `open()` function for programmatic file-picker invocation,
  needed by our `<Button>` trigger.
- Accessibility-friendly defaults (focusable region, keyboard activation
  via Space/Enter on the hidden input).

**Alternatives considered**:
- **Hand-rolled `useDropzone` hook** (~50 LOC): smaller bundle, full
  control. Rejected by the user in Q12 in favor of the mature library;
  the cross-browser surface area is the deciding factor.
- **`@uploadthing/react`, `react-dropzone-esm` fork, etc.**: each ships
  more than we need (cloud-storage SDKs, upload orchestration) and would
  conflict with our adapter-driven architecture.

**Integration notes**:
- Use `{ noClick: true, multiple: true }` so the explicit button is the
  sole click-to-browse surface; the dropzone div is drag-only.
- Pass `accept` as `undefined` — we do extension-only validation
  client-side (per the spec's Assumption that MIME sniffing is out of
  scope), so the `accept` prop's MIME-guessing behaviour would just be
  noise.
- Wire the `onDrop(acceptedFiles)` callback into `use-uploader-queue` for
  validation and enqueuing.

---

## R2 — Real upload progress via `XMLHttpRequest`

**Decision**: A single `xhrUpload<T>()` helper in
`src/lib/api/core/xhr-upload.ts` wraps `XMLHttpRequest` for every adapter
that needs file uploads.

**Rationale**:
- `fetch()` cannot report upload progress in any current browser without
  experimental request-stream APIs that lack Safari support.
- `XHR.upload.onprogress` is universally supported and gives byte-level
  accuracy, which the spec's FR-034 ("≤100 ms cadence") requires.
- Centralising in one helper means: (a) every adapter uses the same code
  for abort + progress + status mapping; (b) the `UploaderError`
  conversion lives in exactly one place (per Q19); (c) future migration
  to streamed `fetch` is a single-file change.

**Alternatives considered**:
- **`axios`** (used by the legacy `Uploader.jsx`): provides
  `onUploadProgress` but adds a 13 kB dependency for one feature; the
  rest of the repo uses `fetch` (`browser-http.ts`). Inconsistent.
- **Streamed `fetch` with `duplex: 'half'`**: experimental, Safari does
  not support it, and we'd need to ship a polyfill or fallback anyway —
  defeats the simplicity goal.
- **Ignore progress, show indeterminate spinner**: rejected in Q14.

**Integration notes**:
- Helper signature (final, see `contracts/adapter.ts`):
  ```ts
  xhrUpload<T>(url: string, body: FormData | Blob, opts: {
    onProgress: (pct: number) => void;
    signal: AbortSignal;
    headers?: Record<string, string>;
    method?: 'POST' | 'PUT';
  }): Promise<T>
  ```
- `signal.addEventListener('abort', () => xhr.abort())` ties the
  `AbortController` into XHR's lifecycle.
- Response parsing: assume `application/json` body, wrap parse failures
  as `UploaderError.unknown`.
- Status mapping:
  - `0` (network/CORS/abort) + `signal.aborted` → `cancelled`
  - `0` otherwise → `network`
  - `2xx` → resolve with parsed JSON
  - `4xx` → `validation` (use response body's `message` and `errors` map)
  - `5xx` → `server`

---

## R3 — `multipart/form-data` with a JSON `metadata` part

**Decision**: Uploads send one `multipart/form-data` request containing a
`file` part (binary) and a `metadata` part with `Content-Type:
application/json` carrying the merged user metadata + `constantMetadata`.

**Rationale**:
- Preserves end-to-end type fidelity (booleans, numbers, dates as ISO
  strings) — flat form fields stringify everything and force coercion on
  the backend, fighting our `TMetadata` generic (Q3).
- Symmetric with the metadata-edit path, which is plain JSON over PUT.
- Universally supported by browsers' `FormData` API (`fd.append('metadata',
  new Blob([JSON.stringify(meta)], { type: 'application/json' }))`).
- Standard Laravel parses both parts trivially: `$request->file('file')`
  and `json_decode($request->input('metadata'), true)`.

**Alternatives considered**:
- **Flat form fields** (`fd.append('category', meta.category); ...`):
  legacy choice; loses types on the wire; requires the backend to know
  the schema to coerce; per-field stringification logic in every adapter.
- **Two requests** (POST metadata → PUT bytes): two round trips, two
  failure modes, two transactional concerns. Spec explicitly rejects this
  in FR-028.
- **Pre-signed URL pattern** (S3-style): overkill for the current backend
  story and contradicts the "no resumable/chunked" assumption.

**Integration notes**:
- Build helper in `src/lib/api/core/file-upload.ts`:
  ```ts
  export function buildUploadFormData(file: File, metadata: unknown): FormData {
    const fd = new FormData();
    fd.append('file', file);
    fd.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    return fd;
  }
  ```
  Note: using `new Blob([...], { type: 'application/json' })` (not a raw
  string) is the modern pattern that survives proxies and gives the
  backend a real `Content-Type` on the part — important for Laravel's
  multipart parser.

---

## R4 — TanStack Query usage pattern

**Decision**: Inside the Uploader, a single `useQuery` for the
stored-file list keyed by the consumer-supplied `queryKey`, plus three
`useMutation` hooks (upload-complete, edit-metadata, delete) following
the optimistic-with-rollback pattern documented in the project's
`context/api-mutation-pattern.md`.

**Rationale**:
- The repo's `wizard-demo/page.tsx` already prefetches via
  `HydrationBoundary` + `dehydrate`; the Uploader's list can join that
  pattern by accepting a `queryKey` prop.
- Optimistic updates honour SC-009 ("metadata edit reflected ≤ 2 s") by
  making the user-perceived latency near-zero; the round-trip is hidden.
- `onSettled: () => qc.invalidateQueries({ queryKey })` is the safety
  net that brings cache back into agreement with the server.

**Alternatives considered**:
- **No TanStack Query, manual state**: rejected in Q8; would re-implement
  caching badly and break the SSR-prefetch story.
- **`useInfiniteQuery` for the list**: there's no pagination requirement
  yet; keep it `useQuery` until a real consumer needs more.

**Integration notes**:
- `useQuery({ queryKey, queryFn: ({ signal }) => adapter.list(signal), staleTime: 0 })`.
  Set `staleTime: 0` because external mutations (e.g. backend-side
  background processing) can change the list independently; the
  optimistic mutations call `invalidateQueries` on settle, so we want a
  refetch then.
- All three mutations follow the same shape; factor a
  `useOptimisticListMutation<T>` helper inside
  `use-uploader-mutations.ts` to avoid copy-paste.
- `useMutation` accepts `mutationKey` so DevTools attributes the
  optimistic writes correctly; key them `[...queryKey, 'upload' | 'edit' | 'delete']`.

---

## R5 — Schema-driven metadata-field rendering with override

**Decision**: A `MetadataFields<TMeta>` component reads
`fields: MetadataField<TMeta>[]` and renders one input per field using a
small built-in catalog (`text` → `<Input>`, `number` → `<Input type=number>`,
`select` → `<Select>`, `checkbox` → `<Checkbox>`, `date` →
`<Popover>` + `<Calendar>` per shadcn's date-picker recipe). Each
`MetadataField` may supply a `render` function that completely replaces
the built-in renderer for that field.

**Rationale**:
- Per Q4, this matches 95% of cases with zero per-consumer code and
  preserves the escape hatch for the long tail.
- Reusing shadcn primitives means the demo, the edit dialog, and any
  future consumer all look identical — important for the spec's
  consistency goal.
- The renderer lives in one file (`MetadataFields.tsx`) and is used by
  both `QueueRow` (inline) and `EditDialog` (in the form).

**Alternatives considered**:
- **TanStack Form-driven rendering** (per the `tanstack-form` skill):
  attractive but overkill for the queue-row inline editor where fields
  are simple and there's no submit step. Use TanStack Form *inside* the
  `EditDialog` (which has a proper submit/validate/cancel flow) but keep
  the inline queue-row editor as plain controlled inputs.
- **Generic JSON-schema renderer** (`react-jsonschema-form`): heavyweight,
  opinionated about styling, conflicts with shadcn's grain.

**Integration notes**:
- Inline (`QueueRow`): controlled inputs, validation messages computed
  on each render from the `MetadataField` schema's `required` + the
  consumer's optional `validate?` function.
- Modal (`EditDialog`): TanStack Form with a Zod schema if the consumer
  passes one; falls back to schema-driven required-checking otherwise.
  Submit disabled while invalid; on submit, the optimistic mutation runs
  and the dialog closes immediately (rolls back + reopens on error).

---

## R6 — Cancellation, `AbortController`, and the backend contract

**Decision**: Every adapter call accepts a `signal: AbortSignal`. The
component creates one `AbortController` per in-flight operation. Cancel
calls `controller.abort()`. The component **does not** issue a
compensating delete — the spec's FR-009 makes "no orphan stored file" a
backend contract (POSTs must be transactional).

**Rationale**:
- Per Q5, this is the only honest design: the client can't undo bytes the
  server already committed; pretending otherwise creates false promises.
- Documenting it explicitly in `contracts/http.md` puts the obligation on
  the right side of the wire.
- TanStack Query's `queryFn` receives a `signal` for free; we forward it
  to `adapter.list()`. Mutations don't get a built-in signal — we create
  one per `mutationFn` invocation and store it keyed by row id so the
  per-row Cancel button can abort it.

**Alternatives considered**:
- **Compensating delete after abort**: Q5-B; adds an adapter method
  every consumer must implement correctly; defers the backend obligation
  to a place where it's easy to forget.
- **Two-phase upload (init/upload/commit)**: Q5-C; far too much
  machinery for a v1 that explicitly excludes resumable uploads.

**Integration notes**:
- The MSW handler for `POST /api/tasks/:id/files` simulates a real
  progressive transfer (200–2000 ms scaled by file size, with periodic
  partial reads to drive `xhr.upload.onprogress`); on `request.signal`
  abort, it throws and does not write to the in-memory store. This
  proves the contract end-to-end in the demo.

---

## R7 — Polish copy strategy

**Decision**: Default Polish strings live in
`src/components/uploader/copy.ts` as a typed object; consumers may pass
a `copy?: Partial<UploaderCopy>` prop to override individual labels.

**Rationale**:
- Constitution §VII mandates Polish UI.
- A single file is easy to audit (e.g. with the `missspell-checker`
  skill) and easy to extend.
- Partial-override pattern keeps the API tiny — no i18n framework, no
  message catalog scaffolding.

**Alternatives considered**:
- **i18next**: not used elsewhere in this repo; would be an outsized
  dependency for a single Polish-only project today.
- **Inline strings in every part**: violates DRY and makes the spell-check
  pass cover ten files instead of one.

**Integration notes**:
- Export type:
  ```ts
  export type UploaderCopy = {
    dropzoneDrag: string;        // "Upuść pliki tutaj"
    dropzoneIdle: string;        // "Przeciągnij pliki lub kliknij..."
    dropzoneButton: string;      // "Wybierz pliki"
    queueTitle: string;          // "Pliki oczekujące na przesłanie"
    repositoryTitle: string;     // "Pliki w repozytorium"
    uploadAll: string;           // "Przekaż wszystkie"
    cancel: string; cancelAll: string; retry: string; remove: string;
    edit: string; delete: string; download: string; save: string;
    deleteConfirmTitle: string; deleteConfirmBody: (n: string) => string;
    errors: { network: string; server: string; unknown: string; missingRequired: (label: string) => string; tooLarge: (max: string, actual: string) => string; tooMany: (max: number) => string; badExtension: (allowed: string[]) => string };
    notifications: { uploadAllDone: (ok: number, skipped: number, failed: number) => string; listFetchFailed: string; deleted: string };
  };
  ```

---

## R8 — Date-picker primitive

**Decision**: Use shadcn's recommended date-picker recipe (`Popover`
+ `Calendar` + `Button`) for the `date` metadata field kind. Store the
value as an ISO date string (`YYYY-MM-DD`) in `TMetadata` so the JSON
metadata part transports it cleanly.

**Rationale**:
- The repo already has `Calendar` and `Popover` in `src/components/ui/`.
- ISO date strings serialize / parse without timezone surprises and
  match the Laravel-side `date` column convention.

**Alternatives considered**:
- **Native `<input type="date">`**: inconsistent styling across browsers
  and breaks theme parity with the rest of the form.
- **`Date` object in `TMetadata`**: doesn't round-trip cleanly through
  JSON.stringify without a custom replacer; ISO string is the natural
  serializable form.

---

## R9 — MSW handler design for upload progress simulation

**Decision**: The mock POST handler for `/api/tasks/:id/files` returns
after a delay scaled to file size (~300 ms + 1 ms/KB, capped at 2 s)
with a 200 response. **Real progress events fire client-side from XHR
because XHR's `upload.onprogress` reports the bytes the *browser* has
sent to the network layer**, which under MSW is a real loopback transfer
to the service worker — so we get genuine, animated progress bars with
zero handler-side simulation.

**Rationale**:
- MSW intercepts at the network layer via a service worker; XHR uploads
  send real bytes that get intercepted, which gives real
  `upload.onprogress` events. We don't need to fake anything for the
  demo to feel right.
- The artificial delay on the *response* side is what gives the progress
  bar time to animate visibly for small files; without it, 100 KB
  uploads finish before the eye registers the bar moving.

**Alternatives considered**:
- **Use MSW + a separate progress simulator that drives `onProgress`
  manually**: fights the architecture; we'd have to bypass `xhrUpload`
  for the mock.
- **Use a different mock library (`msw` → `vitest-fetch-mock`, etc.)**:
  the repo standardised on MSW.

**Integration notes**:
- `?fail=true` query string on the wizard URL toggles a flag read by the
  handler; when set, the handler rejects every Nth upload (N=3) with a
  422 + `{ message: 'Plik odrzucony', errors: { 'metadata.category': 'Nieobsługiwana kategoria' } }` to prove field-level error routing
  (Q19) end-to-end in the demo.

---

## R10 — Wizard placement and form-context integration

**Decision**: Insert a new `attachments` page as element index 1 of the
`pages` array in `src/components/tasks-wizard/TasksWizard.tsx`. The
`AttachmentsPage` component reads `taskId` from the wizard's form context
(via the existing `WizardContext`/`WizardProvider` pattern); if `taskId`
is `null` or `undefined`, it renders an explanatory empty state instead
of mounting the Uploader.

**Rationale**:
- `saveOnPageChange={true}` (already set on `TasksWizard`) means leaving
  page 0 (`start`) triggers a save that returns the new task id; by the
  time the user lands on page 1 (`attachments`) the id is in form state.
- The empty state covers the deep-link/manual-step-jump edge case
  documented in spec rev 3.
- The `taskId` is the only thing the Uploader needs from the wizard;
  passing it as a prop keeps the Uploader generic.

**Alternatives considered**:
- **Insert Attachments later (e.g. position 3)**: works, but adds clicks
  and might bury the feature. Position 1 keeps SC-005 ("≤ 3 clicks from
  wizard entry") trivially satisfied.
- **Make the Uploader accept a nullable id**: rejected in Q11; leaks
  wizard lifecycle into the component.

**Integration notes**:
- Look up `taskId` via whichever hook the existing wizard pages use to
  read form values (inspect `StartPage` etc. for the pattern; document
  the exact hook name in `quickstart.md`).
- Pass `mode` from `TasksWizard` props through to `AttachmentsPage` so
  the Uploader's `readOnly` can be set from `mode === 'view'`.

---

## R11 — Field-level error routing from backend validation responses

**Decision**: The backend's 422 response shape is
`{ message: string; errors?: Record<string, string> }`. Keys in `errors`
that start with `metadata.` are stripped of the prefix and the remainder
is matched against `keyof TMetadata` to route messages to specific
fields in the `MetadataFields` renderer.

**Rationale**:
- Matches Laravel's default `ValidationException` shape (dot-notated keys),
  so the real backend can return errors in the same format with no
  client work.
- Centralising the routing in `xhrUpload` + a thin transformer keeps the
  per-adapter code tiny.

**Integration notes**:
- `xhrUpload` produces `UploaderError.validation` with `fieldErrors:
  Record<string, string>` containing the stripped keys.
- `QueueRow` / `EditDialog` read `fieldErrors` and pass each entry into
  the corresponding `MetadataField`'s renderer as an error string.
- Non-`metadata.*` errors stay in the row-level `message` only.

---

## R12 — Bundle size note

**Decision**: Approximate added bundle from this feature, gzipped:
- `react-dropzone` ~9 kB
- New component code ~12 kB (estimated; ten small parts, ~1200 LOC)
- No new icon library imports (lucide already in use)

Total ~21 kB gzipped — acceptable for a non-critical-path component
loaded behind a wizard route. The component file is naturally
client-only (`'use client'`); App Router will tree-shake it from
server-only routes.

**Rationale / Alternatives**:
- Considered lazy-loading the Uploader inside `AttachmentsPage` with
  `next/dynamic` to keep the wizard's first-paint bundle slim. Decision:
  defer — the wizard is already client-side and large; one more
  component package is not the bottleneck. Revisit if bundle audit
  flags it.

---

## Summary

No NEEDS CLARIFICATION items remain. All technology choices either follow
the existing repo grain (TanStack Query, MSW, shadcn/ui, fetch helpers in
`src/lib/api/core/`) or introduce a single new dependency (`react-dropzone`)
with a clear rationale. Phase 1 can proceed.
