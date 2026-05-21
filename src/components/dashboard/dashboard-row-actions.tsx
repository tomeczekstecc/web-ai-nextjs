"use client"

import { useState } from "react"
import { EllipsisVerticalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AppDrawer, type AppDrawerMode } from "./app-drawer"
import { useDeleteDashboardItem } from "@/hooks/dashboard/use-delete-dashboard-item"
import type { DashboardReviewItem } from "@/lib/api/domains/dashboard/contract"

export function DashboardRowActions({ item }: { item: DashboardReviewItem }) {
  const [mode, setMode] = useState<AppDrawerMode | null>(null)
  const { mutate: deleteItem, isPending } = useDeleteDashboardItem(item)

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
          <DropdownMenuItem
            variant="destructive"
            disabled={isPending}
            onClick={() => deleteItem()}
          >
            {isPending ? "Usuwanie…" : "Usuń"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AppDrawer
        item={item}
        mode={mode}
        onOpenChange={(open) => { if (!open) setMode(null) }}
      />
    </>
  )
}
