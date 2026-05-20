import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"

import { Checkbox } from "@/components/ui/checkbox"
import { DragHandle } from "@/components/data-table/drag-handle"
import type { DataTableColumnMeta } from "@/lib/data-table/types"

interface UseDataTableControlColumnsOptions {
  isReorderEnabled: boolean
  canReorder: boolean
  isSelectionEnabled: boolean
}

export function useDataTableControlColumns<TData>({
  isReorderEnabled,
  canReorder,
  isSelectionEnabled,
}: UseDataTableControlColumnsOptions): ColumnDef<TData>[] {
  return React.useMemo<ColumnDef<TData>[]>(() => {
    const nextColumns: ColumnDef<TData>[] = []

    if (isReorderEnabled) {
      nextColumns.push({
        id: "__drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.id} disabled={!canReorder} />,
        enableSorting: false,
        enableHiding: false,
        meta: {
          label: "Kolejność",
          required: true,
          hideFromVisibilityMenu: true,
        } satisfies DataTableColumnMeta<TData>,
      })
    }

    if (isSelectionEnabled) {
      nextColumns.push({
        id: "__select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={
                table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
              aria-label="Zaznacz wszystkie wiersze"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
              aria-label="Zaznacz wiersz"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        meta: {
          label: "Zaznaczenie",
          required: true,
          hideFromVisibilityMenu: true,
        } satisfies DataTableColumnMeta<TData>,
      })
    }

    return nextColumns
  }, [canReorder, isReorderEnabled, isSelectionEnabled])
}
