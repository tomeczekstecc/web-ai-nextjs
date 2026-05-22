// Local queue state hook. Pure — no network calls.
// See specs/019-upload-component/data-model.md §3 (UploadItem) and §1 (validation).

'use client'

import { useCallback, useMemo, useState } from 'react'
import type {
  MetadataField,
  UploadItem,
  UploadItemStatus,
  UploaderConfig,
  UploaderCopy,
  UploaderError,
} from './types'

export type AddResult = {
  accepted: number
  rejected: Array<{ name: string; reason: string }>
}

function getExtension(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

function makeDefaults<TMeta>(fields: ReadonlyArray<MetadataField<TMeta>>): TMeta {
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    out[f.key as string] = f.defaultValue !== undefined ? f.defaultValue : null
  }
  return out as TMeta
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `q-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useUploaderQueue<TMeta>(
  fields: ReadonlyArray<MetadataField<TMeta>>,
  config: UploaderConfig,
  copy: UploaderCopy,
  storedCount: () => number,
) {
  const [items, setItems] = useState<UploadItem<TMeta>[]>([])
  const defaults = useMemo(() => makeDefaults(fields), [fields])

  const add = useCallback(
    (files: File[]): AddResult => {
      const rejected: AddResult['rejected'] = []
      const accepted: UploadItem<TMeta>[] = []
      const allowed = new Set(config.allowedExtensions.map((e) => e.toLowerCase()))

      setItems((prev) => {
        const baseCount = prev.length + storedCount()
        for (const file of files) {
          if (file.size === 0) {
            rejected.push({ name: file.name, reason: copy.errors.emptyFile })
            continue
          }
          if (file.size > config.maxSize) {
            rejected.push({
              name: file.name,
              reason: copy.errors.tooLarge(config.maxSize, file.size),
            })
            continue
          }
          const ext = getExtension(file.name)
          if (allowed.size > 0 && !allowed.has(ext)) {
            rejected.push({
              name: file.name,
              reason: copy.errors.badExtension(config.allowedExtensions),
            })
            continue
          }
          if (baseCount + accepted.length >= config.maxFiles) {
            rejected.push({
              name: file.name,
              reason: copy.errors.tooMany(config.maxFiles),
            })
            continue
          }
          accepted.push({
            id: newId(),
            file,
            metadata: { ...(defaults as object) } as TMeta,
            status: 'ready',
            progress: 0,
          })
        }
        return [...prev, ...accepted]
      })

      return { accepted: 0, rejected } // accepted count not used by callers; rejected drives Alert UI
    },
    [config, copy, defaults, storedCount],
  )

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const updateMetadata = useCallback((id: string, patch: Partial<TMeta>) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, metadata: { ...i.metadata, ...patch } } : i,
      ),
    )
  }, [])

  const setStatus = useCallback((id: string, status: UploadItemStatus) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
  }, [])

  const setProgress = useCallback((id: string, progress: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, progress } : i)),
    )
  }, [])

  const setError = useCallback(
    (id: string, error: UploaderError | undefined, fieldErrors?: Partial<Record<keyof TMeta, string>>) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, error, fieldErrors, status: error ? 'failed' : i.status }
            : i,
        ),
      )
    },
    [],
  )

  const clear = useCallback(() => setItems([]), [])

  return { items, add, remove, updateMetadata, setStatus, setProgress, setError, clear }
}

export type UploaderQueueApi<TMeta> = ReturnType<typeof useUploaderQueue<TMeta>>
