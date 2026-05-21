"use client"

import { Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDeleteDashboardItems } from "@/hooks/dashboard/use-delete-dashboard-items"

interface DashboardBulkActionsProps {
  selectedIds: number[]
  onClear: () => void
}

export function DashboardBulkActions({ selectedIds, onClear }: DashboardBulkActionsProps) {
  const { mutate: deleteItems, isPending } = useDeleteDashboardItems(onClear)

  if (selectedIds.length === 0) return null

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => deleteItems(selectedIds)}
    >
      <Trash2Icon data-icon="inline-start" />
      {isPending ? "Usuwanie…" : `Usuń zaznaczone (${selectedIds.length})`}
    </Button>
  )
}
