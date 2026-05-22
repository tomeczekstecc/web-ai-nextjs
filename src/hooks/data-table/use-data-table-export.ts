"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"

import { getColumnMeta } from "@/lib/data-table/utils"
import type {
  DataTableExportColumn,
  DataTableExportOptions,
  DataTableExportPayload,
} from "@/lib/data-table/types"

const DEFAULT_ENDPOINT = "/api/internal/excel-export"

type UseDataTableExportArgs<TData> = {
  table: Table<TData>
  exportOptions: DataTableExportOptions<TData> | undefined
  isExportEnabled: boolean
}

export function useDataTableExport<TData>({
  table,
  exportOptions,
  isExportEnabled,
}: UseDataTableExportArgs<TData>) {
  const [isExporting, setIsExporting] = React.useState(false)

  const buildPayload = React.useCallback((): DataTableExportPayload => {
    // Visible leaf columns minus control columns (drag/select prefixed `__`).
    const visibleColumns = table
      .getVisibleLeafColumns()
      .filter((column) => !column.id.startsWith("__"))

    const columns: DataTableExportColumn[] =
      exportOptions?.columns ??
      visibleColumns.map((column) => {
        const meta = getColumnMeta(column.columnDef)
        return {
          header: String(meta.label ?? column.id),
          key: column.id,
        }
      })

    // Sorted + filtered, ignoring pagination — i.e. what the user has narrowed
    // down to in the UI, in current sort order.
    const sortedRows = table.getSortedRowModel().rows

    const resolveCell = exportOptions?.getCellValue
    const rows: Record<string, unknown>[] = sortedRows.map((row) => {
      const out: Record<string, unknown> = {}
      for (const column of columns) {
        const value = resolveCell
          ? resolveCell(row.original, column.key)
          : safeGetValue(row, column.key)
        out[column.key] = value
      }
      return out
    })

    const filename = resolveFilename(exportOptions?.filename)
    const sheetName = (exportOptions?.sheetName ?? "Sheet1").slice(0, 31)

    const payload: DataTableExportPayload = { filename, sheetName, columns, rows }
    return exportOptions?.transformPayload?.(payload) ?? payload
  }, [exportOptions, table])

  const triggerExport = React.useCallback(async () => {
    if (!isExportEnabled || isExporting) return

    setIsExporting(true)
    try {
      const payload = buildPayload()
      const endpoint = exportOptions?.endpoint ?? DEFAULT_ENDPOINT

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`)
      }

      const blob = await response.blob()
      downloadBlob(blob, payload.filename)
    } finally {
      setIsExporting(false)
    }
  }, [buildPayload, exportOptions?.endpoint, isExportEnabled, isExporting])

  const getClipboardText = React.useCallback((): string => {
    return payloadToTsv(buildPayload())
  }, [buildPayload])

  return { triggerExport, isExporting, getClipboardText }
}

function payloadToTsv(payload: DataTableExportPayload): string {
  const header = payload.columns.map((column) => sanitizeTsvCell(column.header))
  const body = payload.rows.map((row) =>
    payload.columns
      .map((column) => sanitizeTsvCell(formatCellForClipboard(row[column.key])))
      .join("\t"),
  )
  return [header.join("\t"), ...body].join("\n")
}

function formatCellForClipboard(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function sanitizeTsvCell(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ")
}

function safeGetValue<TData>(
  row: { getValue: (id: string) => unknown; original: TData },
  columnId: string,
): unknown {
  try {
    return row.getValue(columnId)
  } catch {
    // Display-only columns (no accessor) — fall back to a property lookup so
    // the export still has *something* sensible for that key.
    const original = row.original as Record<string, unknown> | null | undefined
    return original?.[columnId] ?? null
  }
}

function resolveFilename(filename: DataTableExportOptions<unknown>["filename"]): string {
  const raw =
    typeof filename === "function"
      ? filename()
      : (filename ?? `export-${new Date().toISOString().slice(0, 10)}`)
  return raw.endsWith(".xlsx") ? raw : `${raw}.xlsx`
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
