// Trigger a browser "Save as…" for an in-memory Blob.
// Extracted so any feature (uploader, exports, reports) can reuse the same
// cross-browser save trick without re-implementing the anchor dance.

export function saveBlobAsFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Defer revoke so Safari/Firefox have time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Best-effort filename parser for `Content-Disposition` headers. */
export function parseContentDispositionFilename(
  header: string | null,
): string | null {
  if (!header) return null
  // RFC 5987: filename*=UTF-8''encoded — preferred when present.
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header)
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].replace(/^"|"$/g, ''))
    } catch {
      /* fall through */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain?.[1] ?? null
}
