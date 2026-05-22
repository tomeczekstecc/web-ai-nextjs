// One row in the upload queue: filename, metadata fields, progress, actions.
// See specs/019-upload-component/tasks.md T013.

'use client'

import { useMemo } from 'react'
import { X, RotateCcw, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MetadataFields } from './MetadataFields'
import type {
  MetadataField,
  UploadItem,
  UploaderCopy,
  ValidationResult,
} from '../types'

type Props<TMeta> = {
  item: UploadItem<TMeta>
  fields: ReadonlyArray<MetadataField<TMeta>>
  copy: UploaderCopy
  validate?: (metadata: TMeta) => ValidationResult<TMeta>
  onMetadataChange: (key: keyof TMeta, value: TMeta[keyof TMeta]) => void
  onUpload: () => void
  onCancel: () => void
  onRemove: () => void
}

function computeRowErrors<TMeta>(
  item: UploadItem<TMeta>,
  fields: ReadonlyArray<MetadataField<TMeta>>,
  copy: UploaderCopy,
  validate?: (metadata: TMeta) => ValidationResult<TMeta>,
): { fieldErrors: Partial<Record<keyof TMeta, string>>; valid: boolean } {
  const fieldErrors: Partial<Record<keyof TMeta, string>> = {}
  for (const f of fields) {
    if (!f.required) continue
    const v = item.metadata[f.key]
    if (v === null || v === undefined || v === '' || (f.kind === 'checkbox' && v === false)) {
      fieldErrors[f.key] = copy.errors.missingRequired(f.label)
    }
  }
  if (validate) {
    const r = validate(item.metadata)
    if (r !== true) {
      for (const [k, msg] of Object.entries(r.fieldErrors) as Array<[string, string | undefined]>) {
        if (msg) fieldErrors[k as keyof TMeta] = msg
      }
    }
  }
  // Backend-supplied field errors overlay client ones.
  if (item.fieldErrors) {
    for (const [k, msg] of Object.entries(item.fieldErrors) as Array<[string, string | undefined]>) {
      if (msg) fieldErrors[k as keyof TMeta] = msg
    }
  }
  return { fieldErrors, valid: Object.keys(fieldErrors).length === 0 }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function rowErrorMessage<TMeta>(item: UploadItem<TMeta>, copy: UploaderCopy): string | null {
  if (!item.error) return null
  switch (item.error.kind) {
    case 'cancelled':
      return null
    case 'network':
      return copy.errors.network
    case 'server':
      return copy.errors.server
    case 'validation':
      return item.error.message
    case 'unknown':
      return copy.errors.unknown
  }
}

export function QueueRow<TMeta>({
  item,
  fields,
  copy,
  validate,
  onMetadataChange,
  onUpload,
  onCancel,
  onRemove,
}: Props<TMeta>) {
  const { fieldErrors, valid } = useMemo(
    () => computeRowErrors(item, fields, copy, validate),
    [item, fields, copy, validate],
  )

  const isUploading = item.status === 'uploading'
  const rowError = rowErrorMessage(item, copy)
  const disabledInputs = isUploading || item.status === 'uploaded'

  return (
    <div
      className={cn(
        'rounded-md border border-border p-3 transition-colors',
        item.status === 'failed' && 'border-destructive/40 bg-destructive/5',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={item.file.name}>
            {item.file.name}
          </p>
          <p className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isUploading && item.status !== 'uploaded' && (
            <Button
              type="button"
              size="sm"
              onClick={onUpload}
              disabled={!valid}
              aria-label={copy.uploadRow}
            >
              <Upload className="mr-1 size-3.5" />
              {item.status === 'failed' ? copy.retry : copy.uploadRow}
            </Button>
          )}
          {isUploading && (
            <Button type="button" size="sm" variant="outline" onClick={onCancel}>
              <X className="mr-1 size-3.5" />
              {copy.cancel}
            </Button>
          )}
          {item.status === 'failed' && (
            <Button type="button" size="sm" variant="ghost" onClick={onUpload} disabled={!valid}>
              <RotateCcw className="mr-1 size-3.5" />
              {copy.retry}
            </Button>
          )}
          {!isUploading && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onRemove}
              aria-label={copy.remove}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {isUploading && (
        <div className="mt-3">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={item.progress}
            aria-label={`${item.file.name}: ${item.progress}%`}
          >
            <div
              className="h-full bg-primary transition-[width] duration-100"
              style={{ width: `${item.progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
            {item.progress}%
          </p>
        </div>
      )}

      {rowError && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {rowError}
        </p>
      )}

      <div className="mt-3">
        <MetadataFields<TMeta>
          fields={fields}
          values={item.metadata}
          errors={fieldErrors}
          disabled={disabledInputs}
          onChange={onMetadataChange}
          idPrefix={`q-${item.id}`}
        />
      </div>
    </div>
  )
}

export { computeRowErrors }
