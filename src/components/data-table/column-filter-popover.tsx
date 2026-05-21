"use client"

import type { Column } from "@tanstack/react-table"
import { CheckIcon, ListFilterIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { getColumnMeta } from "@/lib/data-table/utils"
import { cn } from "@/lib/utils"

type ColumnFilterPopoverProps<TData> = {
  column: Column<TData, unknown>
}

export function ColumnFilterPopover<TData>({ column }: ColumnFilterPopoverProps<TData>) {
  const meta = getColumnMeta(column.columnDef)
  const label = meta.label ?? column.id

  const facetedValues = column.getFacetedUniqueValues()
  const options = Array.from(facetedValues.keys())
    .filter((v) => v !== null && v !== undefined && v !== "")
    .sort()

  const selectedValues = new Set<string>(
    (column.getFilterValue() as string[] | undefined) ?? [],
  )
  const isFiltered = selectedValues.size > 0

  function toggle(value: string) {
    const next = new Set(selectedValues)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    column.setFilterValue(next.size > 0 ? Array.from(next) : undefined)
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn("h-9 border-dashed", isFiltered && "border-solid border-primary/50")}
          />
        }
      >
        <ListFilterIcon data-icon="inline-start" />
        {label}
        {isFiltered && (
          <>
            <Separator orientation="vertical" className="mx-0.5 h-4" />
            {selectedValues.size > 2 ? (
              <Badge variant="secondary" className="rounded px-1.5 font-normal">
                {selectedValues.size}
              </Badge>
            ) : (
              Array.from(selectedValues).map((v) => (
                <Badge key={v} variant="secondary" className="max-w-24 truncate rounded px-1.5 font-normal">
                  {v}
                </Badge>
              ))
            )}
          </>
        )}
      </PopoverTrigger>

      <PopoverContent className="w-52 p-0" align="start">
        <div className="flex flex-col">
          {options.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              Brak opcji
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((option) => {
                const isSelected = selectedValues.has(option)
                const count = facetedValues.get(option) ?? 0
                return (
                  <button
                    key={option}
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => toggle(option)}
                  >
                    <div
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border opacity-50",
                      )}
                    >
                      {isSelected && <CheckIcon className="size-3" />}
                    </div>
                    <span className="truncate">{meta.filterLabel ? meta.filterLabel(option) : option}</span>
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          {isFiltered && (
            <>
              <Separator />
              <button
                type="button"
                className="px-3 py-2 text-center text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => column.setFilterValue(undefined)}
              >
                Wyczyść filtr
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
