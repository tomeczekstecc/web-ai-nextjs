# Phase 1 — Data Model: Configurable File Upload Component

**Feature**: 019-upload-component
**Date**: 2026-05-22

This document is the canonical TypeScript-shape view of the entities
defined in `spec.md`. Everything here is for the **frontend** model;
the corresponding wire shapes the backend must produce are in
`contracts/http.md`.

All types are generic over a `TMeta` parameter representing the
consumer's per-file metadata shape. The component itself does not assume
anything about `TMeta` beyond it being a serializable object.

---

## 1. `UploaderConfig`

Static, declarative configuration passed once at mount time.

```ts
export type UploaderConfig = {
  /** Maximum number of files the component will hold at once (queue + uploaded combined? — see note). */
  maxFiles: number;
  /** Maximum size per file, in bytes. */
  maxSize: number;
  /** Case-insensitive list of allowed extensions, without leading dots, e.g. ['pdf', 'jpg']. */
  allowedExtensions: string[];
};
```

**Note on `maxFiles`**: applies to the **combined** count of queued +
stored files for the current `queryKey`. Adding a file is rejected if it
would push `(queue.length + storedFiles.length)` past `maxFiles`. This
matches the natural user expectation that "max 10 files per task" is the
total attached count.

**Validation rules** (enforced by the component before any network call):
- `file.size > maxSize` → reject with `errors.tooLarge(maxSize, file.size)`
- `file.size === 0` → reject with a fixed message (`"Pusty plik"`)
- `extension(file.name).toLowerCase()` not in `allowedExtensions` →
  reject with `errors.badExtension(allowedExtensions)`
- `queue.length + stored.length + accepted.length > maxFiles` → reject
  excess files with `errors.tooMany(maxFiles)`

---

## 2. `MetadataField<TMeta>`

A consumer-declared description of one metadata field. The
`MetadataFields` renderer turns the array into editable inputs.

```ts
export type MetadataFieldKind = 'text' | 'number' | 'select' | 'checkbox' | 'date';

export type MetadataFieldOption<V> = { value: V; label: string };

export type MetadataField<TMeta, K extends keyof TMeta = keyof TMeta> = {
  /** Key into TMeta. Typed so consumers cannot typo a key. */
  key: K;
  /** Polish label shown to the user. */
  label: string;
  /** Which built-in input kind to render. Ignored if `render` is provided. */
  kind: MetadataFieldKind;
  /** Default value applied when a new file is added to the queue. */
  defaultValue?: TMeta[K];
  /** Whether the field is required for upload / metadata-save. */
  required?: boolean;
  /** Options for kind: 'select'. Ignored otherwise. */
  options?: ReadonlyArray<MetadataFieldOption<TMeta[K]>>;
  /** Whether the field can still be edited via the EditDialog after upload. */
  editableAfterUpload?: boolean;
  /** Optional escape hatch — full control over the input rendering. */
  render?: (props: {
    value: TMeta[K];
    onChange: (v: TMeta[K]) => void;
    error?: string;
    disabled?: boolean;
    label: string;
  }) => React.ReactNode;
};
```

**Default for `editableAfterUpload`**: `true`. Consumers opt-out for
write-once fields (e.g. a hash, an upload timestamp captured at submit).

---

## 3. `UploadItem<TMeta>`

The transient, client-only model of one file in the in-session queue.
Never persisted; never serialized.

```ts
export type UploadItemStatus =
  | 'ready'        // metadata may be incomplete; not yet attempted
  | 'uploading'    // request in flight; `progress` is meaningful
  | 'uploaded'     // moved to stored list; row will disappear next render
  | 'failed'       // last attempt errored; `error` populated
  | 'cancelled';   // user-aborted; will be auto-removed on next render

export type UploadItem<TMeta> = {
  /** Stable client-side id (crypto.randomUUID()). */
  id: string;
  /** The actual File object the user picked. */
  file: File;
  /** Current per-file metadata, initialised from MetadataField.defaultValue. */
  metadata: TMeta;
  /** Status machine. */
  status: UploadItemStatus;
  /** 0–100; only meaningful while status === 'uploading'. */
  progress: number;
  /** Populated when status === 'failed'. */
  error?: UploaderError;
  /** Per-field validation errors from a backend 422; routed into MetadataFields. */
  fieldErrors?: Partial<Record<keyof TMeta, string>>;
  /** Once status === 'uploaded', the backend-issued id of the resulting StoredFile. */
  backendId?: string;
};
```

