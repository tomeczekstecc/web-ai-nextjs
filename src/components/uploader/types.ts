// Public types for the Uploader component. See:
//   specs/019-upload-component/contracts/component.ts
//   specs/019-upload-component/contracts/adapter.ts
//   specs/019-upload-component/data-model.md

import type { ReactNode } from 'react'
import type { QueryKey } from '@tanstack/react-query'

// ----- StoredFile / UploadAdapter / UploaderError ---------------------------

export type StoredFile<TMeta> = {
  id: string
  name: string
  size: number
  uploadedAt: string
  metadata: TMeta
}

export type UploaderError =
  | { kind: 'cancelled' }
  | { kind: 'network'; message: string }
  | { kind: 'validation'; message: string; fieldErrors?: Record<string, string> }
  | { kind: 'server'; status: number; message: string }
  | { kind: 'unknown'; message: string }

export interface UploadAdapter<TMeta> {
  list(signal: AbortSignal): Promise<StoredFile<TMeta>[]>
  upload(
    input: { file: File; metadata: TMeta },
    opts: { onProgress: (pct: number) => void; signal: AbortSignal },
  ): Promise<StoredFile<TMeta>>
  updateMetadata(id: string, metadata: TMeta, signal: AbortSignal): Promise<StoredFile<TMeta>>
  delete(id: string, signal: AbortSignal): Promise<void>
  download(id: string, signal: AbortSignal): Promise<{ blob: Blob; filename: string }>
}

// ----- Config & metadata schema --------------------------------------------

export type UploaderConfig = {
  maxFiles: number
  maxSize: number
  allowedExtensions: string[]
}

export type MetadataFieldKind = 'text' | 'number' | 'select' | 'checkbox' | 'date'

export type MetadataFieldOption<V> = { value: V; label: string }

export type MetadataField<TMeta, K extends keyof TMeta = keyof TMeta> = {
  key: K
  label: string
  kind: MetadataFieldKind
  defaultValue?: TMeta[K]
  required?: boolean
  options?: ReadonlyArray<MetadataFieldOption<TMeta[K]>>
  editableAfterUpload?: boolean
  render?: (props: {
    value: TMeta[K]
    onChange: (v: TMeta[K]) => void
    error?: string
    disabled?: boolean
    label: string
  }) => ReactNode
}

// ----- Notifications, validation, copy -------------------------------------

export type UploaderNotification =
  | { level: 'success'; message: string }
  | { level: 'error'; message: string }

export type RowCapabilities = { edit: boolean; delete: boolean }

export type ValidationResult<TMeta> =
  | true
  | { fieldErrors: Partial<Record<keyof TMeta, string>> }

// ----- Queue item (transient client-side state) -----------------------------

export type UploadItemStatus = 'ready' | 'uploading' | 'uploaded' | 'failed' | 'cancelled'

export type UploadItem<TMeta> = {
  id: string
  file: File
  metadata: TMeta
  status: UploadItemStatus
  progress: number
  error?: UploaderError
  fieldErrors?: Partial<Record<keyof TMeta, string>>
  backendId?: string
}

// ----- Copy bundle ---------------------------------------------------------

export type UploaderCopy = {
  dropzoneDrag: string
  dropzoneIdle: string
  dropzoneButton: string
  queueTitle: string
  repositoryTitle: string
  uploadAll: string
  cancel: string
  cancelAll: string
  retry: string
  remove: string
  edit: string
  delete: string
  download: string
  save: string
  uploadRow: string
  deleteConfirmTitle: string
  deleteConfirmBody: (filename: string) => string
  emptyRepository: string
  emptyQueue: string
  errors: {
    network: string
    server: string
    unknown: string
    missingRequired: (label: string) => string
    tooLarge: (maxBytes: number, actualBytes: number) => string
    tooMany: (max: number) => string
    badExtension: (allowed: string[]) => string
    emptyFile: string
    listFetch: string
  }
  notifications: {
    uploadAllDone: (ok: number, skipped: number, failed: number) => string
    listFetchFailed: string
    deleted: string
  }
}

// ----- Public component props ----------------------------------------------

export type UploaderProps<TMeta> = {
  adapter: UploadAdapter<TMeta>
  queryKey: QueryKey
  fields: ReadonlyArray<MetadataField<TMeta>>
  config: UploaderConfig
  constantMetadata: Record<string, unknown>
  readOnly?: boolean
  canMutateRow?: (file: StoredFile<TMeta>) => RowCapabilities
  validate?: (metadata: TMeta) => ValidationResult<TMeta>
  onNotify?: (notification: UploaderNotification) => void
  copy?: Partial<UploaderCopy>
}
