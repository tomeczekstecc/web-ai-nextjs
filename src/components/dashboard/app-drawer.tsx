"use client"

import dynamic from "next/dynamic"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { toast } from "@/components/toast"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { updateDashboardReviewItem } from "@/lib/api/domains/dashboard/commands"
import { dashboardKeys } from "@/lib/api/domains/dashboard/query-keys"
import { DashboardEditForm, EDIT_FORM_ID } from "./dashboard-edit-form"
import type { DashboardReviewItem } from "@/lib/api/domains/dashboard/contract"

const DashboardActivityChart = dynamic(
  () => import("./dashboard-activity-chart").then((m) => ({ default: m.DashboardActivityChart })),
  { ssr: false },
)

export type AppDrawerMode = "view" | "edit"

type AppDrawerProps = {
  item: DashboardReviewItem
  mode: AppDrawerMode | null
  onOpenChange: (open: boolean) => void
}

const DESCRIPTIONS: Record<AppDrawerMode, string> = {
  view: "Podgląd aktywności projektu z ostatnich 6 miesięcy.",
  edit: "Edycja danych projektu.",
}

export function AppDrawer({ item, mode, onOpenChange }: AppDrawerProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof updateDashboardReviewItem>[1]) =>
      updateDashboardReviewItem(item.id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dashboardKeys.reviewItems() })
      toast.success("Projekt został zapisany.")
      onOpenChange(false)
    },
    onError: () => {
      toast.error("Nie udało się zapisać projektu. Spróbuj ponownie.")
    },
  })

  return (
    <Sheet open={mode !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="data-[side=right]:sm:max-w-2xl flex flex-col gap-0 p-0">
        <SheetHeader className="gap-1 border-b border-border/60 p-4">
          <SheetTitle>{item.header}</SheetTitle>
          <SheetDescription>
            {mode ? DESCRIPTIONS[mode] : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto p-4 text-sm">
          {mode === "view" && <DashboardActivityChart />}
          <DashboardEditForm
            item={item}
            readOnly={mode === "view"}
            onSave={async (data) => { await mutation.mutateAsync(data) }}
          />
        </div>

        <SheetFooter className="border-t border-border/60 p-4">
          {mode === "edit" && (
            <Button
              type="submit"
              form={EDIT_FORM_ID}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Zapisywanie…" : "Zapisz"}
            </Button>
          )}
          <SheetClose render={<Button variant={mode === "edit" ? "outline" : "default"} disabled={mutation.isPending} />}>
            Zamknij
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
