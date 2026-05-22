// Task-file domain contract. See specs/019-upload-component/data-model.md §10.

import type { StoredFile } from '@/components/uploader'

export type TaskFileCategory = 'pdf' | 'scan' | 'photo' | 'other'

export type TaskFileMeta = {
  category: TaskFileCategory
  description: string | null
  pageCount: number | null
  validFrom: string | null
  isConfidential: boolean
}

export type StoredTaskFile = StoredFile<TaskFileMeta>
