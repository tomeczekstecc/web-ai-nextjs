// TanStack Query integration: list query + 4 mutations
// (upload, editMetadata, deleteFile, downloadFile) with optimistic updates
// and rollback. See specs/019-upload-component/research.md R4.

'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { useFileDownload } from '@/hooks/use-file-download'
import type {
  StoredFile,
  UploadAdapter,
  UploaderError,
  UploaderNotification,
  UploaderCopy,
} from './types'

type Args<TMeta> = {
  adapter: UploadAdapter<TMeta>
  queryKey: QueryKey
  copy: UploaderCopy
  onNotify?: (n: UploaderNotification) => void
}

function asUploaderError(e: unknown): UploaderError {
  if (e && typeof e === 'object' && 'kind' in e) return e as UploaderError
  return { kind: 'unknown', message: e instanceof Error ? e.message : 'Nieznany błąd' }
}

export function useUploaderMutations<TMeta>({
  adapter,
  queryKey,
  copy,
  onNotify,
}: Args<TMeta>) {
  const qc = useQueryClient()
  const abortRegistry = useRef(new Map<string, AbortController>())
  const notifiedListErrorRef = useRef(false)

  const listQuery = useQuery<StoredFile<TMeta>[]>({
    queryKey,
    queryFn: ({ signal }) => adapter.list(signal),
    staleTime: 0,
  })

  useEffect(() => {
    if (listQuery.isError && !listQuery.data && !notifiedListErrorRef.current) {
      notifiedListErrorRef.current = true
      onNotify?.({ level: 'error', message: copy.notifications.listFetchFailed })
    }
    if (listQuery.isSuccess) notifiedListErrorRef.current = false
  }, [listQuery.isError, listQuery.isSuccess, listQuery.data, onNotify, copy])

  // ----- Upload one file -----------------------------------------------------

  const uploadMutation = useMutation<
    StoredFile<TMeta>,
    UploaderError,
    { itemId: string; file: File; metadata: TMeta; onProgress: (p: number) => void }
  >({
    mutationFn: async ({ itemId, file, metadata, onProgress }) => {
      const controller = new AbortController()
      abortRegistry.current.set(itemId, controller)
      try {
        return await adapter.upload(
          { file, metadata },
          { onProgress, signal: controller.signal },
        )
      } catch (e) {
        throw asUploaderError(e)
      } finally {
        abortRegistry.current.delete(itemId)
      }
    },
    onSuccess: (stored) => {
      qc.setQueryData<StoredFile<TMeta>[]>(queryKey, (prev) => [stored, ...(prev ?? [])])
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey })
    },
  })

  // ----- Edit metadata ------------------------------------------------------

  const editMutation = useMutation<
    StoredFile<TMeta>,
    UploaderError,
    { id: string; metadata: TMeta },
    { previous?: StoredFile<TMeta>[] }
  >({
    mutationFn: async ({ id, metadata }) => {
      const controller = new AbortController()
      abortRegistry.current.set(`edit-${id}`, controller)
      try {
        return await adapter.updateMetadata(id, metadata, controller.signal)
      } catch (e) {
        throw asUploaderError(e)
      } finally {
        abortRegistry.current.delete(`edit-${id}`)
      }
    },
    onMutate: async ({ id, metadata }) => {
      await qc.cancelQueries({ queryKey })
      const previous = qc.getQueryData<StoredFile<TMeta>[]>(queryKey)
      qc.setQueryData<StoredFile<TMeta>[]>(queryKey, (prev) =>
        (prev ?? []).map((f) => (f.id === id ? { ...f, metadata } : f)),
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey })
    },
  })

  // ----- Delete -------------------------------------------------------------

  const deleteMutation = useMutation<
    void,
    UploaderError,
    { id: string },
    { previous?: StoredFile<TMeta>[] }
  >({
    mutationFn: async ({ id }) => {
      const controller = new AbortController()
      abortRegistry.current.set(`del-${id}`, controller)
      try {
        await adapter.delete(id, controller.signal)
      } catch (e) {
        throw asUploaderError(e)
      } finally {
        abortRegistry.current.delete(`del-${id}`)
      }
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey })
      const previous = qc.getQueryData<StoredFile<TMeta>[]>(queryKey)
      qc.setQueryData<StoredFile<TMeta>[]>(queryKey, (prev) =>
        (prev ?? []).filter((f) => f.id !== id),
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous)
    },
    onSuccess: () => {
      onNotify?.({ level: 'success', message: copy.notifications.deleted })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey })
    },
  })

  // ----- Download (delegated to the generic useFileDownload hook) ----------

  const downloadMutation = useFileDownload<{ id: string; filename: string }, UploaderError>({
    fetcher: async ({ id }, signal) => {
      try {
        return await adapter.download(id, signal)
      } catch (e) {
        throw asUploaderError(e)
      }
    },
    keyFor: ({ id }) => `dl-${id}`,
    filenameFor: ({ filename }, payload) => payload.filename ?? filename,
  })

  // ----- Cancellation helpers ----------------------------------------------

  const cancelOne = useCallback((itemId: string) => {
    abortRegistry.current.get(itemId)?.abort()
  }, [])

  return {
    listQuery,
    uploadMutation,
    editMutation,
    deleteMutation,
    downloadMutation,
    cancelOne,
  }
}

export type UploaderMutationsApi<TMeta> = ReturnType<typeof useUploaderMutations<TMeta>>
