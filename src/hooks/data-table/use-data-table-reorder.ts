import * as React from "react"
import { arrayMove } from "@dnd-kit/sortable"
import type { DataTableReorderOptions } from "@/lib/data-table/types"

type UseDataTableReorderOptions<TData> = {
  rowIdentityMap: string[]
  data: TData[]
  getRowId: (row: TData, index: number) => string
  reorderOptions: DataTableReorderOptions<TData> | undefined
}

export function useDataTableReorder<TData>({
  rowIdentityMap,
  data,
  getRowId,
  reorderOptions,
}: UseDataTableReorderOptions<TData>) {
  const [localOrderIds, setLocalOrderIds] = React.useState<string[]>(rowIdentityMap)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalOrderIds((currentIds) => {
      const validIds = new Set(rowIdentityMap)
      const preservedIds = currentIds.filter((id) => validIds.has(id))
      const newIds = rowIdentityMap.filter((id) => !preservedIds.includes(id))
      return [...preservedIds, ...newIds]
    })
  }, [rowIdentityMap])

  const orderedData = React.useMemo(() => {
    const byId = new Map(data.map((row, index) => [getRowId(row, index), row] as const))
    return localOrderIds
      .map((id) => byId.get(id))
      .filter((row): row is TData => Boolean(row))
  }, [data, getRowId, localOrderIds])

  function buildDragHandler(canReorder: boolean) {
    return function handleDragEnd(active: string, over: string) {
      if (!canReorder) return

      setLocalOrderIds((currentIds) => {
        const oldIndex = currentIds.indexOf(active)
        const newIndex = currentIds.indexOf(over)
        if (oldIndex < 0 || newIndex < 0) return currentIds

        const nextIds = arrayMove(currentIds, oldIndex, newIndex)

        queueMicrotask(() => {
          if (reorderOptions) {
            const rowsById = new Map(
              data.map((row, index) => [getRowId(row, index), row] as const),
            )
            const rows = nextIds
              .map((id) => rowsById.get(id))
              .filter((row): row is TData => Boolean(row))
            reorderOptions.onReorder?.({ orderedIds: nextIds, rows })
          }
        })

        return nextIds
      })
    }
  }

  return { localOrderIds, orderedData, setLocalOrderIds, buildDragHandler }
}
