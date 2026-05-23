"use client"

import { useQuery } from "@tanstack/react-query"
import { PlusIcon } from "lucide-react"
import Link from "next/link"

import { DataTable, DataTableSkeleton } from "@/components/data-table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { applicationsListOptions } from "@/lib/api/domains/applications/query-options"
import { allApplicationsColumns } from "./all-applications-columns"

const DEFAULT_PARAMS = {
  page: 1,
  pageSize: 10,
  search: undefined,
  status: undefined,
  sort: undefined,
} as const

export function AllApplicationsTable() {
  const { data, isLoading, isError, refetch } = useQuery(
    applicationsListOptions(DEFAULT_PARAMS),
  )

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
          <AlertDescription>Nie udało się załadować wniosków.</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => refetch()}
        >
          Spróbuj ponownie
        </Button>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
      <DataTable
        data={data.items}
        columns={allApplicationsColumns}
        getRowId={(row) => row.id}
        search={{ enabled: true, placeholder: "Szukaj wniosków…" }}
        visibility={{ enabled: true }}
        pagination={{ pageSizeOptions: [10, 20, 50], initialPageSize: 10 }}
        persistence={{ search: true, sorting: true, columnFilters: true }}
        reorder={false}
        sorting={{}}
        toolbar={{
          right: (
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/applications/new" />}
            >
              <PlusIcon />
              <span className="hidden lg:inline">Nowy wniosek</span>
            </Button>
          ),
        }}
        emptyState="Brak wniosków."
        noResultsState="Brak wniosków pasujących do wyszukiwania."
      />
    </div>
  )
}
