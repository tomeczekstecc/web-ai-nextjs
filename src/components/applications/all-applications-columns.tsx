"use client"

import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { resolveIcon } from "@/lib/icons"

const EllipsisVerticalIcon = resolveIcon("EllipsisVertical");
import { useTransition } from "react"

import type { DataTableColumnMeta } from "@/components/data-table"
import { SortableHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RelativeTime } from "@/components/ui/relative-time"
import { formatDate } from "@/lib/format/date"
import { usePrincipal } from "@/hooks/use-principal"
import type { Application, ApplicationStatus } from "@/lib/api/domains/applications/contract"
import {
  submitApplication,
  archiveApplication,
} from "@/lib/api/domains/applications/actions"

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft:     "Szkic",
  submitted: "Złożony",
  archived:  "Archiwum",
}

const STATUS_VARIANTS: Record<ApplicationStatus, "secondary" | "default" | "outline"> = {
  draft:     "secondary",
  submitted: "default",
  archived:  "outline",
}

function ActionsCell({ row }: { row: { original: Application } }) {
  const { hasPermission, hasRole } = usePrincipal()
  const [isPending, startTransition] = useTransition()

  const canWrite = hasPermission("applications:write")
  const isAdmin  = hasRole("Admin")
  const app      = row.original

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="flex size-8 text-muted-foreground data-open:bg-muted"
            size="icon"
            disabled={isPending}
            aria-label="Otwórz menu"
          />
        }
      >
        <EllipsisVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem render={<Link href={`/applications/${app.id}`} />}>
          Szczegóły
        </DropdownMenuItem>

        {/* LAYER 4 — hidden gdy brak write, disabled gdy status nie pozwala */}
        {canWrite && app.status === "draft" && (
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                await submitApplication(app.id)
              })
            }
          >
            Złóż wniosek
          </DropdownMenuItem>
        )}

        {/* LAYER 4 — hidden dla nie-Adminów */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                startTransition(async () => {
                  await archiveApplication(app.id)
                })
              }
            >
              Archiwizuj
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const allApplicationsColumns: ColumnDef<Application>[] = [
  {
    accessorKey: "label",
    header: ({ column }) => <SortableHeader column={column} label="Wniosek" />,
    cell: ({ row }) => (
      <Link
        href={`/applications/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.label}
      </Link>
    ),
    meta: {
      label: "Wniosek",
      required: true,
      searchable: true,
      getSearchValue: (row) => row.label,
    } satisfies DataTableColumnMeta<Application>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={STATUS_VARIANTS[status]}>
          {STATUS_LABELS[status]}
        </Badge>
      )
    },
    meta: {
      label: "Status",
      filterable: true,
      filterLabel: (v) => STATUS_LABELS[v as ApplicationStatus] ?? v,
    } satisfies DataTableColumnMeta<Application>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} label="Utworzono" />,
    sortingFn: (a, b) =>
      new Date(a.original.createdAt).getTime() -
      new Date(b.original.createdAt).getTime(),
    cell: ({ row }) => formatDate(row.original.createdAt),
    meta: {
      label: "Utworzono",
    } satisfies DataTableColumnMeta<Application>,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <SortableHeader column={column} label="Zaktualizowano" />,
    sortingFn: (a, b) =>
      new Date(a.original.updatedAt).getTime() -
      new Date(b.original.updatedAt).getTime(),
    cell: ({ row }) => (
      <RelativeTime
        value={row.original.updatedAt}
        className="text-muted-foreground"
      />
    ),
    meta: {
      label: "Zaktualizowano",
    } satisfies DataTableColumnMeta<Application>,
  },
  {
    id: "actions",
    header: "Akcje",
    cell: ({ row }) => <ActionsCell row={row} />,
    enableHiding: false,
    enableSorting: false,
    meta: {
      label: "Akcje",
      required: true,
      hideFromVisibilityMenu: true,
    } satisfies DataTableColumnMeta<Application>,
  },
]
