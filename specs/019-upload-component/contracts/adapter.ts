// ============================================================================
// Adapter Contract — src/components/uploader/types.ts (canonical excerpt)
// ============================================================================
//
// This file is part of the Phase 1 plan artifacts for feature
// 019-upload-component. The shapes here are the canonical TypeScript
// interfaces that the implementation MUST match. Each consuming domain
// implements its own `UploadAdapter<TMeta>` using the project's
// `xhrUpload` helper at `src/lib/api/core/xhr-upload.ts`.
//
// See also:
// - contracts/component.ts — public component prop surface
// - contracts/http.md      — wire contract for the Laravel team
// - data-model.md          — entity definitions and relationships

import type { QueryKey } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Stored file (durable, backend-issued) — see data-model.md §4
// ---------------------------------------------------------------------------

export type StoredFile<TMeta> = {
  id: string;
  name: string;
  size: number;
  uploadedAt: string; // ISO-8601
  metadata: TMeta;
};

// ---------------------------------------------------------------------------
// Typed failure surface — see data-model.md §5
// ---------------------------------------------------------------------------

export type UploaderError =
  | { kind: 'cancelled' }
  | { kind: 'network'; message: string }
  | {
      kind: 'validation';
      message: string;
      /**
       * Backend validation errors keyed by metadata field key.
       * Keys with the `metadata.` prefix from a Laravel validation
       * response are stripped before reaching the component.
       */
      fieldErrors?: Record<string, string>;
    }
  | { kind: 'server'; status: number; message: string }
  | { kind: 'unknown'; message: string };

// ---------------------------------------------------------------------------
// Adapter contract — implemented by each consuming domain
// ---------------------------------------------------------------------------

export interface UploadAdapter<TMeta> {
  /**
   * Fetch the current list of stored files for the adapter's context.
   * Called by TanStack Query; the `signal` comes from `queryFn`'s context.
   *
   * Rejects with `UploaderError`.
   */
  list(signal: AbortSignal): Promise<StoredFile<TMeta>[]>;

  /**
   * Upload one file with its metadata in a single multipart request.
   * MUST report byte-level progress via `onProgress` at ≤100 ms cadence
   * for files larger than a few hundred kilobytes (FR-034).
   * MUST be cancellable via `signal`.
   * Implementations SHOULD use the `xhrUpload` helper to satisfy both.
   *
   * Resolves with the canonical `StoredFile<TMeta>` as returned by the backend.
   * Rejects with `UploaderError`.
   */
  upload(
    input: { file: File; metadata: TMeta },
    opts: { onProgress: (pct: number) => void; signal: AbortSignal },
  ): Promise<StoredFile<TMeta>>;

  /**
   * Update the metadata of an already-stored file. JSON-only; no file part.
   * Rejects with `UploaderError`.
   */
  updateMetadata(
    id: string,
    metadata: TMeta,
    signal: AbortSignal,
  ): Promise<StoredFile<TMeta>>;

  /**
   * Delete a stored file. The component will have already obtained user
   * confirmation by the time this is called (FR-024).
   * Rejects with `UploaderError`.
   */
  delete(id: string, signal: AbortSignal): Promise<void>;

  /**
   * Fetch a stored file's bytes plus its filename so the component can
   * trigger a browser download via `<a download={filename}>` (Q6, SC-008).
   * Rejects with `UploaderError`.
   */
  download(
    id: string,
    signal: AbortSignal,
  ): Promise<{ blob: Blob; filename: string }>;
}

// ---------------------------------------------------------------------------
// xhrUpload helper — src/lib/api/core/xhr-upload.ts (canonical signature)
// ---------------------------------------------------------------------------

export type XhrUploadOpts = {
  /** Called with 0–100 as bytes flow to the network layer. */
  onProgress: (pct: number) => void;
  /** AbortSignal forwarded from the adapter / TanStack Query. */
  signal: AbortSignal;
  /** Additional headers (auth, CSRF, etc.). Content-Type is set by XHR for FormData. */
  headers?: Record<string, string>;
  /** HTTP method. Default: 'POST'. */
  method?: 'POST' | 'PUT';
};

/**
 * Single-chokepoint helper for uploads that need byte-level progress.
 * Wraps XMLHttpRequest and produces UploaderError values uniformly.
 *
 * Status-to-error mapping:
 *   - Network failure / signal.aborted with signal.aborted=true → `cancelled`
 *   - Network failure otherwise                                 → `network`
 *   - 2xx → resolve with parsed JSON
 *   - 4xx → `validation` (parsed body's `message` + `errors` map; `errors.metadata.*` prefix stripped)
 *   - 5xx → `server`
 *   - Parse failure on 2xx response → `unknown`
 */
export declare function xhrUpload<T>(
  url: string,
  body: FormData | Blob,
  opts: XhrUploadOpts,
): Promise<T>;

// ---------------------------------------------------------------------------
// buildUploadFormData helper — src/lib/api/core/file-upload.ts
// ---------------------------------------------------------------------------

/**
 * Build a FormData body matching the upload wire contract:
 *   - `file` part:     binary, original filename, original Content-Type
 *   - `metadata` part: JSON Blob with application/json Content-Type
 *
 * `metadata` SHOULD be the consumer's TMeta merged with the component's
 * constantMetadata prop (the adapter is responsible for the merge).
 */
export declare function buildUploadFormData(
  file: File,
  metadata: unknown,
): FormData;

// ---------------------------------------------------------------------------
// Re-export bundle for adapter authors
// ---------------------------------------------------------------------------

export type AdapterContract<TMeta> = {
  adapter: UploadAdapter<TMeta>;
  queryKey: QueryKey;
};
