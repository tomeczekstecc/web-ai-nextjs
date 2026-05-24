"use client"

import dynamic from "next/dynamic"

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
import { useUpdateDashboardItem } from "@/hooks/dashboard/use-update-dashboard-item"
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
  const mutation = useUpdateDashboardItem(item)

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
            onSave={async (data) => {
              try {
                await mutation.mutateAsync(data)
                onOpenChange(false)
              } catch {
                // error toast handled by useUpdateDashboardItem
              }
            }}
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
          <SheetClose render={<Button variant="outline" disabled={mutation.isPending} />}>
            Zamknij
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
