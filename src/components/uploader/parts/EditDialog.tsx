// Edit metadata in a modal dialog. Plain controlled inputs (no TanStack Form for v1;
// keeps the file small and matches QueueRow inline editor behavior).

'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MetadataFields } from './MetadataFields'
import type {
  MetadataField,
  StoredFile,
  UploaderCopy,
  ValidationResult,
} from '../types'

type Props<TMeta> = {
  open: boolean
  file: StoredFile<TMeta> | null
  fields: ReadonlyArray<MetadataField<TMeta>>
  copy: UploaderCopy
  validate?: (metadata: TMeta) => ValidationResult<TMeta>
  busy?: boolean
  onSubmit: (metadata: TMeta) => void
  onClose: () => void
}

function computeErrors<TMeta>(
  metadata: TMeta,
  fields: ReadonlyArray<MetadataField<TMeta>>,
  copy: UploaderCopy,
  validate?: (m: TMeta) => ValidationResult<TMeta>,
): Partial<Record<keyof TMeta, string>> {
  const errs: Partial<Record<keyof TMeta, string>> = {}
  for (const f of fields) {
    if (!f.required) continue
    const v = metadata[f.key]
    if (v === null || v === undefined || v === '' || (f.kind === 'checkbox' && v === false)) {
      errs[f.key] = copy.errors.missingRequired(f.label)
    }
  }
  if (validate) {
    const r = validate(metadata)
    if (r !== true) {
      for (const [k, msg] of Object.entries(r.fieldErrors) as Array<[string, string | undefined]>) {
        if (msg) errs[k as keyof TMeta] = msg
      }
    }
  }
  return errs
}

function EditDialogBody<TMeta>({
  file,
  fields,
  copy,
  validate,
  busy,
  onSubmit,
  onClose,
}: {
  file: StoredFile<TMeta>
  fields: ReadonlyArray<MetadataField<TMeta>>
  copy: UploaderCopy
  validate?: (m: TMeta) => ValidationResult<TMeta>
  busy?: boolean
  onSubmit: (m: TMeta) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<TMeta>(() => ({ ...(file.metadata as object) } as TMeta))

  const editableFields = useMemo(
    () => fields.filter((f) => f.editableAfterUpload !== false),
    [fields],
  )

  const errors = useMemo(
    () => computeErrors(draft, editableFields, copy, validate),
    [draft, editableFields, copy, validate],
  )
  const valid = Object.keys(errors).length === 0

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {copy.edit}
          <span className="ml-2 text-sm font-normal text-muted-foreground">{file.name}</span>
        </DialogTitle>
      </DialogHeader>
      <div className="py-2">
        <MetadataFields<TMeta>
          fields={editableFields}
          values={draft}
          errors={errors}
          disabled={busy}
          onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))}
          idPrefix={`edit-${file.id}`}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          {copy.cancel}
        </Button>
        <Button type="button" onClick={() => onSubmit(draft)} disabled={busy || !valid}>
          {copy.save}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function EditDialog<TMeta>({
  open,
  file,
  fields,
  copy,
  validate,
  busy,
  onSubmit,
  onClose,
}: Props<TMeta>) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {file && (
        <EditDialogBody<TMeta>
          key={file.id}
          file={file}
          fields={fields}
          copy={copy}
          validate={validate}
          busy={busy}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      )}
    </Dialog>
  )
}
