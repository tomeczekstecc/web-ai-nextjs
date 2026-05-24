"use client"

import type { Column } from "@tanstack/react-table"

import { resolveIcon } from "@/lib/icons"

const ChevronDownIcon = resolveIcon("ChevronDown");
const Columns3Icon = resolveIcon("Columns3");
const FileSpreadsheetIcon = resolveIcon("FileSpreadsheet");
const XIcon = resolveIcon("X");

import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { ColumnFilterPopover } from "./column-filter-popover"

interface DataTableToolbarProps<TData> {
  sortableId: string
  isSearchEnabled: boolean
  searchValue: string
  setSearchValue: (value: string) => void
  searchPlaceholder: string
  toolbar: DataTableToolbarOptions | undefined
  visibilityEnabled: boolean
  hideableColumns: Column<TData>[]
  filterableColumns: Column<TData>[]
  hasActiveFilters: boolean
  onResetFilters: () => void
  isExportEnabled: boolean
  isExporting: boolean
  onExport: () => void
  exportLabel: string
  getClipboardText?: () => string
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
  filterableColumns,
  hasActiveFilters,
  onResetFilters,
  isExportEnabled,
  isExporting,
  onExport,
  exportLabel,
  getClipboardText,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex flex-col gap-2">
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
          {filterableColumns.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filterableColumns.map((column) => (
                <ColumnFilterPopover key={column.id} column={column} />
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar?.selectionContent}
          {isExportEnabled && (
            <>
              {getClipboardText && (
                <CopyButton
                  variant="outline"
                  size="icon-sm"
                  value={getClipboardText()}
                  label="Kopiuj dane do schowka"
                  copiedLabel="Skopiowano"
                  failedLabel="Nie udało się skopiować"
                />
              )}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={onExport}
                      disabled={isExporting}
                      aria-label={exportLabel}
                    />
                  }
                >
                  <FileSpreadsheetIcon />
                </TooltipTrigger>
                <TooltipContent>{exportLabel}</TooltipContent>
              </Tooltip>
            </>
          )}
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

      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Aktywne filtry</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground"
            onClick={onResetFilters}
          >
            <XIcon className="mr-1 size-3.5" />
            Wyczyść wszystkie
          </Button>
        </div>
      )}
    </div>
  )
}
