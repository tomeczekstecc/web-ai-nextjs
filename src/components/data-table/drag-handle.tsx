"use client"

import { useSortable } from "@dnd-kit/sortable"
import type { UniqueIdentifier } from "@dnd-kit/core"
import { GripVerticalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DragHandle({ id, disabled }: { id: UniqueIdentifier; disabled: boolean }) {
  const { attributes, listeners } = useSortable({ id, disabled })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
    >
      <GripVerticalIcon className="size-3 text-muted-foreground" />
      <span className="sr-only">Zmień kolejność wiersza</span>
    </Button>
  )
}
