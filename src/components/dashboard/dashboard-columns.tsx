"use client"

import type { ColumnDef } from "@tanstack/react-table"
import {
  CircleCheckIcon,
  EllipsisVerticalIcon,
  LoaderIcon,
} from "lucide-react"
import { toast } from "sonner"

import { type DataTableColumnMeta } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { TableCellViewer } from "./dashboard-cell-viewer"

export type DashboardTableRow = {
  id: number
  header: string
  type: string
  status: string
  target: string
  limit: string
  reviewer: string
}

export const dashboardColumns: ColumnDef<DashboardTableRow>[] = [
  {
    accessorKey: "header",
    header: "Konkurs",
    cell: ({ row }) => <TableCellViewer item={row.original} />,
    enableHiding: false,
    meta: {
      label: "Konkurs",
      required: true,
      searchable: true,
      getSearchValue: (row) => row.header,
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    accessorKey: "type",
    header: "Kategoria",
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
      getSearchValue: (row) => row.type,
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    accessorKey: "status",
    header: "Status",
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
      getSearchValue: (row) => row.status,
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    accessorKey: "target",
    header: () => <div className="w-full text-right">Kwota (PLN)</div>,
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
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    accessorKey: "limit",
    header: () => <div className="w-full text-right">Termin</div>,
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
          defaultValue={row.original.limit}
          id={`${row.original.id}-limit`}
        />
      </form>
    ),
    meta: {
      label: "Termin",
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    accessorKey: "reviewer",
    header: "Opiekun",
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
      getSearchValue: (row) => row.reviewer,
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="flex size-8 text-muted-foreground data-open:bg-muted"
              size="icon"
            />
          }
        >
          <EllipsisVerticalIcon />
          <span className="sr-only">Otwórz menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem>Edytuj</DropdownMenuItem>
          <DropdownMenuItem>Utwórz kopię</DropdownMenuItem>
          <DropdownMenuItem>Dodaj do ulubionych</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Usuń</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableHiding: false,
    enableSorting: false,
    meta: {
      label: "Akcje",
      required: true,
      hideFromVisibilityMenu: true,
    } satisfies DataTableColumnMeta<DashboardTableRow>,
  },
]
