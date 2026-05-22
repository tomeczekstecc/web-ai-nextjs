// Map a BrowserApiError into the typed UploaderError shape.
// See specs/019-upload-component/quickstart.md §Step 2.

import type { BrowserApiError } from '@/lib/api/core/browser-http'
import type { UploaderError } from '@/components/uploader/types'

export function mapBrowserFetchError(err: BrowserApiError): UploaderError {
  if (err.code === 'NETWORK_ERROR') {
    return { kind: 'network', message: err.message || 'Błąd sieci' }
  }
  const m = /^HTTP_(\d+)$/.exec(err.code)
  const status = m ? Number(m[1]) : 500
  if (status >= 400 && status < 500) {
    const fieldErrors = extractFieldErrors(err.details)
    return { kind: 'validation', message: err.message, fieldErrors }
  }
  return { kind: 'server', status, message: err.message }
}

function extractFieldErrors(details: unknown): Record<string, string> | undefined {
  if (!details || typeof details !== 'object') return undefined
  const errors = (details as Record<string, unknown>).errors
  if (!errors || typeof errors !== 'object') return undefined
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(errors as Record<string, unknown>)) {
    const key = k.startsWith('metadata.') ? k.slice('metadata.'.length) : k
    if (Array.isArray(v) && typeof v[0] === 'string') out[key] = v[0]
    else if (typeof v === 'string') out[key] = v
  }
  return Object.keys(out).length > 0 ? out : undefined
}
