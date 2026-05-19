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
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronDownIcon,
  Columns3Icon,
  GripVerticalIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type DataTableColumnMeta<TData> = {
  label?: string
  required?: boolean
  searchable?: boolean
  getSearchValue?: (row: TData) => unknown
  hideFromVisibilityMenu?: boolean
}

export type DataTableSearchOptions<TData> = {
  enabled?: boolean
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  getSearchValues?: (row: TData) => unknown[]
  compare?: (query: string, values: unknown[], row: TData) => boolean
}

export type DataTableVisibilityOptions = {
  enabled?: boolean
  state?: VisibilityState
  onChange?: OnChangeFn<VisibilityState>
}

export type DataTableSelectionOptions = {
  enabled?: boolean
  state?: RowSelectionState
  onChange?: OnChangeFn<RowSelectionState>
}

export type DataTablePaginationOptions = {
  enabled?: boolean
  pageSizeOptions?: number[]
  initialPageSize?: number
  state?: PaginationState
  onChange?: OnChangeFn<PaginationState>
  pageCount?: number
  manual?: boolean
}

export type DataTableSortingOptions = {
  state?: SortingState
  onChange?: OnChangeFn<SortingState>
  manual?: boolean
}

export type DataTablePersistenceOptions = {
  key: string
  search?: boolean
  columnVisibility?: boolean
  pageSize?: boolean
}

export type DataTableReorderResult<TData> = {
  orderedIds: string[]
  rows: TData[]
}

export type DataTableReorderOptions<TData> = {
  enabled?: boolean
  mode?: "full" | "page"
  onReorder?: (result: DataTableReorderResult<TData>) => void
}

export type DataTableToolbarOptions = {
  left?: React.ReactNode
  right?: React.ReactNode
  selectionContent?: React.ReactNode
}

export type DataTableProps<TData> = {
  data: TData[]
  columns: ColumnDef<TData>[]
  getRowId: (row: TData, index: number) => string
  search?: false | DataTableSearchOptions<TData>
  visibility?: false | DataTableVisibilityOptions
  selection?: false | DataTableSelectionOptions
  pagination?: false | DataTablePaginationOptions
  sorting?: false | DataTableSortingOptions
  reorder?: false | DataTableReorderOptions<TData>
  persistence?: DataTablePersistenceOptions | false
  toolbar?: DataTableToolbarOptions
  emptyState?: React.ReactNode
  noResultsState?: React.ReactNode
  loadingState?: React.ReactNode
  errorState?: React.ReactNode
  isLoading?: boolean
  error?: unknown
}

type DataTablePreferences = {
  search?: string
  columnVisibility?: VisibilityState
  pageSize?: number
}

function getColumnMeta<TData>(
  column: ColumnDef<TData>
): DataTableColumnMeta<TData> {
  return (column.meta ?? {}) as DataTableColumnMeta<TData>
}

function getColumnId<TData>(column: ColumnDef<TData>, index: number) {
  if (column.id) {
    return column.id
  }

  if ("accessorKey" in column && typeof column.accessorKey === "string") {
    return column.accessorKey
  }

  return `column-${index}`
}

function normalizeSearchValue(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase()
}

function defaultSearchCompare<TData>(
  query: string,
  values: unknown[],
  row: TData
) {
  void row
  const normalizedQuery = normalizeSearchValue(query)

  if (!normalizedQuery) {
    return true
  }

  return values.some((value) =>
    normalizeSearchValue(value).includes(normalizedQuery)
  )
}

function getFallbackSearchValue<TData>(row: TData, columnId: string) {
  if (row && typeof row === "object" && columnId in row) {
    return (row as Record<string, unknown>)[columnId]
  }

  return undefined
}

function readPreferences(key?: string): DataTablePreferences {
  if (!key || typeof window === "undefined") {
    return {}
  }

  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) {
      return {}
    }

    const parsed = JSON.parse(stored) as unknown
    if (!parsed || typeof parsed !== "object") {
      return {}
    }

    return parsed as DataTablePreferences
  } catch {
    return {}
  }
}

function writePreferences(key: string, preferences: DataTablePreferences) {
  try {
    window.localStorage.setItem(key, JSON.stringify(preferences))
  } catch {
  }
}

