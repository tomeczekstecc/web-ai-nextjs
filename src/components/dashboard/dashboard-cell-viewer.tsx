"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { DashboardActivityChart } from "./dashboard-activity-chart"
import { DashboardEditForm } from "./dashboard-edit-form"
import type { DashboardTableRow } from "./dashboard-columns"

interface TableCellViewerProps {
  item: DashboardTableRow
}

export function TableCellViewer({ item }: TableCellViewerProps) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="w-fit px-0 text-left text-foreground">
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.header}</DrawerTitle>
          <DrawerDescription>
            Podgląd aktywności projektu z ostatnich 6 miesięcy
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && <DashboardActivityChart />}
          <DashboardEditForm item={item} />
        </div>
        <DrawerFooter>
          <Button>Zapisz</Button>
          <DrawerClose asChild>
            <Button variant="outline">Zamknij</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
