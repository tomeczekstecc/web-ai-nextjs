import { dehydrate, HydrationBoundary } from "@tanstack/react-query"

import { DomainLayout } from "@/components/domain-layout"
import { TasksListTable } from "@/components/tasks-wizard/tasks-list-table"
import { taskListOptions } from "@/lib/api/domains/tasks/query-options"
import { getQueryClient } from "@/lib/query/client"

const BREADCRUMBS = [
  { label: "Home", href: "/dashboard" },
  { label: "Zadania" },
]

export default async function WizardDemoPage() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(taskListOptions())

  return (
    <DomainLayout breadcrumbs={BREADCRUMBS}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TasksListTable />
      </HydrationBoundary>
    </DomainLayout>
  )
}
