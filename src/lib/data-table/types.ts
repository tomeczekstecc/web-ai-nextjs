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
  /**
   * When true, the table will not filter rows locally based on the search value.
   * The current value is still emitted via `onChange` so the consumer can fetch
   * pre-filtered data from the server.
   */
  manual?: boolean
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
  /** Total number of pages on the server. Used when `manual` is true. */
  pageCount?: number
  /**
   * Total number of rows on the server (across all pages). TanStack uses this
   * to derive `pageCount` if `pageCount` is not provided, and exposes it via
   * `table.getRowCount()` for footer totals.
   */
  rowCount?: number
  manual?: boolean
}

export type DataTableSortingOptions = {
  state?: SortingState
  onChange?: OnChangeFn<SortingState>
  manual?: boolean
}

export type DataTableColumnFiltersOptions = {
  state?: ColumnFiltersState
  onChange?: OnChangeFn<ColumnFiltersState>
  /**
   * When true, client-side filtering is disabled. Filter changes are emitted
   * via `onChange`; the consumer is expected to fetch pre-filtered data.
   */
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

export type DataTableExportColumn = {
  header: string
  key: string
  width?: number
}

export type DataTableExportPayload = {
  filename: string
  sheetName: string
  columns: DataTableExportColumn[]
  rows: Record<string, unknown>[]
}

export type DataTableExportOptions<TData> = {
  /** Defaults to true. */
  enabled?: boolean
  /** Static filename or factory; `.xlsx` is appended if missing. */
  filename?: string | (() => string)
  /** Excel sheet name (max 31 chars). Defaults to "Sheet1". */
  sheetName?: string
  /** Toolbar button label. */
  label?: string
  /**
   * Override columns. If omitted, derived from currently visible columns
   * (skipping control columns), using `meta.label ?? column.id` as header.
   */
  columns?: DataTableExportColumn[]
  /**
   * Cell value resolver. Defaults to the column's accessor value via
   * `row.getValue(columnId)`. Use this to flatten JSX cells back to data.
   */
  getCellValue?: (row: TData, columnId: string) => unknown
  /** Hook to customise the full payload before it is sent. */
  transformPayload?: (payload: DataTableExportPayload) => DataTableExportPayload
  /** Endpoint override. Defaults to `/api/internal/excel-export`. */
  endpoint?: string
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
  columnFilters?: false | DataTableColumnFiltersOptions
  reorder?: false | DataTableReorderOptions<TData>
  export?: false | DataTableExportOptions<TData>
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
