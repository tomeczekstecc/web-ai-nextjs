"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { resolveIcon } from "@/lib/icons"
import { useDeleteDashboardItems } from "@/hooks/dashboard/use-delete-dashboard-items"

const Trash2Icon = resolveIcon("Trash2")

interface DashboardBulkActionsProps {
  selectedIds: number[]
  onClear: () => void
}

export function DashboardBulkActions({ selectedIds, onClear }: DashboardBulkActionsProps) {
  const [open, setOpen] = useState(false)
  const { mutate: deleteItems, isPending } = useDeleteDashboardItems(() => {
    onClear()
    setOpen(false)
  })

  if (selectedIds.length === 0) return null

  const count = selectedIds.length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger is outline — destructive variant is reserved for the confirm step. */}
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" disabled={isPending} />
        }
      >
        <Trash2Icon data-icon="inline-start" />
        {`Usuń zaznaczone (${count})`}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {count === 1 ? "Usunąć wybrany projekt?" : `Usunąć ${count} projekty?`}
          </DialogTitle>
          <DialogDescription>
            {count === 1
              ? "Wybrany projekt zostanie trwale usunięty. Tej operacji nie można cofnąć."
              : "Wybrane projekty zostaną trwale usunięte. Tej operacji nie można cofnąć."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={isPending} />}
          >
            Anuluj
          </DialogClose>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => deleteItems(selectedIds)}
          >
            {isPending ? "Usuwanie…" : `Usuń (${count})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
