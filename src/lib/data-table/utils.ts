import type { ColumnDef, FilterFn, Row } from "@tanstack/react-table"
import type { DataTableColumnMeta, DataTablePreferences } from "./types"

export function getColumnMeta<TData>(column: ColumnDef<TData>): DataTableColumnMeta<TData> {
  return (column.meta ?? {}) as DataTableColumnMeta<TData>
}

export function getColumnId<TData>(column: ColumnDef<TData>, index: number) {
  if (column.id) return column.id
  if ("accessorKey" in column && typeof column.accessorKey === "string") return column.accessorKey
  return `column-${index}`
}

export function normalizeSearchValue(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase()
}

export function defaultSearchCompare<TData>(query: string, values: unknown[], row: TData) {
  void row
  const normalizedQuery = normalizeSearchValue(query)
  if (!normalizedQuery) return true
  return values.some((value) => normalizeSearchValue(value).includes(normalizedQuery))
}

export function getFallbackSearchValue<TData>(row: TData, columnId: string) {
  if (row && typeof row === "object" && columnId in row) {
    return (row as Record<string, unknown>)[columnId]
  }
  return undefined
}

export function readPreferences(key?: string): DataTablePreferences {
  if (!key || typeof window === "undefined") return {}
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return {}
    const parsed = JSON.parse(stored) as unknown
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as DataTablePreferences
  } catch {
    return {}
  }
}

export function writePreferences(key: string, preferences: DataTablePreferences) {
  try {
    window.localStorage.setItem(key, JSON.stringify(preferences))
  } catch {}
}

export const multiSelectFilterFnMeta = (<TData>(
  row: Row<TData>,
  columnId: string,
  filterValues: string[],
): boolean => {
  if (!filterValues?.length) return true
  return filterValues.includes(row.getValue(columnId) as string)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as FilterFn<any>
multiSelectFilterFnMeta.autoRemove = (val: string[]) => !val?.length
