'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { DataTable, DataTableSkeleton } from '@/components/data-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { reportListOptions } from '@/lib/api/domains/reports/query-options'
import type { ReportListItem } from '@/lib/api/domains/reports/contract'
import { buildReportsColumns } from './reports-columns'
import { GenerationDrawer } from './generation-drawer'

export function ReportsTable() {
  const [generatingReport, setGeneratingReport] = useState<ReportListItem | null>(null)

  const { data, isLoading, isError, refetch } = useQuery(
    reportListOptions({ page: 1, pageSize: 50 }),
  )

  const columns = buildReportsColumns({ onGenerate: setGeneratingReport })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <DataTableSkeleton rows={5} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-3 px-4 py-4 lg:px-6">
        <Alert variant="destructive">
          <AlertDescription>Nie udało się załadować raportów.</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => void refetch()}
        >
          Spróbuj ponownie
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <DataTable
          data={data.items}
          columns={columns}
          getRowId={row => String(row.id)}
          search={{ enabled: true, placeholder: 'Szukaj raportów…' }}
          visibility={{ enabled: true }}
          pagination={{ pageSizeOptions: [10, 20, 50], initialPageSize: 10 }}
          persistence={{ search: true, sorting: true, columnFilters: true }}
          reorder={false}
          sorting={{}}
          toolbar={{
            right: (
              <Button size="sm" render={<Link href="/reports/new" />}>
                <PlusIcon />
                <span className="hidden lg:inline">Dodaj raport</span>
              </Button>
            ),
          }}
          emptyState="Brak raportów."
          noResultsState="Brak raportów pasujących do wyszukiwania."
        />
      </div>
      <GenerationDrawer
        report={generatingReport}
        onClose={() => setGeneratingReport(null)}
      />
    </>
  )
}
