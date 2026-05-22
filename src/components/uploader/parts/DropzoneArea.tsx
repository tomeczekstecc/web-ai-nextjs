// Drag-and-drop area using react-dropzone.
// See specs/019-upload-component/tasks.md T011 and research.md R1.

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { UploaderCopy } from '../types'

type Props = {
  onFiles: (files: File[]) => { rejected: Array<{ name: string; reason: string }> }
  copy: UploaderCopy
  disabled?: boolean
}

export function DropzoneArea({ onFiles, copy, disabled }: Props) {
  const [rejections, setRejections] = useState<Array<{ name: string; reason: string; id: string }>>([])

  const onDrop = useCallback(
    (accepted: File[]) => {
      const { rejected } = onFiles(accepted)
      if (rejected.length > 0) {
        const ts = Date.now()
        setRejections((prev) => [
          ...prev,
          ...rejected.map((r, i) => ({ ...r, id: `${ts}-${i}` })),
        ])
      }
    },
    [onFiles],
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    multiple: true,
    disabled,
  })

  useEffect(() => {
    if (rejections.length === 0) return
    const t = setTimeout(() => setRejections([]), 6000)
    return () => clearTimeout(t)
  }, [rejections])

  if (disabled) return null

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors',
          isDragActive && 'border-primary bg-primary/5',
        )}
        role="button"
        tabIndex={0}
        aria-label={copy.dropzoneIdle}
      >
        <input {...getInputProps()} />
        <Upload className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          {isDragActive ? copy.dropzoneDrag : copy.dropzoneIdle}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={open}>
          {copy.dropzoneButton}
        </Button>
      </div>

      {rejections.length > 0 && (
        <div className="flex flex-col gap-2" role="alert" aria-live="polite">
          {rejections.map((r) => (
            <Alert key={r.id} variant="destructive">
              <AlertDescription className="flex items-start justify-between gap-2">
                <span>
                  <strong className="font-medium">{r.name}</strong> — {r.reason}
                </span>
                <button
                  type="button"
                  onClick={() => setRejections((prev) => prev.filter((x) => x.id !== r.id))}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={copy.cancel}
                >
                  <X className="size-4" />
                </button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  )
}
