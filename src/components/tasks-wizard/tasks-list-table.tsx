"use client"

import { useQuery } from "@tanstack/react-query"
import { resolveIcon } from "@/lib/icons"

const PlusIcon = resolveIcon("Plus");
import Link from "next/link"

import { DataTable, DataTableSkeleton } from "@/components/data-table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { taskListOptions } from "@/lib/api/domains/tasks/query-options"
import { tasksListColumns } from "./tasks-list-columns"

export function TasksListTable() {
  const { data: tasks, isLoading, isError, refetch } = useQuery(taskListOptions())

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <DataTableSkeleton rows={5} />
      </div>
    )
  }

  if (isError || !tasks) {
    return (
      <div className="flex flex-col gap-3 px-4 py-4 lg:px-6">
        <Alert variant="destructive">
          <AlertDescription>Nie udało się załadować zadań.</AlertDescription>
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
        data={tasks}
        columns={tasksListColumns}
        getRowId={(row) => String(row.id)}
        search={{ enabled: true, placeholder: "Szukaj zadań…" }}
        visibility={{ enabled: true }}
        pagination={{ pageSizeOptions: [10, 20, 30], initialPageSize: 10 }}
        persistence={{ search: true, sorting: true, columnFilters: true }}
        reorder={false}
        sorting={{}}
        toolbar={{
          right: (
            <Button size="sm" nativeButton={false} render={<Link href="/wizard-demo/new" />}>
              <PlusIcon />
              <span className="hidden lg:inline">Nowe zadanie</span>
            </Button>
          ),
        }}
        emptyState="Brak zadań."
        noResultsState="Brak zadań pasujących do wyszukiwania."
      />
    </div>
  )
}
