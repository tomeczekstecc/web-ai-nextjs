// Generic, configurable file-download hook.
//
// Wraps any (params, signal) => Promise<{ blob, filename }> fetcher in a
// TanStack Mutation, handles abort, triggers the browser save dialog, and
// surfaces success/error callbacks. Use it from <Uploader> or from any
// standalone "Download report" / "Export CSV" button.

'use client'

import { useCallback, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { saveBlobAsFile } from '@/lib/api/core/download-blob'

export type DownloadPayload = {
  blob: Blob
  /** Server-suggested filename (e.g. parsed from Content-Disposition). */
  filename?: string
}

export type FileDownloadFetcher<TParams> = (
  params: TParams,
  signal: AbortSignal,
) => Promise<DownloadPayload>

export type UseFileDownloadOptions<TParams, TError = unknown> = {
  /** Fetcher that returns the blob to save. */
  fetcher: FileDownloadFetcher<TParams>
  /** Resolve the final saved filename. Defaults to server-provided value. */
  filenameFor?: (params: TParams, payload: DownloadPayload) => string
  /** Stable key for the in-flight registry. Defaults to JSON.stringify(params). */
  keyFor?: (params: TParams) => string
  /** Skip the browser save (useful for in-memory preview workflows). */
  skipSave?: boolean
  onSuccess?: (payload: DownloadPayload, params: TParams) => void
  onError?: (error: TError, params: TParams) => void
}

function defaultFilename<TParams>(
  params: TParams,
  payload: DownloadPayload,
): string {
  if (payload.filename) return payload.filename
  if (params && typeof params === 'object' && 'filename' in params) {
    const f = (params as { filename?: unknown }).filename
    if (typeof f === 'string') return f
  }
  return 'download'
}

export function useFileDownload<TParams, TError = unknown>(
  options: UseFileDownloadOptions<TParams, TError>,
) {
  const {
    fetcher,
    filenameFor = defaultFilename,
    keyFor,
    skipSave,
    onSuccess,
    onError,
  } = options

  const abortRegistry = useRef(new Map<string, AbortController>())

  const keyOf = useCallback(
    (params: TParams): string =>
      keyFor ? keyFor(params) : JSON.stringify(params),
    [keyFor],
  )

  const mutation = useMutation<DownloadPayload, TError, TParams>({
    mutationFn: async (params) => {
      const key = keyOf(params)
      // Cancel any previous in-flight request with the same key.
      abortRegistry.current.get(key)?.abort()
      const controller = new AbortController()
      abortRegistry.current.set(key, controller)
      try {
        const payload = await fetcher(params, controller.signal)
        if (!skipSave) {
          saveBlobAsFile(payload.blob, filenameFor(params, payload))
        }
        return payload
      } finally {
        // Only clear if still ours (defensive against rapid re-fires).
        if (abortRegistry.current.get(key) === controller) {
          abortRegistry.current.delete(key)
        }
      }
    },
    onSuccess,
    onError,
  })

  /** Cancel a specific in-flight download (or all if no key passed). */
  const cancel = useCallback(
    (params?: TParams) => {
      if (params === undefined) {
        for (const c of abortRegistry.current.values()) c.abort()
        abortRegistry.current.clear()
        return
      }
      const key = keyOf(params)
      abortRegistry.current.get(key)?.abort()
      abortRegistry.current.delete(key)
    },
    [keyOf],
  )

  /** Check whether a specific params set is currently downloading. */
  const isDownloading = useCallback(
    (params: TParams) => abortRegistry.current.has(keyOf(params)),
    [keyOf],
  )

  return {
    download: mutation.mutate,
    downloadAsync: mutation.mutateAsync,
    cancel,
    isDownloading,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}

export type UseFileDownloadApi<TParams, TError = unknown> = ReturnType<
  typeof useFileDownload<TParams, TError>
>
