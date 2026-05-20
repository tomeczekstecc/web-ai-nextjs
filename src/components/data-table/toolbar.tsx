"use client"

import {
  ChevronDownIcon,
  Columns3Icon,
} from "lucide-react"
import type { Column } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getColumnMeta } from "@/lib/data-table/utils"
import type { DataTableToolbarOptions } from "@/lib/data-table/types"

interface DataTableToolbarProps<TData> {
  sortableId: string
  isSearchEnabled: boolean
  searchValue: string
  setSearchValue: (value: string) => void
  searchPlaceholder: string
  toolbar: DataTableToolbarOptions | undefined
  visibilityEnabled: boolean
  hideableColumns: Column<TData>[]
}

export function DataTableToolbar<TData>({
  sortableId,
  isSearchEnabled,
  searchValue,
  setSearchValue,
  searchPlaceholder,
  toolbar,
  visibilityEnabled,
  hideableColumns,
}: DataTableToolbarProps<TData>) {
  return (
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
              placeholder={searchPlaceholder}
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
                    onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
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
  )
}
