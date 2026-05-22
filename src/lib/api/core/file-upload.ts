// Build the multipart/form-data body for an upload request.
// See specs/019-upload-component/contracts/http.md §2

export function buildUploadFormData(file: File, metadata: unknown): FormData {
  const fd = new FormData()
  fd.append('file', file)
  fd.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
  )
  return fd
}