**State transitions**:

```
            ┌──────────────── user removes ──────────────► (gone)
            │
(new) ──► ready ──► uploading ──► uploaded ──► (auto-removed next render)
            ▲           │   │
            │           │   └─► failed ──┐
            │           │                │
            │           └─► cancelled ───┤
            │                            │
            └─────────────── retry ──────┘
```

- `ready` is the resting state for a queued file. The user can edit
  metadata, remove it, or trigger its upload.
- `uploading` is entered when the per-row Upload button or `Upload all`
  fires `adapter.upload()`. Progress events flow from `xhrUpload` →
  mutation `onProgress` callback → `setItem(id, { progress })`.
- `uploaded` is a transient terminal state: the optimistic mutation
  prepends a `StoredFile` to the cached list and the item is removed
  from the queue on the next render cycle.
- `failed` and `cancelled` are user-recoverable: `cancelled` auto-resets
  to `ready` for retry; `failed` shows the error and a Retry button that
  resets to `ready`.

---

## 4. `StoredFile<TMeta>`

The durable, backend-issued model of one stored file. Lives in the
TanStack Query cache under the consumer's `queryKey`.

```ts
export type StoredFile<TMeta> = {
  /** Backend-issued identifier. Opaque to the component. */
  id: string;
  /** Original filename, including extension. */
  name: string;
  /** Size in bytes. */
  size: number;
  /** ISO-8601 timestamp of when the backend recorded the upload. */
  uploadedAt: string;
  /** The consumer's typed metadata for this file. */
  metadata: TMeta;
};
```

**Note on per-row authorization**: there is **no** `canEdit` / `canDelete`
flag on `StoredFile`. Per Q10, authorization is supplied via the
component's `canMutateRow?(file) => { edit, delete }` prop. This keeps the
data model thin and lets domain rules live in the consumer.

---

## 5. `UploaderError`

The typed failure surface for every adapter rejection. Produced by
`xhrUpload` and consumed by the component's mutation handlers.

```ts
export type UploaderError =
  | { kind: 'cancelled' }
  | { kind: 'network'; message: string }
  | { kind: 'validation'; message: string; fieldErrors?: Record<string, string> }
  | { kind: 'server'; status: number; message: string }
  | { kind: 'unknown'; message: string };
```

**UX mapping** (handled inside the component, not the adapter):

| kind         | inline row | retry button | field highlight | onNotify? |
|--------------|------------|--------------|-----------------|-----------|
| `cancelled`  | (silent)   | —            | —               | no        |
| `network`    | `errors.network` | yes    | —               | no (only in batch summary if all 3 in a batch failed network) |
| `validation` | `error.message`  | no     | from `fieldErrors` | no  |
| `server`     | `errors.server`  | yes    | —               | no        |
| `unknown`    | `errors.unknown` | no     | —               | console.error in dev |

---

## 6. `UploaderNotification`

Coarse-grained event surface for `onNotify`. Used **only** for batch-level
events; per-file errors stay inline.

```ts
export type UploaderNotification =
  | { level: 'success'; message: string }
  | { level: 'error'; message: string };
```

**Emission points**:
- After `Upload all` completes:
  `{ level: 'success', message: copy.notifications.uploadAllDone(ok, skipped, failed) }`
  (level is `'error'` if `failed > 0 && ok === 0`).
- When the list query fails *and there is no cached data*:
  `{ level: 'error', message: copy.notifications.listFetchFailed }`.
- After a successful `delete`:
  `{ level: 'success', message: copy.notifications.deleted }`.

Per-file upload success and per-row edit success do **not** emit
notifications; the inline UI is sufficient.

---

## 7. `UploadAdapter<TMeta>`

The contract the consumer implements. Full definition lives in
`contracts/adapter.ts`; summary here for the data-model overview.

```ts
export interface UploadAdapter<TMeta> {
  list(signal: AbortSignal): Promise<StoredFile<TMeta>[]>;

  upload(
    input: { file: File; metadata: TMeta },
    opts: { onProgress: (pct: number) => void; signal: AbortSignal }
  ): Promise<StoredFile<TMeta>>;

  updateMetadata(
    id: string,
    metadata: TMeta,
    signal: AbortSignal
  ): Promise<StoredFile<TMeta>>;

  delete(id: string, signal: AbortSignal): Promise<void>;

  download(id: string, signal: AbortSignal): Promise<{ blob: Blob; filename: string }>;
}
```

