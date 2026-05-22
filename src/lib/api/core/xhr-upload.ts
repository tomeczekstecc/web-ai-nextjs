// XMLHttpRequest wrapper that reports byte-level upload progress and
// produces a typed UploaderError on failure. See:
//   specs/019-upload-component/contracts/adapter.ts
//   specs/019-upload-component/research.md R2

import type { UploaderError } from '@/components/uploader/types'

export type XhrUploadOpts = {
  onProgress: (pct: number) => void
  signal: AbortSignal
  headers?: Record<string, string>
  method?: 'POST' | 'PUT'
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api'

function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${BASE}${path}`
}

function stripMetadataPrefix(errors: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(errors)) {
    const key = k.startsWith('metadata.') ? k.slice('metadata.'.length) : k
    if (Array.isArray(v) && typeof v[0] === 'string') out[key] = v[0]
    else if (typeof v === 'string') out[key] = v
  }
  return out
}

function parseErrorBody(text: string): { message: string; fieldErrors?: Record<string, string> } {
  try {
    const obj = JSON.parse(text) as { message?: string; errors?: Record<string, unknown> }
    return {
      message: typeof obj.message === 'string' ? obj.message : 'Błąd serwera',
      fieldErrors: obj.errors ? stripMetadataPrefix(obj.errors) : undefined,
    }
  } catch {
    return { message: text || 'Błąd serwera' }
  }
}

export function xhrUpload<T>(
  path: string,
  body: FormData | Blob,
  opts: XhrUploadOpts,
): Promise<T> {
  const { onProgress, signal, headers, method = 'POST' } = opts

  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject({ kind: 'cancelled' } satisfies UploaderError)
      return
    }

    const xhr = new XMLHttpRequest()
    xhr.open(method, resolveUrl(path))
    xhr.withCredentials = true
    xhr.responseType = 'text'

    if (headers) {
      for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v)
    }

    const onAbort = () => xhr.abort()
    signal.addEventListener('abort', onAbort)
    const cleanup = () => signal.removeEventListener('abort', onAbort)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      cleanup()
      const status = xhr.status
      const text = xhr.responseText ?? ''
      if (status >= 200 && status < 300) {
        if (!text) {
          resolve(undefined as T)
          return
        }
        try {
          resolve(JSON.parse(text) as T)
        } catch {
          reject({ kind: 'unknown', message: 'Nieprawidłowa odpowiedź serwera' } satisfies UploaderError)
        }
        return
      }
      const parsed = parseErrorBody(text)
      if (status >= 400 && status < 500) {
        reject({
          kind: 'validation',
          message: parsed.message,
          fieldErrors: parsed.fieldErrors,
        } satisfies UploaderError)
      } else {
        reject({ kind: 'server', status, message: parsed.message } satisfies UploaderError)
      }
    }

    xhr.onerror = () => {
      cleanup()
      if (signal.aborted) reject({ kind: 'cancelled' } satisfies UploaderError)
      else reject({ kind: 'network', message: 'Błąd sieci' } satisfies UploaderError)
    }

    xhr.onabort = () => {
      cleanup()
      reject({ kind: 'cancelled' } satisfies UploaderError)
    }

    xhr.send(body)
  })
}
