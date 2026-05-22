# Quickstart — Configurable File Upload Component

**Feature**: 019-upload-component
**For**: developers integrating `<Uploader<TMeta>>` into a new domain

This guide walks through the 5 steps to mount the Uploader against any
backend resource in this repo. The wizard demo's
`AttachmentsPage`/`taskFilesAdapter` are the canonical reference; this
document explains the pattern so you can replicate it for other domains.

---

## TL;DR

```tsx
'use client'

import { Uploader } from '@/components/uploader'
import { taskFilesAdapter } from '@/lib/api/domains/tasks/files-adapter'
import { taskFileFields, taskFileConfig } from './task-file-schema'
import { toast } from '@/components/toast'

export function AttachmentsPage({ taskId, mode }: { taskId: number; mode: 'edit' | 'view' }) {
  return (
    <Uploader
      adapter={taskFilesAdapter(taskId)}
      queryKey={['tasks', taskId, 'files']}
      fields={taskFileFields}
      config={taskFileConfig}
      constantMetadata={{ taskId }}
      readOnly={mode === 'view'}
      onNotify={(n) => toast[n.level](n.message)}
    />
  )
}
```

---

## Step 1 — Define the metadata type and schema

Create a contract file under your domain:

```ts
// src/lib/api/domains/tasks/files-contract.ts
import type { StoredFile } from '@/components/uploader'

export type TaskFileCategory = 'pdf' | 'scan' | 'photo' | 'other'

export type TaskFileMeta = {
  category: TaskFileCategory
  description: string | null
  pageCount: number | null
  validFrom: string | null   // ISO 'YYYY-MM-DD'
  isConfidential: boolean
}

export type StoredTaskFile = StoredFile<TaskFileMeta>
```

Then the matching field schema (drives both the queue-row editor and
the EditDialog):

```ts
// src/components/tasks-wizard/pages/task-file-schema.ts
import type { MetadataField, UploaderConfig } from '@/components/uploader'
import type { TaskFileMeta } from '@/lib/api/domains/tasks/files-contract'

export const taskFileFields: MetadataField<TaskFileMeta>[] = [
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
]

export const taskFileConfig: UploaderConfig = {
  maxFiles: 10,
  maxSize: 5 * 1024 * 1024,
  allowedExtensions: ['pdf', 'docx', 'jpg', 'jpeg', 'png'],
}
```

---

## Step 2 — Implement the adapter

The adapter is the only place that knows about HTTP. Use the project
helpers (`xhrUpload`, `buildUploadFormData`, `browserFetch`).

```ts
// src/lib/api/domains/tasks/files-adapter.ts
import type {
  UploadAdapter,
  StoredFile,
} from '@/components/uploader'
import {
  xhrUpload,
  buildUploadFormData,
} from '@/lib/api/core'  // re-exports from xhr-upload.ts + file-upload.ts
import { browserFetch } from '@/lib/api/core/browser-http'
import type { TaskFileMeta } from './files-contract'

export function taskFilesAdapter(taskId: number): UploadAdapter<TaskFileMeta> {
  const base = `/api/tasks/${taskId}/files`

  return {
    list: async (signal) => {
      const r = await browserFetch<StoredFile<TaskFileMeta>[]>(base, { signal })
      if (!r.ok) throw mapBrowserFetchError(r.error)
      return r.data
    },

    upload: ({ file, metadata }, { onProgress, signal }) => {
      const body = buildUploadFormData(file, { ...metadata, taskId })
      return xhrUpload<StoredFile<TaskFileMeta>>(base, body, { onProgress, signal })
    },

    updateMetadata: async (id, metadata, signal) => {
      const r = await browserFetch<StoredFile<TaskFileMeta>>(`${base}/${id}`, {
        method: 'PUT',
        signal,
        body: JSON.stringify({ ...metadata, taskId }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!r.ok) throw mapBrowserFetchError(r.error)
      return r.data
    },

    delete: async (id, signal) => {
      const r = await browserFetch<void>(`${base}/${id}`, { method: 'DELETE', signal })
      if (!r.ok) throw mapBrowserFetchError(r.error)
    },

    download: async (id, signal) => {
      const res = await fetch(`${base}/${id}/download`, { signal })
      if (!res.ok) throw { kind: 'server', status: res.status, message: 'Błąd serwera' }
      const blob = await res.blob()
      // Filename comes from the cached StoredFile; this is a fallback only.
      const filename = res.headers.get('Content-Disposition')?.match(/filename="(.+?)"/)?.[1] ?? `file-${id}`
      return { blob, filename }
    },
  }
}
```

`mapBrowserFetchError` is a tiny helper that converts the existing
`browser-http.ts` error shape into an `UploaderError`. Reuse the one in
`@/lib/api/core/upload-errors.ts` rather than rewriting it.

---

## Step 3 — Mount the component

In your client page or wizard step:

