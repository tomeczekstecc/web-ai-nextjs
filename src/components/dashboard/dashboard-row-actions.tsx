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
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { resolveIcon } from "@/lib/icons"
import { AppDrawer, type AppDrawerMode } from "./app-drawer"
import { useDeleteDashboardItem } from "@/hooks/dashboard/use-delete-dashboard-item"
import type { DashboardReviewItem } from "@/lib/api/domains/dashboard/contract"

const EllipsisVerticalIcon = resolveIcon("EllipsisVertical")

export function DashboardRowActions({ item }: { item: DashboardReviewItem }) {
  const [mode, setMode] = useState<AppDrawerMode | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { mutate: deleteItem, isPending } = useDeleteDashboardItem(item)

  const handleConfirmDelete = () => {
    deleteItem(undefined, {
      onSuccess: () => setConfirmOpen(false),
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="flex size-8 text-muted-foreground data-open:bg-muted"
              size="icon"
            />
          }
        >
          <EllipsisVerticalIcon />
          <span className="sr-only">Otwórz menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => setMode("view")}>Podgląd</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode("edit")}>Edytuj</DropdownMenuItem>
          <DropdownMenuItem>Utwórz kopię</DropdownMenuItem>
          <DropdownMenuItem>Dodaj do ulubionych</DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* `variant="destructive"` here only styles the menu item — the actual
              delete runs from the confirm dialog below. */}
          <DropdownMenuItem
            variant="destructive"
            disabled={isPending}
            onClick={() => setConfirmOpen(true)}
          >
            Usuń…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usunąć projekt „{item.header}”?</DialogTitle>
            <DialogDescription>
              Projekt zostanie trwale usunięty. Tej operacji nie można cofnąć.
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
              onClick={handleConfirmDelete}
            >
              {isPending ? "Usuwanie…" : "Usuń projekt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AppDrawer
        item={item}
        mode={mode}
        onOpenChange={(open) => { if (!open) setMode(null) }}
      />
    </>
  )
}
