// ============================================================================
// Component Contract — public prop surface of <Uploader<TMeta>>
// ============================================================================
//
// Canonical TypeScript shape the implementation MUST match. Used by
// consumers (e.g. AttachmentsPage in the wizard demo). See data-model.md §8
// for the entity-level overview and adapter.ts for the integration seam.

import type { ReactNode } from 'react';
import type { QueryKey } from '@tanstack/react-query';
import type {
  StoredFile,
  UploadAdapter,
} from './adapter';

// ---------------------------------------------------------------------------
// Static configuration (limits)
// ---------------------------------------------------------------------------

export type UploaderConfig = {
  maxFiles: number;       // total: queue + stored
  maxSize: number;        // bytes per file
  allowedExtensions: string[]; // lowercase, no leading dot
};

// ---------------------------------------------------------------------------
// Per-file metadata schema (consumer-declared)
// ---------------------------------------------------------------------------

export type MetadataFieldKind =
  | 'text'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date';

export type MetadataFieldOption<V> = { value: V; label: string };

export type MetadataField<TMeta, K extends keyof TMeta = keyof TMeta> = {
  key: K;
  label: string;
  kind: MetadataFieldKind;
  defaultValue?: TMeta[K];
  required?: boolean;
  options?: ReadonlyArray<MetadataFieldOption<TMeta[K]>>;
  /** Defaults to true. Set false for write-once fields. */
  editableAfterUpload?: boolean;
  /** Escape hatch — full control over the rendered input. */
  render?: (props: {
    value: TMeta[K];
    onChange: (v: TMeta[K]) => void;
    error?: string;
    disabled?: boolean;
    label: string;
  }) => ReactNode;
};

// ---------------------------------------------------------------------------
// Batch-level notification surface
// ---------------------------------------------------------------------------

export type UploaderNotification =
  | { level: 'success'; message: string }
  | { level: 'error'; message: string };

// ---------------------------------------------------------------------------
// Polish copy bundle
// ---------------------------------------------------------------------------

export type UploaderCopy = {
  dropzoneDrag: string;
  dropzoneIdle: string;
  dropzoneButton: string;
  queueTitle: string;
  repositoryTitle: string;
  uploadAll: string;
  cancel: string;
  cancelAll: string;
  retry: string;
  remove: string;
  edit: string;
  delete: string;
  download: string;
  save: string;
  deleteConfirmTitle: string;
  deleteConfirmBody: (filename: string) => string;
  emptyRepository: string;
  emptyQueue: string;
  errors: {
    network: string;
    server: string;
    unknown: string;
    missingRequired: (label: string) => string;
    tooLarge: (maxBytes: number, actualBytes: number) => string;
    tooMany: (max: number) => string;
    badExtension: (allowed: string[]) => string;
    emptyFile: string;
    listFetch: string;
  };
  notifications: {
    uploadAllDone: (ok: number, skipped: number, failed: number) => string;
    listFetchFailed: string;
    deleted: string;
  };
};

// ---------------------------------------------------------------------------
// Per-row authorization callback (Q10)
// ---------------------------------------------------------------------------

export type RowCapabilities = { edit: boolean; delete: boolean };

// ---------------------------------------------------------------------------
// Boundary metadata validation (consumer-supplied)
// ---------------------------------------------------------------------------

export type ValidationResult<TMeta> =
  | true
  | { fieldErrors: Partial<Record<keyof TMeta, string>> };

// ---------------------------------------------------------------------------
// Public component props
// ---------------------------------------------------------------------------

export type UploaderProps<TMeta> = {
  /** REQUIRED — backend integration seam. */
  adapter: UploadAdapter<TMeta>;
  /** REQUIRED — TanStack Query key for the stored-file list. */
  queryKey: QueryKey;
  /** REQUIRED — metadata field schema. */
  fields: ReadonlyArray<MetadataField<TMeta>>;
  /** REQUIRED — limits. */
  config: UploaderConfig;
  /** REQUIRED — context fields merged into every metadata payload (e.g. parent entity id). */
  constantMetadata: Record<string, unknown>;

  /** Hide upload area; disable edit/delete on stored rows. Default: false. */
  readOnly?: boolean;
  /** Per-row gate for edit/delete actions. Default: both true. */
  canMutateRow?: (file: StoredFile<TMeta>) => RowCapabilities;
  /** Optional boundary validation invoked before upload and before metadata-save. */
  validate?: (metadata: TMeta) => ValidationResult<TMeta>;
  /** Optional batch-level notification callback. */
  onNotify?: (notification: UploaderNotification) => void;
  /** Optional partial overrides for built-in Polish copy. */
  copy?: Partial<UploaderCopy>;
};

// ---------------------------------------------------------------------------
// Implementation export shape (informational)
// ---------------------------------------------------------------------------

export declare function Uploader<TMeta>(
  props: UploaderProps<TMeta>,
): React.JSX.Element;

// ---------------------------------------------------------------------------
// Re-export bundle convenience
// ---------------------------------------------------------------------------

export type {
  StoredFile,
  UploadAdapter,
  UploaderError,
} from './adapter';
