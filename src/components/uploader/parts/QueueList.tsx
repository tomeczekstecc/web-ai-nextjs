// Wraps the queue rows; the upload-all/cancel-all header lands in US2.

'use client'

import { QueueRow } from './QueueRow'
import type {
  MetadataField,
  UploadItem,
  UploaderCopy,
  ValidationResult,
} from '../types'

type Props<TMeta> = {
  items: UploadItem<TMeta>[]
  fields: ReadonlyArray<MetadataField<TMeta>>
  copy: UploaderCopy
  validate?: (metadata: TMeta) => ValidationResult<TMeta>
  onMetadataChange: (id: string, key: keyof TMeta, value: TMeta[keyof TMeta]) => void
  onUpload: (id: string) => void
  onCancel: (id: string) => void
  onRemove: (id: string) => void
}

export function QueueList<TMeta>({
  items,
  fields,
  copy,
  validate,
  onMetadataChange,
  onUpload,
  onCancel,
  onRemove,
}: Props<TMeta>) {
  if (items.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{copy.queueTitle}</h3>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <QueueRow<TMeta>
            key={item.id}
            item={item}
            fields={fields}
            copy={copy}
            validate={validate}
            onMetadataChange={(key, value) => onMetadataChange(item.id, key, value)}
            onUpload={() => onUpload(item.id)}
            onCancel={() => onCancel(item.id)}
            onRemove={() => onRemove(item.id)}
          />
        ))}
      </div>
    </section>
  )
}
