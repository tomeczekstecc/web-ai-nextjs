// One row in the stored-file repository. Action buttons gated by canMutateRow.

'use client'

import { Download, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format/date'
import type {
  MetadataField,
  StoredFile,
  UploaderCopy,
  RowCapabilities,
} from '../types'

type Props<TMeta> = {
  file: StoredFile<TMeta>
  fields: ReadonlyArray<MetadataField<TMeta>>
  copy: UploaderCopy
  caps: RowCapabilities
  readOnly?: boolean
  onEdit: () => void
  onDelete: () => void
  onDownload: () => void
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function summarizeMetadata<TMeta>(
  metadata: TMeta,
  fields: ReadonlyArray<MetadataField<TMeta>>,
): string {
  const parts: string[] = []
  for (const f of fields) {
    const v = metadata[f.key]
    if (v === null || v === undefined || v === '') continue
    if (f.kind === 'select' && f.options) {
      const opt = f.options.find((o) => o.value === v)
      parts.push(`${f.label}: ${opt?.label ?? String(v)}`)
    } else if (f.kind === 'checkbox') {
      if (v === true) parts.push(f.label)
    } else {
      parts.push(`${f.label}: ${String(v)}`)
    }
  }
  return parts.join(' · ')
}

export function RepositoryRow<TMeta>({
  file,
  fields,
  copy,
  caps,
  readOnly,
  onEdit,
  onDelete,
  onDownload,
}: Props<TMeta>) {
  const summary = summarizeMetadata(file.metadata, fields)
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(file.size)} · {formatDate(file.uploadedAt)}
        </p>
        {summary && (
          <p className="mt-1 text-xs text-muted-foreground">{summary}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button type="button" size="sm" variant="ghost" onClick={onDownload}>
          <Download className="mr-1 size-3.5" />
          {copy.download}
        </Button>
        {!readOnly && caps.edit && (
          <Button type="button" size="sm" variant="ghost" onClick={onEdit}>
            <Pencil className="mr-1 size-3.5" />
            {copy.edit}
          </Button>
        )}
        {!readOnly && caps.delete && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1 size-3.5" />
            {copy.delete}
          </Button>
        )}
      </div>
    </div>
  )
}
