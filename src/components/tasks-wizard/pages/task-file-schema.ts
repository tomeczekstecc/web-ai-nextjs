// Concrete metadata schema for task attachments used by AttachmentsPage.

import type { MetadataField, UploaderConfig } from '@/components/uploader'
import type { TaskFileMeta } from '@/lib/api/domains/tasks/files-contract'

export const taskFileFields: MetadataField<TaskFileMeta>[] = [
  {
    key: 'category',
    label: 'Kategoria',
    kind: 'select',
    required: true,
    defaultValue: 'other',
    options: [
      { value: 'pdf',   label: 'Dokument PDF' },
      { value: 'scan',  label: 'Skan' },
      { value: 'photo', label: 'Zdjęcie' },
      { value: 'other', label: 'Inne' },
    ],
  },
  { key: 'description',    label: 'Opis',         kind: 'text',     defaultValue: null },
  { key: 'pageCount',      label: 'Liczba stron', kind: 'number',   defaultValue: null },
  { key: 'validFrom',      label: 'Ważny od',     kind: 'date',     defaultValue: null },
  { key: 'isConfidential', label: 'Poufny',       kind: 'checkbox', defaultValue: false },
]

export const taskFileConfig: UploaderConfig = {
  maxFiles: 10,
  maxSize: 5 * 1024 * 1024,
  allowedExtensions: ['pdf', 'docx', 'jpg', 'jpeg', 'png'],
}
