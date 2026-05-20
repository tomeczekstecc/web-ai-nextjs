"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"
import type { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTableFooterProps<TData> {
  sortableId: string
  isSelectionEnabled: boolean
  isPaginationEnabled: boolean
  table: Table<TData>
  pageSizeOptions: number[]
}

export function DataTableFooter<TData>({
  sortableId,
  isSelectionEnabled,
  isPaginationEnabled,
  table,
  pageSizeOptions,
}: DataTableFooterProps<TData>) {
  if (!isSelectionEnabled && !isPaginationEnabled) return null

  return (
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
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
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
  )
}
