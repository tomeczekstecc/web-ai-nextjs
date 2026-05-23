'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PlayIcon, PencilIcon, Trash2Icon, LoaderIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useStore } from '@/lib/store'
import { useReportGeneration } from '@/hooks/reports/use-report-generation'
import { useDeleteReport } from '@/hooks/reports/use-delete-report'
import type { ReportListItem } from '@/lib/api/domains/reports/contract'

type Props = {
  report: ReportListItem
  onGenerate?: (report: ReportListItem) => void
}

export function ReportsRowActions({ report, onGenerate }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const anyPending = useStore(s =>
    Object.values(s.generationStates).some(st => st === 'pending'),
  )
  const generationState = useStore(s => s.generationStates[report.id] ?? 'idle')
  const { generate } = useReportGeneration(report.id)
  const { mutate: deleteReport, isPending: isDeleting } = useDeleteReport(report)

  function handleGenerate() {
    if (report.parameters.length === 0) {
      void generate()
    } else {
      onGenerate?.(report)
    }
  }

  function handleConfirmDelete() {
    deleteReport(undefined, { onSuccess: () => setConfirmOpen(false) })
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={anyPending}
          onClick={handleGenerate}
          aria-label="Generuj raport"
        >
          {generationState === 'pending' ? (
            <LoaderIcon className="animate-spin" />
          ) : (
            <PlayIcon />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={anyPending}
          nativeButton={false}
          render={<Link href={`/reports/${report.id}`} aria-label="Edytuj raport" />}
        >
          <PencilIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={anyPending}
          onClick={() => setConfirmOpen(true)}
          aria-label="Usuń raport"
        >
          <Trash2Icon />
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usunąć raport &bdquo;{report.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              Raport zostanie trwale usunięty. Tej operacji nie można cofnąć.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={isDeleting} />}>
              Anuluj
            </DialogClose>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? 'Usuwanie...' : 'Usuń raport'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
