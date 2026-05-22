// Public Uploader component. See specs/019-upload-component/contracts/component.ts.

'use client'

import { useCallback, useMemo } from 'react'
import { Separator } from '@/components/ui/separator'
import { DropzoneArea } from './parts/DropzoneArea'
import { QueueList } from './parts/QueueList'
import { RepositoryList } from './parts/RepositoryList'
import { mergeCopy } from './copy'
import { useUploaderQueue } from './use-uploader-queue'
import { useUploaderMutations } from './use-uploader-mutations'
import { computeRowErrors } from './parts/QueueRow'
import type { UploaderProps } from './types'

export function Uploader<TMeta>(props: UploaderProps<TMeta>) {
  const {
    adapter,
    queryKey,
    fields,
    config,
    constantMetadata,
    readOnly,
    canMutateRow,
    validate,
    onNotify,
    copy: copyOverride,
  } = props

  const copy = useMemo(() => mergeCopy(copyOverride), [copyOverride])

  const {
    listQuery,
    uploadMutation,
    editMutation,
    deleteMutation,
    downloadMutation,
    cancelOne,
  } = useUploaderMutations<TMeta>({ adapter, queryKey, copy, onNotify })

  const storedFiles = listQuery.data ?? []

  const queue = useUploaderQueue<TMeta>(
    fields,
    config,
    copy,
    useCallback(() => storedFiles.length, [storedFiles.length]),
  )

  const handleUpload = useCallback(
    (itemId: string) => {
      const item = queue.items.find((i) => i.id === itemId)
      if (!item) return

      const { fieldErrors, valid } = computeRowErrors(item, fields, copy, validate)
      if (!valid) {
        queue.setError(itemId, { kind: 'validation', message: '' }, fieldErrors)
        return
      }

      const merged = { ...constantMetadata, ...(item.metadata as object) } as TMeta
      queue.setStatus(itemId, 'uploading')
      queue.setError(itemId, undefined)
      queue.setProgress(itemId, 0)

      uploadMutation.mutate(
        {
          itemId,
          file: item.file,
          metadata: merged,
          onProgress: (p) => queue.setProgress(itemId, p),
        },
        {
          onSuccess: () => {
            queue.remove(itemId)
          },
          onError: (err) => {
            if (err.kind === 'cancelled') {
              queue.setStatus(itemId, 'ready')
              queue.setError(itemId, undefined)
              queue.setProgress(itemId, 0)
              return
            }
            const backendFieldErrors =
              err.kind === 'validation' && err.fieldErrors
                ? (err.fieldErrors as Partial<Record<keyof TMeta, string>>)
                : undefined
            queue.setError(itemId, err, backendFieldErrors)
          },
        },
      )
    },
    [queue, fields, copy, validate, constantMetadata, uploadMutation],
  )

  const handleCancel = useCallback(
    (itemId: string) => {
      cancelOne(itemId)
    },
    [cancelOne],
  )

  const handleDownload = useCallback(
    (file: { id: string; name: string }) => {
      downloadMutation.download({ id: file.id, filename: file.name })
    },
    [downloadMutation],
  )

  return (
    <div className="flex flex-col gap-5">
      {!readOnly && (
        <DropzoneArea
          onFiles={(files) => ({ rejected: queue.add(files).rejected })}
          copy={copy}
        />
      )}

      {!readOnly && (
        <QueueList<TMeta>
          items={queue.items}
          fields={fields}
          copy={copy}
          validate={validate}
          onMetadataChange={(id, key, value) =>
            queue.updateMetadata(id, { [key]: value } as Partial<TMeta>)
          }
          onUpload={handleUpload}
          onCancel={handleCancel}
          onRemove={queue.remove}
        />
      )}

      {!readOnly && queue.items.length > 0 && <Separator />}

      <RepositoryList<TMeta>
        files={storedFiles}
        fields={fields}
        copy={copy}
        readOnly={readOnly}
        isLoading={listQuery.isLoading}
        validate={validate}
        canMutateRow={canMutateRow}
        editBusy={editMutation.isPending}
        deleteBusy={deleteMutation.isPending}
        onEditSubmit={async (id, metadata) => {
          const merged = { ...constantMetadata, ...(metadata as object) } as TMeta
          await editMutation.mutateAsync({ id, metadata: merged })
        }}
        onDeleteConfirm={(id) => deleteMutation.mutateAsync({ id })}
        onDownload={handleDownload}
      />
    </div>
  )
}
