'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { UploaderCopy } from '../types'

type Props = {
  open: boolean
  filename: string
  copy: UploaderCopy
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({
  open,
  filename,
  copy,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.deleteConfirmTitle}</DialogTitle>
          <DialogDescription>{copy.deleteConfirmBody(filename)}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            {copy.cancel}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={busy}>
            {copy.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
