"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { DataTableProps } from "@/lib/data-table/types"
import { getColumnId, getColumnMeta, readPreferences, writePreferences } from "@/lib/data-table/utils"
import { useControlledState } from "@/hooks/data-table/use-controlled-state"
import { useDataTableControlColumns } from "@/hooks/data-table/use-data-table-control-columns"
import { useDataTablePreferences } from "@/hooks/data-table/use-data-table-preferences"
import { useDataTableReorder } from "@/hooks/data-table/use-data-table-reorder"
import { useDataTableSearch } from "@/hooks/data-table/use-data-table-search"
import { DataTableFooter } from "./footer"
import { DataTableToolbar } from "./toolbar"
import { DraggableRow } from "./draggable-row"
import { StaticRow } from "./static-row"

export function DataTable<TData>({
  data,
  columns,
  getRowId,
  search,
  visibility,
  selection,
  pagination,
  sorting,
  reorder,
  persistence: persistenceRaw,
  toolbar,
  emptyState = "Brak danych.",
  noResultsState = "Brak wyników.",
  loadingState = "Ładowanie danych...",
  errorState = "Nie udało się wczytać danych.",
  isLoading = false,
  error,
}: DataTableProps<TData>) {
  const persistence = persistenceRaw === false ? undefined : persistenceRaw
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  )

  // ── Column metadata ────────────────────────────────────────────────────
  const columnIds = React.useMemo(
    () => columns.map((column, index) => getColumnId(column, index)),
    [columns],
  )

  const requiredColumnIds = React.useMemo(
    () =>
      new Set(
        columns
          .map((column, index) =>
            getColumnMeta(column).required ? columnIds[index] : null,
          )
          .filter((id): id is string => Boolean(id)),
      ),
    [columnIds, columns],
  )

  // ── Preferences ────────────────────────────────────────────────────────
  const { initialPreferences } = useDataTablePreferences(persistence)

  // ── Visibility ─────────────────────────────────────────────────────────
  const validatedInitialVisibility = React.useMemo(() => {
    const storedVisibility =
      persistence?.columnVisibility &&
      initialPreferences.columnVisibility &&
      typeof initialPreferences.columnVisibility === "object"
        ? initialPreferences.columnVisibility
        : {}

    return Object.fromEntries(
      Object.entries(storedVisibility).filter(([columnId, isVisible]) => {
        return (
          columnIds.includes(columnId) &&
          !requiredColumnIds.has(columnId) &&
          typeof isVisible === "boolean"
        )
      }),
    ) as VisibilityState
  }, [columnIds, initialPreferences.columnVisibility, persistence?.columnVisibility, requiredColumnIds])

  const visibilityOptions = visibility === false ? undefined : visibility
  const [columnVisibility, setColumnVisibility] = useControlledState(
    visibilityOptions?.state,
    visibilityOptions?.onChange,
    validatedInitialVisibility,
  )

  // ── Selection ──────────────────────────────────────────────────────────
  const selectionOptions = selection === false ? undefined : selection
  const isSelectionEnabled = Boolean(selectionOptions?.enabled)
  const [rowSelection, setRowSelection] = useControlledState(
    selectionOptions?.state,
    selectionOptions?.onChange,
    {},
  )

  // ── Pagination ─────────────────────────────────────────────────────────
  const paginationOptions = pagination === false ? undefined : pagination
  const isPaginationEnabled = pagination !== false
  const pageSizeOptions = paginationOptions?.pageSizeOptions ?? [10, 20, 30, 40, 50]
  const persistedPageSize =
    persistence?.pageSize && typeof initialPreferences.pageSize === "number"
      ? initialPreferences.pageSize
      : undefined
  const initialPageSize =
    persistedPageSize ?? paginationOptions?.initialPageSize ?? pageSizeOptions[0] ?? 10
  const [paginationState, setPaginationState] = useControlledState(
    paginationOptions?.state,
    paginationOptions?.onChange,
    { pageIndex: 0, pageSize: initialPageSize },
  )

  // ── Sorting ────────────────────────────────────────────────────────────
  const sortingOptions = sorting === false ? undefined : sorting
  const [sortingState, setSortingState] = useControlledState(
    sortingOptions?.state,
    sortingOptions?.onChange,
    [],
  )

  // ── Row identity ───────────────────────────────────────────────────────
  const rowIdentityMap = React.useMemo(() => {
    const seen = new Set<string>()
    return data.map((row, index) => {
      const rowId = getRowId(row, index)
      if (!rowId || seen.has(rowId)) {
        throw new Error("DataTable requires stable, unique row identifiers.")
      }
      seen.add(rowId)
      return rowId
    })
  }, [data, getRowId])

  // ── Reorder ────────────────────────────────────────────────────────────
  const reorderOptions = reorder === false ? undefined : reorder
  const isReorderEnabled = Boolean(reorderOptions?.enabled)
  const { orderedData, buildDragHandler } = useDataTableReorder({
    rowIdentityMap,
    data,
    getRowId,
    reorderOptions,
  })

  // ── Search / Filter ────────────────────────────────────────────────────
  const searchOptions = search === false ? undefined : search
  const isSearchEnabled = Boolean(searchOptions?.enabled)
  const initialSearchValue =
    persistence?.search && typeof initialPreferences.search === "string"
      ? initialPreferences.search
      : searchOptions?.defaultValue ?? ""

  const searchableColumns = React.useMemo(
    () =>
      columns
        .map((column, index) => ({ id: columnIds[index], meta: getColumnMeta(column) }))
        .filter(({ meta }) => meta.searchable),
    [columnIds, columns],
  )

  const { searchValue, setSearchValue, filteredData } = useDataTableSearch({
    searchOptions,
    isSearchEnabled,
    initialSearchValue,
    orderedData,
    searchableColumns,
  })

  // ── Reorder guards ─────────────────────────────────────────────────────
  const isSearchActive = isSearchEnabled && Boolean(searchValue.trim())
  const isSortingActive = sortingState.length > 0
  const hasAmbiguousPagination =
    isPaginationEnabled &&
    reorderOptions?.mode !== "page" &&
    filteredData.length > paginationState.pageSize
  const canReorder =
    isReorderEnabled && !isSearchActive && !isSortingActive && !hasAmbiguousPagination

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!active || !over || active.id === over.id) return
      buildDragHandler(canReorder)(String(active.id), String(over.id))
    },
    [buildDragHandler, canReorder],
  )

  // ── Persist preferences ────────────────────────────────────────────────
  React.useEffect(() => {
    if (!persistence?.key) return

    const nextPreferences = readPreferences(persistence.key)
    if (persistence.search) nextPreferences.search = searchValue
    if (persistence.columnVisibility) {
      nextPreferences.columnVisibility = Object.fromEntries(
        Object.entries(columnVisibility).filter(
          ([columnId]) => !requiredColumnIds.has(columnId),
        ),
      )
    }
    if (persistence.pageSize) nextPreferences.pageSize = paginationState.pageSize

    writePreferences(persistence.key, nextPreferences)
  }, [
    columnVisibility,
    paginationState.pageSize,
    persistence?.key,
    persistence?.search,
    persistence?.columnVisibility,
    persistence?.pageSize,
    requiredColumnIds,
    searchValue,
  ])

  // ── Control columns (drag + select) ────────────────────────────────────
  const controlColumns = useDataTableControlColumns<TData>({
    isReorderEnabled,
    canReorder,
    isSelectionEnabled,
  })

  const tableColumns = React.useMemo(
    () => [...controlColumns, ...columns],
    [columns, controlColumns],
  )

  // ── TanStack Table ─────────────────────────────────────────────────────
  const table = useReactTable({
    data: filteredData,
    columns: tableColumns,
    state: {
      sorting: sortingState,
      columnVisibility,
      rowSelection,
      pagination: paginationState,
    },
    getRowId: (row, _index, parent) => {
      if (parent) return `${parent.id}.${getRowId(row, _index)}`
      const sourceIndex = data.indexOf(row)
      return getRowId(row, sourceIndex >= 0 ? sourceIndex : _index)
    },
    enableRowSelection: isSelectionEnabled,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSortingState,
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility((current) => {
        const nextValue = typeof updater === "function" ? updater(current) : updater
        return Object.fromEntries(
          Object.entries(nextValue).filter(([columnId]) => !requiredColumnIds.has(columnId)),
        ) as VisibilityState
      })
    },
    onPaginationChange: setPaginationState,
    manualPagination: Boolean(paginationOptions?.manual),
    manualSorting: Boolean(sortingOptions?.manual),
    pageCount: paginationOptions?.pageCount,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sortingOptions?.manual ? undefined : getSortedRowModel(),
    getPaginationRowModel:
      isPaginationEnabled && !paginationOptions?.manual ? getPaginationRowModel() : undefined,
  })

  // ── Derived UI state ───────────────────────────────────────────────────
  const visibleRows = table.getRowModel().rows
  const shouldShowEmpty = !isLoading && !error && data.length === 0
  const shouldShowNoResults = !isLoading && !error && data.length > 0 && visibleRows.length === 0
  const visibleColumnCount = Math.max(table.getVisibleLeafColumns().length, 1)
  const visibilityEnabled = visibility !== false && Boolean(visibilityOptions?.enabled)
  const hideableColumns = table.getAllColumns().filter((column) => {
    const meta = getColumnMeta(column.columnDef)
    return (
      column.getCanHide() &&
      !requiredColumnIds.has(column.id) &&
      !meta.hideFromVisibilityMenu &&
      !column.id.startsWith("__")
    )
  })

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex w-full flex-col gap-4">
      {/* Toolbar */}
      <DataTableToolbar
        sortableId={sortableId}
        isSearchEnabled={isSearchEnabled}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        searchPlaceholder={searchOptions?.placeholder ?? "Szukaj..."}
        toolbar={toolbar}
        visibilityEnabled={visibilityEnabled}
        hideableColumns={hideableColumns}
      />

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="h-24 text-center">
                      {loadingState}
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && Boolean(error) && (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="h-24 text-center">
                      {errorState}
                    </TableCell>
                  </TableRow>
                )}
                {shouldShowEmpty && (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="h-24 text-center">
                      {emptyState}
                    </TableCell>
                  </TableRow>
                )}
                {shouldShowNoResults && (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} className="h-24 text-center">
                      {noResultsState}
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !error && visibleRows.length > 0 &&
                  (isReorderEnabled ? (
                    <SortableContext
                      items={visibleRows.map((row) => row.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {visibleRows.map((row) => (
                        <DraggableRow key={row.id} row={row} disabled={!canReorder} />
                      ))}
                    </SortableContext>
                  ) : (
                    visibleRows.map((row) => <StaticRow key={row.id} row={row} />)
                  ))}
              </TableBody>
            </Table>
          </div>
        </DndContext>
      </div>

      {/* Footer */}
      <DataTableFooter
        sortableId={sortableId}
        isSelectionEnabled={isSelectionEnabled}
        isPaginationEnabled={isPaginationEnabled}
        table={table}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  )
}
