"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { RowSelectionState } from "@tanstack/react-table"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { DataTable, DataTableSkeleton } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { dashboardReviewItemsOptions } from "@/lib/api/domains/dashboard/query-options"
import { AddProjectDrawer } from "./add-project-dialog"
import { dashboardColumns } from "./dashboard-columns"
import { DashboardBulkActions } from "./dashboard-bulk-actions"

export function DashboardDataTable() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const selectedIds = Object.keys(rowSelection).map(Number)

  const { data: reviewItemsData, isLoading, isError, refetch } = useQuery(
    dashboardReviewItemsOptions(),
  )

  if (isLoading) {
    return (
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <Skeleton className="h-7 w-52" />
        <DataTableSkeleton rows={5} />
      </div>
    )
  }

  if (isError || !reviewItemsData) {
    return (
      <div className="px-4 lg:px-6 py-4 flex flex-col gap-3">
        <Alert variant="destructive">
          <AlertDescription>Nie udało się załadować danych.</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" className="w-fit" onClick={() => refetch()}>
          Spróbuj ponownie
        </Button>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
      <h2 className="text-xl font-semibold tracking-tight">
        Najważniejsze konkursy
      </h2>
      <DataTable
        data={reviewItemsData?.items ?? []}
        columns={dashboardColumns}
        getRowId={(row) => `${row.id}`}
        search={{
          enabled: true,
          placeholder: "Szukaj projektów...",
        }}
        visibility={{ enabled: true }}
        selection={{ enabled: true, state: rowSelection, onChange: setRowSelection }}
        pagination={{
          pageSizeOptions: [10, 20, 30, 40, 50],
          initialPageSize: 10,
        }}
        persistence={{ search: true, columnVisibility: true, sorting: true, columnFilters: true }}
        reorder={false}
        sorting={{}}
        toolbar={{
          selectionContent: (
            <DashboardBulkActions
              selectedIds={selectedIds}
              onClear={() => setRowSelection({})}
            />
          ),
          right: <AddProjectDrawer />,
        }}
        emptyState="Brak projektów."
        noResultsState="Brak projektów pasujących do wyszukiwania."
      />
    </div>
  )
}
