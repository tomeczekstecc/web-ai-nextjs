// Adapter that mounts <Uploader<TaskFileMeta>> against /api/tasks/{taskId}/files.
// See specs/019-upload-component/quickstart.md §Step 2.

import type { UploadAdapter, StoredFile } from '@/components/uploader'
import { xhrUpload } from '@/lib/api/core/xhr-upload'
import { buildUploadFormData } from '@/lib/api/core/file-upload'
import { browserFetch } from '@/lib/api/core/browser-http'
import { mapBrowserFetchError } from '@/lib/api/core/upload-errors'
import { parseContentDispositionFilename } from '@/lib/api/core/download-blob'
import type { TaskFileMeta } from './files-contract'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api'

export function taskFilesAdapter(taskId: number): UploadAdapter<TaskFileMeta> {
  const base = `/tasks/${taskId}/files`

  return {
    list: async (signal) => {
      const r = await browserFetch<StoredFile<TaskFileMeta>[]>(base, { signal })
      if (!r.ok) throw mapBrowserFetchError(r.error)
      return r.data
    },

    upload: ({ file, metadata }, { onProgress, signal }) =>
      xhrUpload<StoredFile<TaskFileMeta>>(
        base,
        buildUploadFormData(file, metadata),
        { onProgress, signal, method: 'POST' },
      ),

    updateMetadata: async (id, metadata, signal) => {
      const r = await browserFetch<StoredFile<TaskFileMeta>>(`${base}/${id}`, {
        method: 'PUT',
        signal,
        body: JSON.stringify(metadata),
      })
      if (!r.ok) throw mapBrowserFetchError(r.error)
      return r.data
    },

    delete: async (id, signal) => {
      const r = await browserFetch<void>(`${base}/${id}`, {
        method: 'DELETE',
        signal,
      })
      if (!r.ok) throw mapBrowserFetchError(r.error)
    },

    download: async (id, signal) => {
      const res = await fetch(`${BASE}${base}/${id}/download`, {
        signal,
        credentials: 'include',
      })
      if (!res.ok) {
        throw { kind: 'server', status: res.status, message: 'Błąd pobierania pliku' }
      }
      const blob = await res.blob()
      const filename =
        parseContentDispositionFilename(res.headers.get('Content-Disposition')) ??
        `file-${id}`
      return { blob, filename }
    },
  }
}
