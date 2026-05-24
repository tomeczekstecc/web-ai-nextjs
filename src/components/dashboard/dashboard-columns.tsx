"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { resolveIcon } from "@/lib/icons"

const CircleCheckIcon = resolveIcon("CircleCheck");
const LoaderIcon = resolveIcon("Loader");
import { toast } from "@/components/toast"

import { type DataTableColumnMeta } from "@/components/data-table"
import { multiSelectFilterFnMeta } from "@/lib/data-table/utils"
import { formatDate } from "@/lib/format/date"
import { Badge } from "@/components/ui/badge"
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
import { SortableHeader } from "@/components/data-table"
import { DashboardRowActions } from "./dashboard-row-actions"
import type { DashboardReviewItem } from "@/lib/api/domains/dashboard/contract"

export const dashboardColumns: ColumnDef<DashboardReviewItem>[] = [
  {
    accessorKey: "header",
    header: ({ column }) => <SortableHeader column={column} label="Konkurs" />,
    cell: ({ row }) => (
      <span className="font-medium">{row.original.header}</span>
    ),
    enableHiding: false,
    meta: {
      label: "Konkurs",
      required: true,
      searchable: true,
      getSearchValue: (row) => row.header,
    } satisfies DataTableColumnMeta<DashboardReviewItem>,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <SortableHeader column={column} label="Kategoria" />,
    cell: ({ row }) => (
      <div className="w-36">
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {row.original.type}
        </Badge>
      </div>
    ),
    meta: {
      label: "Kategoria",
      searchable: true,
      filterable: true,
      getSearchValue: (row) => row.type,
    } satisfies DataTableColumnMeta<DashboardReviewItem>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
    filterFn: multiSelectFilterFnMeta,
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {row.original.status === "Przyznany" ? (
          <CircleCheckIcon className="fill-green-500 dark:fill-green-400" />
        ) : (
          <LoaderIcon />
        )}
        {row.original.status}
      </Badge>
    ),
    meta: {
      label: "Status",
      searchable: true,
      filterable: true,
      getSearchValue: (row) => row.status,
    } satisfies DataTableColumnMeta<DashboardReviewItem>,
  },
  {
    accessorKey: "target",
    header: ({ column }) => (
      <div className="flex justify-end">
        <SortableHeader column={column} label="Kwota (PLN)" className="ml-0" />
      </div>
    ),
    cell: ({ row }) => (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Zapisywanie ${row.original.header}`,
            success: "Gotowe",
            error: "Błąd",
          })
        }}
      >
        <Label htmlFor={`${row.original.id}-target`} className="sr-only">
          Kwota (PLN)
        </Label>
        <Input
          className="h-8 w-28 border-transparent bg-transparent text-right shadow-none hover:bg-input/30 focus-visible:border focus-visible:bg-background dark:bg-transparent dark:hover:bg-input/30 dark:focus-visible:bg-input/30"
          defaultValue={row.original.target}
          id={`${row.original.id}-target`}
        />
      </form>
    ),
    meta: {
      label: "Kwota (PLN)",
    } satisfies DataTableColumnMeta<DashboardReviewItem>,
  },
  {
    accessorKey: "limit",
    header: ({ column }) => (
      <div className="flex justify-end">
        <SortableHeader column={column} label="Termin" className="ml-0" />
      </div>
    ),
    cell: ({ row }) => (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Zapisywanie ${row.original.header}`,
            success: "Gotowe",
            error: "Błąd",
          })
        }}
      >
        <Label htmlFor={`${row.original.id}-limit`} className="sr-only">
          Termin
        </Label>
        <Input
          className="h-8 w-28 border-transparent bg-transparent text-right shadow-none hover:bg-input/30 focus-visible:border focus-visible:bg-background dark:bg-transparent dark:hover:bg-input/30 dark:focus-visible:bg-input/30"
          defaultValue={formatDate(row.original.limit)}
          id={`${row.original.id}-limit`}
        />
      </form>
    ),
    meta: {
      label: "Termin",
    } satisfies DataTableColumnMeta<DashboardReviewItem>,
  },
  {
    accessorKey: "reviewer",
    header: ({ column }) => <SortableHeader column={column} label="Opiekun" />,
    filterFn: multiSelectFilterFnMeta,
    cell: ({ row }) => {
      const isAssigned = row.original.reviewer !== "Assign reviewer"

      if (isAssigned) {
        return row.original.reviewer
      }

      return (
        <>
          <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
            Opiekun
          </Label>
          <Select>
            <SelectTrigger
              className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              id={`${row.original.id}-reviewer`}
            >
              <SelectValue placeholder="Przypisz opiekuna" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectItem value="Anna Kowalska">Anna Kowalska</SelectItem>
                <SelectItem value="Marek Nowak">Marek Nowak</SelectItem>
                <SelectItem value="Katarzyna Wiśniewska">Katarzyna Wiśniewska</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      )
    },
    meta: {
      label: "Opiekun",
      searchable: true,
      filterable: true,
      getSearchValue: (row) => row.reviewer,
    } satisfies DataTableColumnMeta<DashboardReviewItem>,
  },
  {
    id: "actions",
    header: "Akcje",
    cell: ({ row }) => <DashboardRowActions item={row.original} />,
    enableHiding: false,
    enableSorting: false,
    meta: {
      label: "Akcje",
      required: true,
      hideFromVisibilityMenu: true,
    } satisfies DataTableColumnMeta<DashboardReviewItem>,
  },
]
