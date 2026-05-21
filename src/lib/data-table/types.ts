import type { ColumnDef, ColumnFiltersState, OnChangeFn, PaginationState, RowSelectionState, SortingState, VisibilityState } from "@tanstack/react-table"

export type DataTableColumnMeta<TData> = {
  label?: string
  required?: boolean
  searchable?: boolean
  filterable?: boolean
  filterLabel?: (value: string) => string
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
  key?: string          // optional — auto-derived from pathname when absent
  search?: boolean
  columnVisibility?: boolean
  pageSize?: boolean
  sorting?: boolean
  columnFilters?: boolean
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

export type DataTablePreferences = {
  search?: string
  columnVisibility?: VisibilityState
  pageSize?: number
  sorting?: SortingState
  columnFilters?: ColumnFiltersState
}