All methods reject with `UploaderError` (typed); the `xhrUpload` helper
produces these from XHR responses automatically.

---

## 8. `UploaderProps<TMeta>`

The full public prop surface of the component. Definition lives in
`contracts/component.ts`; summary here.

```ts
export type UploaderProps<TMeta> = {
  /** Required: the backend integration seam. */
  adapter: UploadAdapter<TMeta>;
  /** Required: cache key for the stored-file list. Used by TanStack Query for caching, hydration, and external invalidation. */
  queryKey: QueryKey;
  /** Required: metadata field schema. Drives both the queue-row inline editor and the EditDialog. */
  fields: ReadonlyArray<MetadataField<TMeta>>;
  /** Required: limits configuration. */
  config: UploaderConfig;
  /** Required: per-file constant context (e.g. parent entity id) merged into every metadata payload. */
  constantMetadata: Record<string, unknown>;

  /** Optional: switch to read-only (no dropzone, no edit, no delete, no queue; list + download remain). */
  readOnly?: boolean;
  /** Optional: per-row authorization gate for edit/delete actions. */
  canMutateRow?: (file: StoredFile<TMeta>) => { edit: boolean; delete: boolean };
  /** Optional: schema-or-function boundary validation for metadata; receives merged user metadata + constantMetadata. */
  validate?: (metadata: TMeta) => true | { fieldErrors: Partial<Record<keyof TMeta, string>> };
  /** Optional: batch-level notification callback. Per-file events remain inline regardless. */
  onNotify?: (notification: UploaderNotification) => void;
  /** Optional: partial overrides for Polish copy. */
  copy?: Partial<UploaderCopy>;
};
```

---

## 9. Relationships

```
UploaderConfig ── declared by ──► consumer
MetadataField<TMeta>[] ── declared by ──► consumer
UploadAdapter<TMeta> ── implemented by ──► consumer (uses xhrUpload helper)

         ┌── owns ── UploadItem<TMeta>[]      (transient, in-component state)
Uploader ┤
         └── reads/writes via TanStack Query ─► StoredFile<TMeta>[]  (cached by queryKey)
                                                  │
                                                  └── server source via adapter.list()

UploadItem.error: UploaderError ── produced by ── xhrUpload
UploaderNotification ── emitted by ── Uploader ── consumed by ── onNotify? (consumer)
```

---

## 10. Concrete demo instantiation

For reference and to keep `quickstart.md` short, the wizard demo's
concrete types:

```ts
// src/lib/api/domains/tasks/files-contract.ts
export type TaskFileCategory = 'pdf' | 'scan' | 'photo' | 'other';

export type TaskFileMeta = {
  category: TaskFileCategory;
  description: string | null;
  pageCount: number | null;
  validFrom: string | null;      // ISO date 'YYYY-MM-DD'
  isConfidential: boolean;
};

export type StoredTaskFile = StoredFile<TaskFileMeta>;
```

```ts
// src/components/tasks-wizard/pages/AttachmentsPage.tsx (excerpt)
const taskFileFields: MetadataField<TaskFileMeta>[] = [
  {
    key: 'category', label: 'Kategoria', kind: 'select', required: true,
    options: [
      { value: 'pdf',   label: 'Dokument PDF' },
      { value: 'scan',  label: 'Skan' },
      { value: 'photo', label: 'Zdjęcie' },
      { value: 'other', label: 'Inne' },
    ],
  },
  { key: 'description',    label: 'Opis',         kind: 'text',     defaultValue: null },
  { key: 'pageCount',      label: 'Liczba stron', kind: 'number',   defaultValue: null },
  { key: 'validFrom',      label: 'Ważny od',     kind: 'date',     defaultValue: null },
  { key: 'isConfidential', label: 'Poufny',       kind: 'checkbox', defaultValue: false },
];

const taskFileConfig: UploaderConfig = {
  maxFiles: 10,
  maxSize: 5 * 1024 * 1024,
  allowedExtensions: ['pdf', 'docx', 'jpg', 'jpeg', 'png'],
};
```