```tsx
'use client'

import { Uploader } from '@/components/uploader'
import { taskFilesAdapter } from '@/lib/api/domains/tasks/files-adapter'
import { taskFileFields, taskFileConfig } from './task-file-schema'
import { toast } from '@/components/toast'

export function AttachmentsPage({ taskId, mode }: { taskId: number | null; mode: 'edit' | 'view' }) {
  if (taskId == null) {
    return (
      <p className="text-muted-foreground">
        Zapisz pierwszy krok, aby dodać załączniki.
      </p>
    )
  }

  return (
    <Uploader
      adapter={taskFilesAdapter(taskId)}
      queryKey={['tasks', taskId, 'files']}
      fields={taskFileFields}
      config={taskFileConfig}
      constantMetadata={{ taskId }}
      readOnly={mode === 'view'}
      onNotify={(n) => (n.level === 'success' ? toast.success(n.message) : toast.error(n.message))}
    />
  )
}
```

Notes:
- `queryKey` is yours to design — it should be specific enough that
  invalidation from elsewhere in the app (e.g. after saving the parent
  task) hits exactly this list and nothing else.
- The defensive empty state for missing `taskId` lives in your wizard
  step, not in the Uploader (per Q11).

---

## Step 4 — (Optional) SSR prefetch via HydrationBoundary

For pages where the file list is part of first paint, prefetch it on the
server like other queries in this repo:

```tsx
// app/(app)/wizard-demo/[id]/page.tsx (excerpt)
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/client'
import { taskFilesAdapter } from '@/lib/api/domains/tasks/files-adapter'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const taskId = Number(id)
  const qc = getQueryClient()

  await qc.prefetchQuery({
    queryKey: ['tasks', taskId, 'files'],
    queryFn: ({ signal }) => taskFilesAdapter(taskId).list(signal),
  })

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ClientWizard id={taskId} />
    </HydrationBoundary>
  )
}
```

---

## Step 5 — Register MSW handlers (if your domain is new)

Add a handler set under `src/mocks/handlers/<resource>-files.ts` that
implements the five endpoints from `contracts/http.md` and an in-memory
store under `src/mocks/data/<resource>-files.ts`. Register the handler
list in `src/mocks/handlers/index.ts` alongside the existing ones.

The pattern is identical to the existing `tasks-wizard.ts` /
`task-files.ts` handler files; copy and adapt.

---

## What you do NOT need to do

- ❌ Wire toast manually for every per-file success / error — the
  component renders inline state automatically; `onNotify` is only for
  batch-level summaries.
- ❌ Implement cancellation cleanup against the backend — the client
  aborts; the backend's transactional contract handles orphan prevention
  (per FR-009 / contracts/http.md §2).
- ❌ Write a custom progress bar — `Progress` from shadcn is built in.
- ❌ Handle duplicate filenames — allowed silently by design.
- ❌ Manage `File` blobs across navigation — queued-but-unsent files
  are intentionally transient.
- ❌ Pass `concurrency` — internally fixed at 3 for "Upload all".
- ❌ Translate error messages — built-in Polish copy in
  `@/components/uploader/copy.ts`; override per-field via the `copy`
  prop only if you must.

---

## Verifying the demo locally

```bash
pnpm dev
```

1. Navigate to `/wizard-demo`.
2. Click **"Nowe zadanie"** (or open an existing task to see view mode).
3. Fill in the **Start** step and press Next.
4. You should land on **Załączniki** (the new step). The repository
   list shows the two seeded files (`wniosek.pdf`, `skan-dowodu.jpg`).
5. Drag a PDF onto the dropzone. The row appears with metadata inputs.
6. Click **Prześlij** on the row. Progress bar animates from 0 to 100%,
   the row disappears, the new file appears in the repository list.
7. Edit metadata on a stored file: the dialog opens, save → list
   updates instantly (optimistic).
8. Delete a stored file: confirmation prompt → row disappears.
9. To exercise error UX, navigate to
   `/wizard-demo/1?fail=true` — every 3rd upload returns a 422 with the
   category field highlighted in red.

Manual a11y check (per `web-accessibility` skill): every action button
has a Polish label, the dropzone is focusable and activates on
Space/Enter, the delete confirmation dialog traps focus, and the live
progress percentage is announced via `aria-live`.

---

## File map summary

| Path | What |
|---|---|
| `src/components/uploader/Uploader.tsx` | Public component |
| `src/components/uploader/types.ts` | Public type re-exports |
| `src/components/uploader/parts/*` | Internal subcomponents |
| `src/lib/api/core/xhr-upload.ts` | Generic XHR helper |
| `src/lib/api/core/file-upload.ts` | `buildUploadFormData` |
| `src/lib/api/core/upload-errors.ts` | Error shape conversion helper |
| `src/lib/api/domains/<domain>/files-adapter.ts` | Per-domain adapter |
| `src/lib/api/domains/<domain>/files-contract.ts` | Per-domain types |
| `src/mocks/handlers/<resource>-files.ts` | MSW handlers |
| `src/mocks/data/<resource>-files.ts` | In-memory mock store |

For deeper background on the design decisions, see
`spec.md` → "Resolved Design Decisions" and `research.md`.
