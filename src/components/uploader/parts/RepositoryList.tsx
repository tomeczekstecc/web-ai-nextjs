// Stored-file list with row-level state for Edit and Delete dialogs.

'use client'

import { useState } from 'react'
import { RepositoryRow } from './RepositoryRow'
import { EditDialog } from './EditDialog'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import type {
  MetadataField,
  RowCapabilities,
  StoredFile,
  UploaderCopy,
  ValidationResult,
} from '../types'

type Props<TMeta> = {
  files: StoredFile<TMeta>[]
  fields: ReadonlyArray<MetadataField<TMeta>>
  copy: UploaderCopy
  readOnly?: boolean
  isLoading?: boolean
  validate?: (metadata: TMeta) => ValidationResult<TMeta>
  canMutateRow?: (file: StoredFile<TMeta>) => RowCapabilities
  editBusy?: boolean
  deleteBusy?: boolean
  onEditSubmit: (id: string, metadata: TMeta) => Promise<void> | void
  onDeleteConfirm: (id: string) => Promise<void> | void
  onDownload: (file: StoredFile<TMeta>) => void
}

const ALL_CAPS: RowCapabilities = { edit: true, delete: true }

export function RepositoryList<TMeta>({
  files,
  fields,
  copy,
  readOnly,
  isLoading,
  validate,
  canMutateRow,
  editBusy,
  deleteBusy,
  onEditSubmit,
  onDeleteConfirm,
  onDownload,
}: Props<TMeta>) {
  const [editing, setEditing] = useState<StoredFile<TMeta> | null>(null)
  const [deleting, setDeleting] = useState<StoredFile<TMeta> | null>(null)

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{copy.repositoryTitle}</h3>

      {isLoading && files.length === 0 && (
        <p className="text-xs text-muted-foreground">…</p>
      )}

      {!isLoading && files.length === 0 && (
        <p className="text-xs text-muted-foreground">{copy.emptyRepository}</p>
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((file) => (
            <RepositoryRow<TMeta>
              key={file.id}
              file={file}
              fields={fields}
              copy={copy}
              caps={canMutateRow ? canMutateRow(file) : ALL_CAPS}
              readOnly={readOnly}
              onEdit={() => setEditing(file)}
              onDelete={() => setDeleting(file)}
              onDownload={() => onDownload(file)}
            />
          ))}
        </div>
      )}

      <EditDialog<TMeta>
        open={!!editing}
        file={editing}
        fields={fields}
        copy={copy}
        validate={validate}
        busy={editBusy}
        onSubmit={async (metadata) => {
          if (!editing) return
          await onEditSubmit(editing.id, metadata)
          setEditing(null)
        }}
        onClose={() => setEditing(null)}
      />

      <DeleteConfirmDialog
        open={!!deleting}
        filename={deleting?.name ?? ''}
        copy={copy}
        busy={deleteBusy}
        onConfirm={async () => {
          if (!deleting) return
          await onDeleteConfirm(deleting.id)
          setDeleting(null)
        }}
        onCancel={() => setDeleting(null)}
      />
    </section>
  )
}
