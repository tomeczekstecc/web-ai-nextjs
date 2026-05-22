'use client'

import type { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { SortableHeader } from '@/components/data-table'
import type { DataTableColumnMeta } from '@/components/data-table'
import type { ReportListItem, ReportStatus } from '@/lib/api/domains/reports/contract'
import { ReportsRowActions } from './reports-row-actions'

const STATUS_LABELS: Record<ReportStatus, string> = {
  projekt: 'Projekt',
  aktywny: 'Aktywny',
  archiwum: 'Archiwum',
}

const STATUS_VARIANTS: Record<ReportStatus, 'outline' | 'default' | 'secondary'> = {
  projekt: 'outline',
  aktywny: 'default',
  archiwum: 'secondary',
}

type BuildOptions = {
  onGenerate: (report: ReportListItem) => void
}

export function buildReportsColumns({ onGenerate }: BuildOptions): ColumnDef<ReportListItem>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column} label="Nazwa" />,
      cell: ({ row }) => (
        <Link
          href={`/reports/${row.original.id}/view`}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      ),
      meta: {
        label: 'Nazwa',
        required: true,
        searchable: true,
        getSearchValue: (row) => row.name,
      } satisfies DataTableColumnMeta<ReportListItem>,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <SortableHeader column={column} label="Status" />,
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status]}>
          {STATUS_LABELS[row.original.status]}
        </Badge>
      ),
      meta: {
        label: 'Status',
      } satisfies DataTableColumnMeta<ReportListItem>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ReportsRowActions report={row.original} onGenerate={onGenerate} />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: {
        label: 'Akcje',
        required: true,
        hideFromVisibilityMenu: true,
      } satisfies DataTableColumnMeta<ReportListItem>,
    },
  ]
}
