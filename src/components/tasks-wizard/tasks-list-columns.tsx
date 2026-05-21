"use client"

import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

import type { DataTableColumnMeta } from "@/components/data-table"
import { SortableHeader } from "@/components/data-table"
import { multiSelectFilterFnMeta } from "@/lib/data-table/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TaskListItem, TaskPriority } from "@/lib/api/domains/tasks/contract"
import { EllipsisVerticalIcon } from "lucide-react"

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low:    "Niski",
  normal: "Normalny",
  high:   "Wysoki",
}

export const tasksListColumns: ColumnDef<TaskListItem>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column} label="Tytuł" />,
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title}</span>
    ),
    meta: {
      label: "Tytuł",
      required: true,
      searchable: true,
      getSearchValue: (row) => row.title,
    } satisfies DataTableColumnMeta<TaskListItem>,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <SortableHeader column={column} label="Typ" />,
    filterFn: multiSelectFilterFnMeta,
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground">
        {row.original.type}
      </Badge>
    ),
    meta: {
      label: "Typ",
      searchable: true,
      filterable: true,
      getSearchValue: (row) => row.type,
    } satisfies DataTableColumnMeta<TaskListItem>,
  },
  {
    accessorKey: "priority",
    header: ({ column }) => <SortableHeader column={column} label="Priorytet" />,
    filterFn: multiSelectFilterFnMeta,
    sortingFn: (rowA, rowB) => {
      const order: Record<TaskPriority, number> = { low: 0, normal: 1, high: 2 }
      return (order[rowA.original.priority] ?? 0) - (order[rowB.original.priority] ?? 0)
    },
    cell: ({ row }) => (
      <Badge
        variant={row.original.priority === "high" ? "default" : "outline"}
        className="text-muted-foreground"
      >
        {PRIORITY_LABELS[row.original.priority]}
      </Badge>
    ),
    meta: {
      label: "Priorytet",
      filterable: true,
      filterLabel: (v) => PRIORITY_LABELS[v as TaskPriority] ?? v,
    } satisfies DataTableColumnMeta<TaskListItem>,
  },
  {
    accessorKey: "deadline",
    header: ({ column }) => <SortableHeader column={column} label="Termin" />,
    cell: ({ row }) => row.original.deadline,
    meta: {
      label: "Termin",
    } satisfies DataTableColumnMeta<TaskListItem>,
  },
  {
    id: "actions",
    header: "Akcje",
    cell: ({ row }) => (
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
          <DropdownMenuItem render={<Link href={`/wizard-demo/${row.original.id}`} />}>
            Edytuj
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/wizard-demo/${row.original.id}/view`} />}>
            Podgląd
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            Usuń
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableHiding: false,
    enableSorting: false,
    meta: {
      label: "Akcje",
      required: true,
      hideFromVisibilityMenu: true,
    } satisfies DataTableColumnMeta<TaskListItem>,
  },
]