function useControlledState<TState>(
  controlledValue: TState | undefined,
  onControlledChange: OnChangeFn<TState> | undefined,
  defaultValue: TState
) {
  const [localValue, setLocalValue] = React.useState(defaultValue)
  const value = controlledValue ?? localValue

  const valueRef = React.useRef(value)
  valueRef.current = value

  const onChangeRef = React.useRef(onControlledChange)
  onChangeRef.current = onControlledChange

  const isControlled = controlledValue !== undefined

  const setValue = React.useCallback<OnChangeFn<TState>>(
    (updater) => {
      const nextValue =
        typeof updater === "function"
          ? (updater as (old: TState) => TState)(valueRef.current)
          : updater

      if (!isControlled) {
        setLocalValue(nextValue)
      }

      onChangeRef.current?.(nextValue)
    },
    [isControlled]
  )

  return [value, setValue] as const
}

function DragHandle({ id, disabled }: { id: UniqueIdentifier; disabled: boolean }) {
  const { attributes, listeners } = useSortable({
    id,
    disabled,
  })

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

function DraggableRow<TData>({
  row,
  disabled,
}: {
  row: Row<TData>
  disabled: boolean
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.id,
    disabled,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

function StaticRow<TData>({ row }: { row: Row<TData> }) {
  return (
    <TableRow data-state={row.getIsSelected() && "selected"}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

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
    useSensor(KeyboardSensor, {})
  )

  const columnIds = React.useMemo(
    () => columns.map((column, index) => getColumnId(column, index)),
    [columns]
  )

  const requiredColumnIds = React.useMemo(
    () =>
      new Set(
        columns
          .map((column, index) =>
            getColumnMeta(column).required ? columnIds[index] : null
          )
          .filter((columnId): columnId is string => Boolean(columnId))
      ),
    [columnIds, columns]
  )

  const [initialPreferences, setInitialPreferences] = React.useState<DataTablePreferences>({})
  const hasLoadedPreferences = React.useRef(false)

  React.useEffect(() => {
    if (persistence?.key && !hasLoadedPreferences.current) {
      hasLoadedPreferences.current = true
      setInitialPreferences(readPreferences(persistence.key))
    }
  }, [persistence?.key])

  const searchOptions = search === false ? undefined : search
  const isSearchEnabled = Boolean(searchOptions?.enabled)
  const initialSearchValue =
    persistence?.search && typeof initialPreferences.search === "string"
      ? initialPreferences.search
      : searchOptions?.defaultValue ?? ""
  const [localSearchValue, setLocalSearchValue] = React.useState(initialSearchValue)
  const searchValue = searchOptions?.value ?? localSearchValue

  const searchOnChangeRef = React.useRef(searchOptions?.onChange)
  searchOnChangeRef.current = searchOptions?.onChange
  const isSearchControlled = searchOptions?.value !== undefined

  const setSearchValue = React.useCallback(
    (value: string) => {
      if (!isSearchControlled) {
        setLocalSearchValue(value)
      }

      searchOnChangeRef.current?.(value)
    },
    [isSearchControlled]
  )

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
      })
    ) as VisibilityState
  }, [
    columnIds,
    initialPreferences.columnVisibility,
    persistence?.columnVisibility,
    requiredColumnIds,
  ])

  const visibilityOptions = visibility === false ? undefined : visibility
  const [columnVisibility, setColumnVisibility] = useControlledState(
    visibilityOptions?.state,
    visibilityOptions?.onChange,
    validatedInitialVisibility
  )

  const selectionOptions = selection === false ? undefined : selection
  const isSelectionEnabled = Boolean(selectionOptions?.enabled)
  const [rowSelection, setRowSelection] = useControlledState(
    selectionOptions?.state,
    selectionOptions?.onChange,
    {}
  )

  const persistedPageSize =
    persistence?.pageSize && typeof initialPreferences.pageSize === "number"
      ? initialPreferences.pageSize
      : undefined
  const paginationOptions = pagination === false ? undefined : pagination
  const isPaginationEnabled = pagination !== false
  const pageSizeOptions = paginationOptions?.pageSizeOptions ?? [10, 20, 30, 40, 50]
  const initialPageSize =
    persistedPageSize ?? paginationOptions?.initialPageSize ?? pageSizeOptions[0] ?? 10
  const [paginationState, setPaginationState] = useControlledState(
    paginationOptions?.state,
    paginationOptions?.onChange,
    {
      pageIndex: 0,
      pageSize: initialPageSize,
    }
  )

  const sortingOptions = sorting === false ? undefined : sorting
  const [sortingState, setSortingState] = useControlledState(
    sortingOptions?.state,
    sortingOptions?.onChange,
    []
  )

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

  const [localOrderIds, setLocalOrderIds] = React.useState<string[]>(rowIdentityMap)

  React.useEffect(() => {
    setLocalOrderIds((currentIds) => {
      const validIds = new Set(rowIdentityMap)
      const preservedIds = currentIds.filter((id) => validIds.has(id))
      const newIds = rowIdentityMap.filter((id) => !preservedIds.includes(id))

      return [...preservedIds, ...newIds]
    })
  }, [rowIdentityMap])

  React.useEffect(() => {
    if (!persistence?.key) {
      return
    }

    const nextPreferences = readPreferences(persistence.key)

    if (persistence.search) {
      nextPreferences.search = searchValue
    }

    if (persistence.columnVisibility) {
      nextPreferences.columnVisibility = Object.fromEntries(
        Object.entries(columnVisibility).filter(
          ([columnId]) => !requiredColumnIds.has(columnId)
        )
      )
    }

    if (persistence.pageSize) {
      nextPreferences.pageSize = paginationState.pageSize
    }

    writePreferences(persistence.key, nextPreferences)
  }, [
    columnVisibility,
    paginationState.pageSize,
    persistence?.key,
    persistence?.search,
    persistence?.columnVisibility,
    persistence?.pageSize,
    searchValue,
    // Note: requiredColumnIds removed from deps - it's derived from columns which is stable
  ])

  const orderedData = React.useMemo(() => {
    const byId = new Map(
      data.map((row, index) => [getRowId(row, index), row] as const)
    )

    return localOrderIds
      .map((id) => byId.get(id))
      .filter((row): row is TData => Boolean(row))
  }, [data, getRowId, localOrderIds])

  const searchableColumns = React.useMemo(
    () =>
      columns
        .map((column, index) => ({
          id: columnIds[index],
          meta: getColumnMeta(column),
        }))
        .filter(({ meta }) => meta.searchable),
    [columnIds, columns]
  )

  const filteredData = React.useMemo(() => {
    if (!isSearchEnabled || !searchValue.trim()) {
      return orderedData
    }

    return orderedData.filter((row) => {
      const values =
        searchOptions?.getSearchValues?.(row) ??
        searchableColumns.map(({ id, meta }) =>
          meta.getSearchValue ? meta.getSearchValue(row) : getFallbackSearchValue(row, id)
        )

      const compare = searchOptions?.compare ?? defaultSearchCompare
      return compare(searchValue, values, row)
    })
  }, [
    isSearchEnabled,
    orderedData,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    searchOptions?.getSearchValues,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    searchOptions?.compare,
    searchValue,
    searchableColumns,
  ])

  const reorderOptions = reorder === false ? undefined : reorder
  const isReorderEnabled = Boolean(reorderOptions?.enabled)
  const isSearchActive = isSearchEnabled && Boolean(searchValue.trim())
  const isSortingActive = sortingState.length > 0
  const hasAmbiguousPagination =
    isPaginationEnabled &&
    reorderOptions?.mode !== "page" &&
    filteredData.length > paginationState.pageSize
  const canReorder =
    isReorderEnabled &&
    !isSearchActive &&
    !isSortingActive &&
    !hasAmbiguousPagination

  const controlColumns = React.useMemo<ColumnDef<TData>[]>(() => {
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
                table.getIsSomePageRowsSelected() &&
                !table.getIsAllPageRowsSelected()
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(Boolean(value))
              }
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

  const tableColumns = React.useMemo(
    () => [...controlColumns, ...columns],
    [columns, controlColumns]
  )

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
      if (parent) {
        return `${parent.id}.${getRowId(row, _index)}`
      }

      const sourceIndex = data.indexOf(row)
      return getRowId(row, sourceIndex >= 0 ? sourceIndex : _index)
    },
    enableRowSelection: isSelectionEnabled,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSortingState,
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility((current) => {
        const nextValue =
          typeof updater === "function" ? updater(current) : updater

        return Object.fromEntries(
          Object.entries(nextValue).filter(
            ([columnId]) => !requiredColumnIds.has(columnId)
          )
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
      isPaginationEnabled && !paginationOptions?.manual
        ? getPaginationRowModel()
        : undefined,
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!canReorder || !active || !over || active.id === over.id) {
      return
    }

    setLocalOrderIds((currentIds) => {
      const oldIndex = currentIds.indexOf(String(active.id))
      const newIndex = currentIds.indexOf(String(over.id))

      if (oldIndex < 0 || newIndex < 0) {
        return currentIds
      }

      const nextIds = arrayMove(currentIds, oldIndex, newIndex)
      
      // Call onReorder after state update completes
      queueMicrotask(() => {
        if (reorderOptions) {
          const rowsById = new Map(
            data.map((row, index) => [getRowId(row, index), row] as const)
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

  const visibleRows = table.getRowModel().rows
  const shouldShowEmpty = !isLoading && !error && data.length === 0
  const shouldShowNoResults =
    !isLoading && !error && data.length > 0 && visibleRows.length === 0
  const visibleColumnCount = Math.max(table.getVisibleLeafColumns().length, 1)
  const visibilityEnabled = visibility !== false && Boolean(visibilityOptions?.enabled)
  const hideableColumns = table
    .getAllColumns()
    .filter((column) => {
      const meta = getColumnMeta(column.columnDef)
      return (
        column.getCanHide() &&
        !requiredColumnIds.has(column.id) &&
        !meta.hideFromVisibilityMenu &&
        !column.id.startsWith("__")
      )
    })

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {toolbar?.left}
          {isSearchEnabled && (
            <div className="w-full sm:max-w-xs">
              <Label htmlFor={`${sortableId}-search`} className="sr-only">
                Szukaj w tabeli
              </Label>
              <Input
                id={`${sortableId}-search`}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={searchOptions?.placeholder ?? "Szukaj..."}
                className="h-9"
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar?.selectionContent}
          {visibilityEnabled && hideableColumns.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                <Columns3Icon data-icon="inline-start" />
                Kolumny
                <ChevronDownIcon data-icon="inline-end" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {hideableColumns.map((column) => {
                  const meta = getColumnMeta(column.columnDef)
                  const label = meta.label ?? column.id

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(Boolean(value))
                      }
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {toolbar?.right}
        </div>
      </div>

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
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
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
                {!isLoading &&
                  !error &&
                  visibleRows.length > 0 &&
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

      {isSelectionEnabled || isPaginationEnabled ? (
        <div className="flex flex-col gap-3 px-1 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-muted-foreground">
            {isSelectionEnabled
              ? `${table.getFilteredSelectedRowModel().rows.length} z ${table.getFilteredRowModel().rows.length} zaznaczonych wierszy.`
              : null}
          </div>
          {isPaginationEnabled && (
            <div className="flex flex-wrap items-center justify-end gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor={`${sortableId}-rows-per-page`} className="text-sm font-medium">
                  Wierszy na stronę
                </Label>
                <Select
                  defaultValue={`${table.getState().pagination.pageSize}`}
                >
                  <SelectTrigger
                    size="sm"
                    className="w-20"
                    id={`${sortableId}-rows-per-page`}
                  >
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectGroup>
                      {pageSizeOptions.map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-24 text-center text-sm font-medium">
                Strona {table.getState().pagination.pageIndex + 1} z{" "}
                {Math.max(table.getPageCount(), 1)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="hidden size-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Przejdź do pierwszej strony</span>
                  <ChevronsLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Przejdź do poprzedniej strony</span>
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Przejdź do następnej strony</span>
                  <ChevronRightIcon />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Przejdź do ostatniej strony</span>
                  <ChevronsRightIcon />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
